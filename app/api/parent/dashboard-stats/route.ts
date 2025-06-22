import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get parent's children
    const children = await prisma.student.findMany({
      where: { parentId: session.user.id },
      include: {
        class: true,
        term: true,
        marks: {
          include: {
            subject: true,
          },
        },
        attendance: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        reportCards: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    const stats = children.map((child) => {
      const totalMarks = child.marks.length
      const averageMark =
        totalMarks > 0 ? Math.round(child.marks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks) : 0

      const totalAttendanceDays = child.attendance.length
      const presentDays = child.attendance.filter((a) => a.status === "PRESENT").length
      const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0

      const subjectPerformance = child.marks.reduce(
        (acc, mark) => {
          const subjectName = mark.subject.name
          if (!acc[subjectName]) {
            acc[subjectName] = []
          }
          acc[subjectName].push(mark.total || 0)
          return acc
        },
        {} as Record<string, number[]>,
      )

      const subjectAverages = Object.entries(subjectPerformance).map(([subject, marks]) => ({
        subject,
        average: Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length),
      }))

      return {
        id: child.id,
        name: child.name,
        class: child.class.name,
        term: child.term.name,
        averageMark,
        attendanceRate,
        totalSubjects: Object.keys(subjectPerformance).length,
        hasReportCard: child.reportCards.length > 0,
        subjectAverages,
        recentAttendance: child.attendance.slice(-7).map((a) => ({
          date: a.date,
          status: a.status,
        })),
      }
    })

    return NextResponse.json({
      children: stats,
      totalChildren: children.length,
      overallAverage:
        stats.length > 0 ? Math.round(stats.reduce((sum, child) => sum + child.averageMark, 0) / stats.length) : 0,
      overallAttendance:
        stats.length > 0 ? Math.round(stats.reduce((sum, child) => sum + child.attendanceRate, 0) / stats.length) : 0,
    })
  } catch (error) {
    console.error("Error fetching parent dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
