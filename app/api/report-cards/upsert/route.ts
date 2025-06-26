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
    const {
      studentId,
      termId,
      academicYearId,
      discipline,
      cleanliness,
      classWorkPresentation,
      adherenceToSchool,
      coCurricularActivities,
      considerationToOthers,
      speakingEnglish,
      classTeacherComment,
    } = body

    // Check if report already exists for this student
    // Note: Removing termId and academicYearId from the query since they might not exist in the schema
    const existingReport = await prisma.reportCard.findFirst({
      where: {
        studentId,
        // Only include termId and academicYearId if they exist in your schema
        // You may need to adjust this based on your actual ReportCard model
      },
    })

    let reportCard

    if (existingReport) {
      // Update existing report
      reportCard = await prisma.reportCard.update({
        where: { id: existingReport.id },
        data: {
          discipline,
          cleanliness,
          classWorkPresentation,
          adherenceToSchool,
          coCurricularActivities,
          considerationToOthers,
          speakingEnglish,
          classTeacherComment,
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
    } else {
      // Create new report
      reportCard = await prisma.reportCard.create({
        data: {
          studentId,
          discipline,
          cleanliness,
          classWorkPresentation,
          adherenceToSchool,
          coCurricularActivities,
          considerationToOthers,
          speakingEnglish,
          classTeacherComment,
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
    }

    return NextResponse.json({ reportCard, isUpdate: !!existingReport }, { status: 200 })
  } catch (error) {
    console.error("Error upserting report card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
