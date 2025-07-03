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
    const { academicYearId, termId, nextTermStartDate, nextTermEndDate } = body

    if (!academicYearId || !termId) {
      return NextResponse.json({ error: "Academic Year ID and Term ID are required" }, { status: 400 })
    }

    const schedule = await prisma.nextTermSchedule.update({
      where: { id: params.id },
      data: {
        academicYearId,
        termId,
        nextTermStartDate: nextTermStartDate ? new Date(nextTermStartDate) : null,
        nextTermEndDate: nextTermEndDate ? new Date(nextTermEndDate) : null,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Error updating next term schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.nextTermSchedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Schedule deleted successfully" })
  } catch (error) {
    console.error("Error deleting next term schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
