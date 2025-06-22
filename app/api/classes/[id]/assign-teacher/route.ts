import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { teacherId } = body

    // Remove teacher from any other class
    await prisma.user.updateMany({
      where: { classId: params.id },
      data: { classId: null },
    })

    // Assign new teacher to class
    await prisma.user.update({
      where: { id: teacherId },
      data: { classId: params.id },
    })

    const updatedClass = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        classTeacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error("Error assigning teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
