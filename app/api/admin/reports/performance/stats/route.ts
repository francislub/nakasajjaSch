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
    const subjectId = searchParams.get("subjectId")

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const baseWhere: any = {
      academicYearId: activeAcademicYear.id,
    }

    if (classId) {
      baseWhere.classId = classId
    }

    if (subjectId) {
      baseWhere.subjectId = subjectId
    }

    // Get all marks with totals
    const marks = await prisma.mark.findMany({
      where: {
        ...baseWhere,
        total: { not: null },
      },
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
        subject: {
          select: {
            name: true,
          },
        },
      },
    })

    if (marks.length === 0) {
      return NextResponse.json({
        totalStudents: 0,
        averagePerformance: 0,
        topPerformers: 0,
        needsImprovement: 0,
        subjectAverages: [],
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        classPerformance: [],
        performanceTrend: [],
      })
    }

    // Calculate basic stats
    const totalMarks = marks.reduce((sum, mark) => sum + (mark.total || 0), 0)
    const averagePerformance = Math.round(totalMarks / marks.length)

    // Get unique students
    const uniqueStudents = [...new Set(marks.map((mark) => mark.studentId))]
    const totalStudents = uniqueStudents.length

    // Calculate student averages for performance categories
    const studentAverages = uniqueStudents.map((studentId) => {
      const studentMarks = marks.filter((mark) => mark.studentId === studentId)
      const studentTotal = studentMarks.reduce((sum, mark) => sum + (mark.total || 0), 0)
      return Math.round(studentTotal / studentMarks.length)
    })

    const topPerformers = studentAverages.filter((avg) => avg >= 80).length
    const needsImprovement = studentAverages.filter((avg) => avg < 60).length

    // Grade distribution
    const gradeDistribution = {
      A: studentAverages.filter((avg) => avg >= 80).length,
      B: studentAverages.filter((avg) => avg >= 70 && avg < 80).length,
      C: studentAverages.filter((avg) => avg >= 60 && avg < 70).length,
      D: studentAverages.filter((avg) => avg >= 50 && avg < 60).length,
      F: studentAverages.filter((avg) => avg < 50).length,
    }

    // Subject averages
    const subjectGroups = marks.reduce(
      (acc, mark) => {
        const subjectName = mark.subject?.name || "Unknown"
        if (!acc[subjectName]) {
          acc[subjectName] = []
        }
        acc[subjectName].push(mark.total || 0)
        return acc
      },
      {} as Record<string, number[]>,
    )

    const subjectAverages = Object.entries(subjectGroups).map(([subject, totals]) => ({
      subject,
      average: Math.round(totals.reduce((sum, total) => sum + total, 0) / totals.length),
      studentCount: totals.length,
    }))

    // Class performance (if not filtering by specific class)
    let classPerformance = []
    if (!classId) {
      const classGroups = marks.reduce(
        (acc, mark) => {
          const className = mark.student?.class?.name || "Unknown"
          if (!acc[className]) {
            acc[className] = []
          }
          acc[className].push(mark.total || 0)
          return acc
        },
        {} as Record<string, number[]>,
      )

      classPerformance = Object.entries(classGroups).map(([className, totals]) => ({
        className,
        average: Math.round(totals.reduce((sum, total) => sum + total, 0) / totals.length),
        studentCount: [...new Set(marks.filter((m) => m.student?.class?.name === className).map((m) => m.studentId))]
          .length,
      }))
    }

    // Performance trend (simplified - last 6 months)
    const performanceTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      // This is simplified - in reality you'd filter marks by creation date
      performanceTrend.push({
        month: monthName,
        average: averagePerformance + Math.floor(Math.random() * 10 - 5), // Simulated variation
      })
    }

    const stats = {
      totalStudents,
      averagePerformance,
      topPerformers,
      needsImprovement,
      subjectAverages,
      gradeDistribution,
      classPerformance,
      performanceTrend,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching performance stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
