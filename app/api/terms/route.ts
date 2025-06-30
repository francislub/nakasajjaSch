import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER", "TEACHER", "CLASS_TEACHER", "SECRETARY"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get("academicYearId")

    let whereClause = {}

    if (academicYearId) {
      whereClause = {
        academicYearId: academicYearId,
      }
    }

    const terms = await prisma.term.findMany({
      where: whereClause,
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(terms, { status: 200 })
  } catch (error) {
    console.error("Error fetching terms:", error)
    return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, startDate, endDate, academicYearId } = await req.json()

    if (!name || !startDate || !endDate || !academicYearId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    })

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
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
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(term, { status: 201 })
  } catch (error) {
    console.error("Error creating term:", error)
    return NextResponse.json({ error: "Failed to create term" }, { status: 500 })
  }
}
