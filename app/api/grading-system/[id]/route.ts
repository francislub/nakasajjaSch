import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { grade, minMark, maxMark, comment } = body

    const gradingEntry = await prisma.gradingSystem.update({
      where: { id: params.id },
      data: {
        grade,
        minMark: Number.parseFloat(minMark),
        maxMark: Number.parseFloat(maxMark),
        comment,
      },
    })

    return NextResponse.json(gradingEntry)
  } catch (error) {
    console.error("Error updating grading entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.gradingSystem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Grading entry deleted successfully" })
  } catch (error) {
    console.error("Error deleting grading entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
