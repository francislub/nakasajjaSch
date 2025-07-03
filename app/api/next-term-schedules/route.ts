import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schedules = await prisma.nextTermSchedule.findMany({
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ academicYear: { year: "desc" } }, { term: { name: "asc" } }],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching next term schedules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { academicYearId, termId, nextTermStartDate, nextTermEndDate } = body

    if (!academicYearId || !termId) {
      return NextResponse.json({ error: "Academic Year ID and Term ID are required" }, { status: 400 })
    }

    // Check if schedule already exists for this academic year and term
    const existingSchedule = await prisma.nextTermSchedule.findUnique({
      where: {
        academicYearId_termId: {
          academicYearId,
          termId,
        },
      },
    })

    if (existingSchedule) {
      return NextResponse.json({ error: "Schedule already exists for this academic year and term" }, { status: 400 })
    }

    const schedule = await prisma.nextTermSchedule.create({
      data: {
        academicYearId,
        termId,
        nextTermStartDate: nextTermStartDate ? new Date(nextTermStartDate) : null,
        nextTermEndDate: nextTermEndDate ? new Date(nextTermEndDate) : null,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("Error creating next term schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
