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
    const { year, startDate, endDate, isActive } = body

    // If setting as active, deactivate all other academic years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: params.id } },
        data: { isActive: false },
      })
    }

    const academicYear = await prisma.academicYear.update({
      where: { id: params.id },
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    })

    return NextResponse.json(academicYear)
  } catch (error) {
    console.error("Error updating academic year:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.academicYear.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Academic year deleted successfully" })
  } catch (error) {
    console.error("Error deleting academic year:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
