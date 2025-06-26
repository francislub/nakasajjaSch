import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportCards, termId, academicYearId } = body

    const results = []

    // Process each report card
    for (const report of reportCards) {
      try {
        // Check if report already exists
        const existingReport = await prisma.reportCard.findFirst({
          where: {
            studentId: report.studentId,
            termId,
            academicYearId,
          },
        })

        let reportCard

        if (existingReport) {
          // Update existing report
          reportCard = await prisma.reportCard.update({
            where: { id: existingReport.id },
            data: {
              discipline: report.discipline,
              cleanliness: report.cleanliness,
              classWorkPresentation: report.classWorkPresentation,
              adherenceToSchool: report.adherenceToSchool,
              coCurricularActivities: report.coCurricularActivities,
              considerationToOthers: report.considerationToOthers,
              speakingEnglish: report.speakingEnglish,
              classTeacherComment: report.classTeacherComment,
              updatedAt: new Date(),
            },
            include: {
              student: {
                include: {
                  class: true,
                },
              },
            },
          })
          results.push({ reportCard, isUpdate: true })
        } else {
          // Create new report
          reportCard = await prisma.reportCard.create({
            data: {
              studentId: report.studentId,
              termId,
              academicYearId,
              discipline: report.discipline,
              cleanliness: report.cleanliness,
              classWorkPresentation: report.classWorkPresentation,
              adherenceToSchool: report.adherenceToSchool,
              coCurricularActivities: report.coCurricularActivities,
              considerationToOthers: report.considerationToOthers,
              speakingEnglish: report.speakingEnglish,
              classTeacherComment: report.classTeacherComment,
              isApproved: session.user.role === "HEADTEACHER",
              approvedAt: session.user.role === "HEADTEACHER" ? new Date() : null,
            },
            include: {
              student: {
                include: {
                  class: true,
                },
              },
            },
          })
          results.push({ reportCard, isUpdate: false })
        }
      } catch (error) {
        console.error(`Error processing report for student ${report.studentId}:`, error)
        results.push({ error: `Failed to process report for student ${report.studentId}` })
      }
    }

    const successful = results.filter((r) => !r.error)
    const failed = results.filter((r) => r.error)

    return NextResponse.json(
      {
        success: true,
        processed: results.length,
        successful: successful.length,
        failed: failed.length,
        results,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error bulk upserting report cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
