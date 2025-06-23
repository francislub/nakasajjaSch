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

    // Get active academic year or create default stats
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    // If no active academic year, return default stats
    if (!activeAcademicYear) {
      return NextResponse.json({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalSubjects: 0,
        attendanceRate: 0,
        reportCardsGenerated: 0,
        classDistribution: [],
        monthlyRegistrations: Array.from({ length: 6 }, (_, i) => {
          const date = new Date()
          date.setMonth(date.getMonth() - (5 - i))
          return { month: date.toLocaleDateString("en-US", { month: "short" }), students: 0 }
        }),
        performanceByClass: [],
        weeklyAttendance: Array.from({ length: 5 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (4 - i))
          return {
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            rate: 0,
            present: 0,
            total: 0,
          }
        }),
      })
    }

    // Get statistics with proper error handling
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      attendanceRecords,
      reportCards,
      classDistribution,
      monthlyRegistrations,
    ] = await Promise.all([
      prisma.student
        .count({
          where: { academicYearId: activeAcademicYear.id },
        })
        .catch(() => 0),

      prisma.user
        .count({
          where: { role: "CLASS_TEACHER" },
        })
        .catch(() => 0),

      prisma.class
        .count({
          where: { academicYearId: activeAcademicYear.id },
        })
        .catch(() => 0),

      prisma.subject.count().catch(() => 0),

      prisma.attendance
        .findMany({
          where: {
            academicYearId: activeAcademicYear.id,
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        })
        .catch(() => []),

      prisma.reportCard.count().catch(() => 0),

      prisma.class
        .findMany({
          where: { academicYearId: activeAcademicYear.id },
          include: {
            students: true,
          },
        })
        .catch(() => []),

      prisma.student
        .findMany({
          where: {
            academicYearId: activeAcademicYear.id,
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            createdAt: true,
          },
        })
        .catch(() => []),
    ])

    // Calculate attendance rate
    const presentCount = attendanceRecords.filter((record) => record.status === "PRESENT").length
    const attendanceRate =
      attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0

    // Process class distribution
    const classDistributionData = classDistribution.map((cls) => ({
      name: cls.name,
      students: cls.students?.length || 0,
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
      performanceByClass: [],
      weeklyAttendance,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
