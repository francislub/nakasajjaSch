import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get("academicYearId")
    const termId = searchParams.get("termId")

    if (!academicYearId) {
      return NextResponse.json({ error: "Academic Year ID is required" }, { status: 400 })
    }

    // Build where clause for students
    const studentWhereClause: any = {
      academicYearId: academicYearId,
    }

    if (termId) {
      studentWhereClause.termId = termId
    }

    // Build where clause for report cards
    const reportCardWhereClause: any = {
      student: studentWhereClause,
    }

    // Get total reports
    const totalReports = await prisma.reportCard.count({
      where: reportCardWhereClause,
    })

    // Get approved reports
    const approvedReports = await prisma.reportCard.count({
      where: {
        ...reportCardWhereClause,
        isApproved: true,
      },
    })

    const pendingReports = totalReports - approvedReports

    // Get grade distribution from marks
    const marks = await prisma.mark.findMany({
      where: {
        academicYearId: academicYearId,
        ...(termId && { termId: termId }),
        grade: { not: null },
      },
      select: {
        grade: true,
      },
    })

    const gradeDistribution = {
      A: marks.filter((m) => m.grade === "A").length,
      B: marks.filter((m) => m.grade === "B").length,
      C: marks.filter((m) => m.grade === "C").length,
      D: marks.filter((m) => m.grade === "D").length,
    }

    // Get class distribution
    const reportCardsByClass = await prisma.reportCard.findMany({
      where: reportCardWhereClause,
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
    })

    const classDistribution = reportCardsByClass.reduce(
      (acc, reportCard) => {
        const className = reportCard.student?.class?.name || "Unknown"
        const existing = acc.find((item) => item.className === className)
        if (existing) {
          existing.reportCount++
        } else {
          acc.push({ className, reportCount: 1 })
        }
        return acc
      },
      [] as Array<{ className: string; reportCount: number }>,
    )

    return NextResponse.json({
      totalReports,
      approvedReports,
      pendingReports,
      gradeDistribution,
      classDistribution,
    })
  } catch (error) {
    console.error("Error fetching report stats:", error)
    return NextResponse.json({ error: "Failed to fetch report stats" }, { status: 500 })
  }
}
