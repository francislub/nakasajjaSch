import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEADTEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get statistics
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      attendanceRecords,
      reportCards,
      classDistribution,
      monthlyRegistrations,
      performanceData,
    ] = await Promise.all([
      // Total students in active academic year
      prisma.student.count({
        where: { academicYearId: activeAcademicYear.id },
      }),

      // Total class teachers
      prisma.user.count({
        where: { role: "CLASS_TEACHER" },
      }),

      // Total classes in active academic year
      prisma.class.count({
        where: { academicYearId: activeAcademicYear.id },
      }),

      // Total subjects
      prisma.subject.count(),

      // Attendance records for last 7 days
      prisma.attendance.findMany({
        where: {
          academicYearId: activeAcademicYear.id,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Report cards count
      prisma.reportCard.count(),

      // Class distribution
      prisma.class.findMany({
        where: { academicYearId: activeAcademicYear.id },
        include: {
          students: true,
        },
      }),

      // Monthly registrations (last 6 months)
      prisma.student.findMany({
        where: {
          academicYearId: activeAcademicYear.id,
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
        },
      }),

      // Performance data by class
      prisma.mark.groupBy({
        by: ["classId"],
        where: {
          academicYearId: activeAcademicYear.id,
          total: { not: null },
        },
        _avg: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
    ])

    // Calculate attendance rate
    const presentCount = attendanceRecords.filter((record) => record.status === "PRESENT").length
    const attendanceRate =
      attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0

    // Process class distribution
    const classDistributionData = classDistribution.map((cls) => ({
      name: cls.name,
      students: cls.students.length,
    }))

    // Process monthly registrations
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthName = date.toLocaleDateString("en-US", { month: "short" })
      const count = monthlyRegistrations.filter((student) => {
        const studentMonth = new Date(student.createdAt).getMonth()
        const targetMonth = date.getMonth()
        return studentMonth === targetMonth
      }).length

      return { month: monthName, students: count }
    })

    // Process performance data
    const performanceByClass = await Promise.all(
      performanceData.map(async (item) => {
        const classInfo = await prisma.class.findUnique({
          where: { id: item.classId },
          select: { name: true },
        })
        return {
          class: classInfo?.name || "Unknown",
          average: Math.round(item._avg.total || 0),
          count: item._count.id,
        }
      }),
    )

    // Weekly attendance data
    const weeklyAttendance = Array.from({ length: 5 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (4 - i))
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

      const dayAttendance = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.date)
        return recordDate.toDateString() === date.toDateString()
      })

      const dayPresent = dayAttendance.filter((record) => record.status === "PRESENT").length
      const dayTotal = dayAttendance.length
      const rate = dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0

      return { day: dayName, rate, present: dayPresent, total: dayTotal }
    })

    const stats = {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      attendanceRate,
      reportCardsGenerated: reportCards,
      classDistribution: classDistributionData,
      monthlyRegistrations: monthlyData,
      performanceByClass,
      weeklyAttendance,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
