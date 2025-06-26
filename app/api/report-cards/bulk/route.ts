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
    const { reportCards } = body

    // Create multiple report cards in a transaction
    const createdReports = await prisma.$transaction(
      reportCards.map((report: any) =>
        prisma.reportCard.create({
          data: {
            studentId: report.studentId,
            discipline: report.discipline,
            cleanliness: report.cleanliness,
            classWorkPresentation: report.classWorkPresentation,
            adherenceToSchool: report.adherenceToSchool,
            coCurricularActivities: report.coCurricularActivities,
            considerationToOthers: report.considerationToOthers,
            speakingEnglish: report.speakingEnglish,
            classTeacherComment: report.classTeacherComment,
            headteacherComment: report.headteacherComment,
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
        }),
      ),
    )

    return NextResponse.json(createdReports, { status: 201 })
  } catch (error) {
    console.error("Error creating bulk report cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
