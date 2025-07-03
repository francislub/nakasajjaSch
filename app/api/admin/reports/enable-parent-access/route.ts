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
      return NextResponse.json({ error: "Report card must be approved first" }, { status: 400 })
    }

    if (!reportCard.student?.parent) {
      return NextResponse.json({ error: "No parent assigned to this student" }, { status: 400 })
    }

    // Check if parent access is already enabled
    const currentComment = reportCard.headteacherComment || ""
    const accessMarkerRegex = /\[PARENT_ACCESS_ENABLED_\d+\]/

    if (accessMarkerRegex.test(currentComment)) {
      return NextResponse.json({ error: "Parent access is already enabled for this report card" }, { status: 400 })
    }

    // Add parent access marker to headteacher comment
    const timestamp = Date.now()
    const accessMarker = `[PARENT_ACCESS_ENABLED_${timestamp}]`
    const updatedComment = currentComment ? `${currentComment} ${accessMarker}` : accessMarker

    // Update the report card to enable parent access
    const updatedReportCard = await prisma.reportCard.update({
      where: { id: reportId },
      data: {
        headteacherComment: updatedComment,
      },
    })

    return NextResponse.json({
      message: "Parent access enabled successfully",
      reportCard: updatedReportCard,
    })
  } catch (error) {
    console.error("Error enabling parent access:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
