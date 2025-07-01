import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const terms = await prisma.term.findMany({
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
        students: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    // Transform the data to include student count
    const transformedTerms = terms.map((term) => ({
      ...term,
      studentCount: term._count.students,
    }))

    return NextResponse.json(transformedTerms)
  } catch (error) {
    console.error("Error fetching terms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, startDate, endDate, academicYearId } = await request.json()

    if (!name || !startDate || !endDate || !academicYearId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    })

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
    }

    // Check for overlapping terms in the same academic year
    const overlappingTerm = await prisma.term.findFirst({
      where: {
        academicYearId,
        OR: [
          {
            AND: [{ startDate: { lte: new Date(startDate) } }, { endDate: { gte: new Date(startDate) } }],
          },
          {
            AND: [{ startDate: { lte: new Date(endDate) } }, { endDate: { gte: new Date(endDate) } }],
          },
          {
            AND: [{ startDate: { gte: new Date(startDate) } }, { endDate: { lte: new Date(endDate) } }],
          },
        ],
      },
    })

    if (overlappingTerm) {
      return NextResponse.json({ error: "Term dates overlap with existing term" }, { status: 400 })
    }

    const term = await prisma.term.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYearId,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
        students: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...term,
      studentCount: term._count.students,
    })
  } catch (error) {
    console.error("Error creating term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
