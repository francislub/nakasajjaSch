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

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get report card stats
    const totalReports = await prisma.reportCard.count({
      where: {
        student: {
          academicYearId: activeAcademicYear.id,
        },
      },
    })

    const approvedReports = await prisma.reportCard.count({
      where: {
        isApproved: true,
        student: {
          academicYearId: activeAcademicYear.id,
        },
      },
    })

    const pendingReports = totalReports - approvedReports

    // Get grade distribution from report cards
    const reportCards = await prisma.reportCard.findMany({
      where: {
        student: {
          academicYearId: activeAcademicYear.id,
        },
      },
    })

    // Calculate grade distribution based on personal assessment
    const gradeDistribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    }

    reportCards.forEach((report) => {
      const grades = [
        report.discipline,
        report.cleanliness,
        report.classWorkPresentation,
        report.adherenceToSchool,
        report.coCurricularActivities,
        report.considerationToOthers,
        report.speakingEnglish,
      ]

      grades.forEach((grade) => {
        if (grade && gradeDistribution.hasOwnProperty(grade)) {
          gradeDistribution[grade as keyof typeof gradeDistribution]++
        }
      })
    })

    // Get class distribution
    const classDistribution = await prisma.class.findMany({
      where: {
        academicYearId: activeAcademicYear.id,
      },
      include: {
        students: {
          include: {
            reportCards: true,
          },
        },
      },
    })

    const classReportStats = classDistribution.map((cls) => ({
      className: cls.name,
      reportCount: cls.students.reduce((acc, student) => acc + student.reportCards.length, 0),
    }))

    const stats = {
      totalReports,
      approvedReports,
      pendingReports,
      gradeDistribution,
      classDistribution: classReportStats,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching report stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
