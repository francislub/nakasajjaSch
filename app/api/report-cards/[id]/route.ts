import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["HEADTEACHER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { headteacherComment, isApproved, approvedAt } = body

    const reportCard = await prisma.reportCard.update({
      where: { id: params.id },
      data: {
        headteacherComment,
        isApproved,
        approvedAt: approvedAt ? new Date(approvedAt) : null,
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    })

    return NextResponse.json(reportCard)
  } catch (error) {
    console.error("Error updating report card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["HEADTEACHER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the report card completely
    await prisma.reportCard.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Report card deleted successfully" })
  } catch (error) {
    console.error("Error deleting report card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
