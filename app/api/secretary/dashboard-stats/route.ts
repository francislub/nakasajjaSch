import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SECRETARY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get current term (most recent term for the academic year)
    const currentTerm = await prisma.term.findFirst({
      where: {
        academicYearId: activeAcademicYear.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Parallel data fetching for better performance
    const [totalStudents, totalClasses, totalSubjects, marksCount, recentStudents, classesWithCounts, subjectMarks] =
      await Promise.all([
        // Total students
        prisma.student.count({
          where: { academicYearId: activeAcademicYear.id },
        }),

        // Total classes
        prisma.class.count({
          where: { academicYearId: activeAcademicYear.id },
        }),

        // Total subjects
        prisma.subject.count(),

        // Total marks entered
        prisma.mark.count({
          where: { academicYearId: activeAcademicYear.id },
        }),

        // Recent registrations (last 5)
        prisma.student.findMany({
          where: { academicYearId: activeAcademicYear.id },
          include: {
            class: {
              select: { name: true },
            },
            parent: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),

        // Classes with student counts
        prisma.class.findMany({
          where: { academicYearId: activeAcademicYear.id },
          include: {
            students: {
              where: { academicYearId: activeAcademicYear.id },
              select: { id: true },
            },
            subjects: {
              select: { id: true },
            },
            _count: {
              select: {
                students: {
                  where: { academicYearId: activeAcademicYear.id },
                },
              },
            },
          },
        }),

        // Subject performance data
        prisma.subject.findMany({
          include: {
            marks: {
              where: {
                academicYearId: activeAcademicYear.id,
                total: { not: null },
              },
              select: {
                total: true,
                studentId: true,
              },
            },
          },
        }),
      ])

    // Calculate class statistics
    const studentsPerClass = await Promise.all(
      classesWithCounts.map(async (classItem) => {
        const marksForClass = await prisma.mark.count({
          where: {
            classId: classItem.id,
            academicYearId: activeAcademicYear.id,
          },
        })

        const totalPossibleMarks = classItem.students.length * classItem.subjects.length
        const completionRate = totalPossibleMarks > 0 ? Math.round((marksForClass / totalPossibleMarks) * 100) : 0

        return {
          className: classItem.name,
          studentCount: classItem._count.students,
          subjectCount: classItem.subjects.length,
          marksEntered: marksForClass,
          completionRate,
        }
      }),
    )

    // Calculate subject performance
    const subjectPerformance = subjectMarks
      .map((subject) => {
        const validMarks = subject.marks.filter((mark) => mark.total !== null)
        if (validMarks.length === 0) return null

        const averageScore = Math.round(
          validMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / validMarks.length,
        )

        // Calculate grade based on average
        let grade = "F"
        if (averageScore >= 80) grade = "A"
        else if (averageScore >= 70) grade = "B"
        else if (averageScore >= 60) grade = "C"
        else if (averageScore >= 50) grade = "D"

        return {
          subjectName: subject.name,
          averageScore,
          totalStudents: new Set(validMarks.map((mark) => mark.studentId)).size,
          grade,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.averageScore || 0) - (a?.averageScore || 0))
      .slice(0, 6) // Top 6 subjects

    // Calculate overall completion rate
    const totalPossibleMarks = totalStudents * totalSubjects
    const completionRate = totalPossibleMarks > 0 ? Math.round((marksCount / totalPossibleMarks) * 100) : 0

    // Get real recent activity from database
    const recentActivity = await Promise.all([
      // Recent marks entries
      prisma.mark.findMany({
        where: { academicYearId: activeAcademicYear.id },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),

      // Recent student registrations
      prisma.student.findMany({
        where: { academicYearId: activeAcademicYear.id },
        include: {
          class: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]).then(([recentMarks, recentRegistrations]) => {
      const activities = []

      // Add mark entries to activity
      recentMarks.forEach((mark, index) => {
        activities.push({
          id: `mark-${mark.id}`,
          type: "MARK_ENTRY" as const,
          description: `${mark.subject?.name || "Subject"} marks entered for ${mark.class?.name || "Class"}`,
          timestamp: mark.createdAt.toISOString(),
          user: session.user.name || "Secretary",
        })
      })

      // Add registrations to activity
      recentRegistrations.forEach((student, index) => {
        activities.push({
          id: `student-${student.id}`,
          type: "STUDENT_REGISTRATION" as const,
          description: `New student ${student.name} registered in ${student.class?.name || "Class"}`,
          timestamp: student.createdAt.toISOString(),
          user: session.user.name || "Secretary",
        })
      })

      // Sort by timestamp and take latest 5
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
    })

    const dashboardStats = {
      totalStudents,
      totalClasses,
      totalSubjects,
      marksEntered: marksCount,
      pendingReports: 0, // You can implement this based on your requirements
      completionRate,
      recentRegistrations: recentStudents.map((student) => ({
        id: student.id,
        name: student.name,
        photo: student.photo,
        class: {
          name: student.class?.name || "Unknown",
        },
        parent: {
          name: student.parent?.name || "Unknown",
          email: student.parent?.email || "",
        },
        createdAt: student.createdAt.toISOString(),
      })),
      studentsPerClass,
      subjectPerformance,
      recentActivity,
      academicYear: activeAcademicYear.name,
      currentTerm: currentTerm?.name || "No active term",
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error("Error fetching secretary dashboard stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
