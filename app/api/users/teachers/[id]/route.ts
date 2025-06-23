import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: "CLASS_TEACHER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        assignedClasses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error("Error fetching teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, classIds, password } = body

    const updateData: any = {
      email,
      name,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update teacher
    const teacher = await prisma.user.update({
      where: {
        id: params.id,
        role: "CLASS_TEACHER",
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // Update class assignments
    if (classIds !== undefined) {
      // First, remove teacher from all classes
      await prisma.class.updateMany({
        where: { classTeacherId: params.id },
        data: { classTeacherId: null },
      })

      // Then assign to new classes
      if (classIds.length > 0) {
        await prisma.class.updateMany({
          where: { id: { in: classIds } },
          data: { classTeacherId: params.id },
        })
      }
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error("Error updating teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Don't allow deleting self
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Remove teacher from assigned classes first
    await prisma.class.updateMany({
      where: { classTeacherId: params.id },
      data: { classTeacherId: null },
    })

    // Delete teacher
    await prisma.user.delete({
      where: {
        id: params.id,
        role: "CLASS_TEACHER",
      },
    })

    return NextResponse.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
