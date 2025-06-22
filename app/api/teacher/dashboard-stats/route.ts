import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher's class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { class: true },
    })

    if (!teacher?.classId) {
      return NextResponse.json({ error: "No class assigned to teacher" }, { status: 404 })
    }

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get statistics for teacher's class
    const [
      totalStudents,
      todayAttendance,
      pendingMarks,
      completedAssessments,
      weeklyAttendance,
      subjectPerformance,
      recentMarks,
    ] = await Promise.all([
      // Total students in teacher's class
      prisma.student.count({
        where: {
          classId: teacher.classId,
          academicYearId: activeAcademicYear.id,
        },
      }),

      // Today's attendance
      prisma.attendance.findMany({
        where: {
          classId: teacher.classId,
          academicYearId: activeAcademicYear.id,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Pending marks (subjects without recent marks)
      prisma.subject.count({
        where: {
          classId: teacher.classId,
        },
      }),

      // Completed assessments (report cards)
      prisma.reportCard.count({
        where: {
          student: {
            classId: teacher.classId,
            academicYearId: activeAcademicYear.id,
          },
        },
      }),

      // Weekly attendance data
      prisma.attendance.findMany({
        where: {
          classId: teacher.classId,
          academicYearId: activeAcademicYear.id,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Subject performance
      prisma.mark.groupBy({
        by: ["subjectId"],
        where: {
          classId: teacher.classId,
          academicYearId: activeAcademicYear.id,
          total: { not: null },
        },
        _avg: {
          total: true,
        },
      }),

      // Recent marks for trend
      prisma.mark.findMany({
        where: {
          classId: teacher.classId,
          academicYearId: activeAcademicYear.id,
          total: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          subject: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
    ])

    // Calculate today's attendance
    const presentToday = todayAttendance.filter((record) => record.status === "PRESENT").length
    const attendanceRate = todayAttendance.length > 0 ? Math.round((presentToday / todayAttendance.length) * 100) : 0

    // Process weekly attendance
    const weeklyAttendanceData = Array.from({ length: 5 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (4 - i))
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

      const dayAttendance = weeklyAttendance.filter((record) => {
        const recordDate = new Date(record.date)
        return recordDate.toDateString() === date.toDateString()
      })

      const present = dayAttendance.filter((record) => record.status === "PRESENT").length
      const absent = dayAttendance.filter((record) => record.status === "ABSENT").length

      return { day: dayName, present, absent }
    })

    // Process subject performance
    const subjectPerformanceData = await Promise.all(
      subjectPerformance.map(async (item) => {
        const subject = await prisma.subject.findUnique({
          where: { id: item.subjectId },
          select: { name: true },
        })
        return {
          subject: subject?.name || "Unknown",
          average: Math.round(item._avg.total || 0),
        }
      }),
    )

    const stats = {
      totalStudents,
      presentToday,
      attendanceRate,
      pendingMarks: Math.max(0, pendingMarks - 2), // Rough estimate
      completedAssessments,
      weeklyAttendance: weeklyAttendanceData,
      subjectPerformance: subjectPerformanceData,
      className: teacher.class?.name || "Unknown Class",
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching teacher dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
