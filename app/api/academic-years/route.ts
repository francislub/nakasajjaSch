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

    const academicYears = await prisma.academicYear.findMany({
      include: {
        terms: {
          select: {
            id: true,
            name: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
          },
        },
        students: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            terms: true,
            classes: true,
            students: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    // Transform the data to include counts
    const transformedAcademicYears = academicYears.map((year) => ({
      ...year,
      termsCount: year._count.terms,
      classesCount: year._count.classes,
      studentsCount: year._count.students,
    }))

    return NextResponse.json(transformedAcademicYears)
  } catch (error) {
    console.error("Error fetching academic years:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { year, startDate, endDate, isActive } = await request.json()

    if (!year || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If setting as active, deactivate all other academic years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    // Check for overlapping academic years
    const overlappingYear = await prisma.academicYear.findFirst({
      where: {
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

    if (overlappingYear) {
      return NextResponse.json({ error: "Academic year dates overlap with existing year" }, { status: 400 })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
      },
      include: {
        terms: {
          select: {
            id: true,
            name: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
          },
        },
        students: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            terms: true,
            classes: true,
            students: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...academicYear,
      termsCount: academicYear._count.terms,
      classesCount: academicYear._count.classes,
      studentsCount: academicYear._count.students,
    })
  } catch (error) {
    console.error("Error creating academic year:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
