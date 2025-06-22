import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "HEADTEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reportCard = await prisma.reportCard.update({
      where: { id: params.id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
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
    console.error("Error approving report card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
