import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { classId, status } = body

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const whereClause: any = {
      student: {
        academicYearId: activeAcademicYear.id,
      },
    }

    if (classId) {
      whereClause.student.classId = classId
    }

    if (status === "approved") {
      whereClause.isApproved = true
    } else if (status === "pending") {
      whereClause.isApproved = false
    }

    const reportCards = await prisma.reportCard.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: true,
            term: true,
            parent: true,
            marks: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    })

    // Generate bulk data (in real implementation, create ZIP file with PDFs)
    const bulkData = reportCards.map((reportCard) => ({
      studentName: reportCard.student.name,
      className: reportCard.student.class?.name,
      termName: reportCard.student.term?.name,
      reportCard: {
        discipline: reportCard.discipline,
        cleanliness: reportCard.cleanliness,
        classWorkPresentation: reportCard.classWorkPresentation,
        adherenceToSchool: reportCard.adherenceToSchool,
        coCurricularActivities: reportCard.coCurricularActivities,
        considerationToOthers: reportCard.considerationToOthers,
        speakingEnglish: reportCard.speakingEnglish,
        classTeacherComment: reportCard.classTeacherComment,
        headteacherComment: reportCard.headteacherComment,
      },
      marks: reportCard.student.marks.map((mark) => ({
        subject: mark.subject?.name,
        score: mark.total,
        grade: mark.grade,
      })),
    }))

    const response = new Response(JSON.stringify(bulkData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=bulk-report-cards.json",
      },
    })

    return response
  } catch (error) {
    console.error("Error bulk downloading reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
