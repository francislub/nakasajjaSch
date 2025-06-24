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
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const classId = searchParams.get("classId")

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const today = new Date()
    const startOfToday = new Date(today.setHours(0, 0, 0, 0))
    const endOfToday = new Date(today.setHours(23, 59, 59, 999))

    // Base where clause
    const baseWhere: any = {
      academicYearId: activeAcademicYear.id,
    }

    if (classId) {
      baseWhere.classId = classId
    }

    // Get total students
    const totalStudents = await prisma.student.count({
      where: {
        academicYearId: activeAcademicYear.id,
        ...(classId && { classId }),
      },
    })

    // Get today's attendance
    const todayAttendance = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        ...baseWhere,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _count: {
        status: true,
      },
    })

    const presentToday = todayAttendance.find((a) => a.status === "PRESENT")?._count.status || 0
    const absentToday = todayAttendance.find((a) => a.status === "ABSENT")?._count.status || 0
    const lateToday = todayAttendance.find((a) => a.status === "LATE")?._count.status || 0

    // Calculate attendance rate
    const attendanceRate = totalStudents > 0 ? Math.round(((presentToday + lateToday) / totalStudents) * 100) : 0

    // Get weekly trend (last 7 days)
    const weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))

      const dayAttendance = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          ...baseWhere,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _count: {
          status: true,
        },
      })

      weeklyTrend.push({
        date: startOfDay.toISOString(),
        present: dayAttendance.find((a) => a.status === "PRESENT")?._count.status || 0,
        absent: dayAttendance.find((a) => a.status === "ABSENT")?._count.status || 0,
        late: dayAttendance.find((a) => a.status === "LATE")?._count.status || 0,
      })
    }

    // Get class attendance if not filtering by specific class
    let classAttendance = []
    if (!classId) {
      const classes = await prisma.class.findMany({
        where: { academicYearId: activeAcademicYear.id },
        include: {
          attendance: {
            where: {
              date: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
          },
          students: true,
        },
      })

      classAttendance = classes.map((cls) => {
        const present = cls.attendance.filter((a) => a.status === "PRESENT").length
        const absent = cls.attendance.filter((a) => a.status === "ABSENT").length
        const late = cls.attendance.filter((a) => a.status === "LATE").length
        const total = cls.students.length
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

        return {
          className: cls.name,
          present,
          absent,
          late,
          rate,
        }
      })
    }

    const stats = {
      totalStudents,
      presentToday,
      absentToday,
      lateToday,
      attendanceRate,
      weeklyTrend,
      classAttendance,
      monthlyStats: [], // Can be implemented for longer term trends
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching attendance stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
