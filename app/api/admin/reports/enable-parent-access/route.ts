import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportId, studentName, parentName } = await request.json()

    if (!reportId || !studentName || !parentName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find the report card and verify it exists and is approved
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportId },
      include: {
        student: {
          include: {
            parent: true,
            class: true,
          },
        },
      },
    })

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 })
    }

    if (!reportCard.isApproved) {
      return NextResponse.json({ error: "Report card must be approved before enabling parent access" }, { status: 400 })
    }

    if (!reportCard.student?.parent) {
      return NextResponse.json({ error: "No parent assigned to this student" }, { status: 400 })
    }

    // Since the schema doesn't have parentAccessEnabled fields,
    // we'll use the headteacherComment field to mark parent access as enabled
    // This is a workaround until the schema is updated
    const accessMarker = `[PARENT_ACCESS_ENABLED_${new Date().toISOString()}]`
    const currentComment = reportCard.headteacherComment || ""
    const newComment = currentComment.includes("[PARENT_ACCESS_ENABLED_")
      ? currentComment
      : `${currentComment} ${accessMarker}`.trim()

    // Update the report card to mark parent access as enabled
    const updatedReportCard = await prisma.reportCard.update({
      where: { id: reportId },
      data: {
        headteacherComment: newComment,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Parent access enabled for ${studentName}'s report card`,
      reportCard: updatedReportCard,
      parentEmail: reportCard.student.parent.email,
      studentClass: reportCard.student.class?.name,
    })
  } catch (error) {
    console.error("Error enabling parent access:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
