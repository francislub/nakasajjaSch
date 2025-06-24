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
    const studentId = searchParams.get("studentId")
    const reportId = searchParams.get("reportId")

    if (!studentId || !reportId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get student and report card data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        term: true,
        parent: true,
        reportCards: {
          where: { id: reportId },
        },
        marks: {
          include: {
            subject: true,
          },
        },
      },
    })

    if (!student || student.reportCards.length === 0) {
      return NextResponse.json({ error: "Student or report card not found" }, { status: 404 })
    }

    const reportCard = student.reportCards[0]

    // Generate PDF content (simplified - in real implementation, use a PDF library)
    const pdfContent = {
      student: {
        name: student.name,
        class: student.class?.name,
        term: student.term?.name,
        photo: student.photo,
      },
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
      marks: student.marks.map((mark) => ({
        subject: mark.subject?.name,
        score: mark.total,
        grade: mark.grade,
      })),
    }

    // In a real implementation, you would generate a PDF here
    // For now, return JSON data that could be used to generate PDF on frontend
    const response = new Response(JSON.stringify(pdfContent, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="report-card-${student.name}.json"`,
      },
    })

    return response
  } catch (error) {
    console.error("Error downloading report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
