import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const search = searchParams.get("search")
    const date = searchParams.get("date")

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const whereClause: any = {
      academicYearId: activeAcademicYear.id,
    }

    if (classId) {
      whereClause.classId = classId
    }

    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    if (search) {
      whereClause.student = {
        name: {
          contains: search,
          mode: "insensitive",
        },
      }
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { student: { name: "asc" } }],
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
