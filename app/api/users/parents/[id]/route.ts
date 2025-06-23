import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: "PARENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        children: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    return NextResponse.json(parent)
  } catch (error) {
    console.error("Error fetching parent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, childrenIds, password } = body

    const updateData: any = {
      email,
      name,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update parent
    const parent = await prisma.user.update({
      where: {
        id: params.id,
        role: "PARENT",
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

    // Update children assignments
    if (childrenIds !== undefined) {
      // First, remove parent from all children
      await prisma.student.updateMany({
        where: { parentId: params.id },
        data: { parentId: null },
      })

      // Then assign to new children
      if (childrenIds.length > 0) {
        await prisma.student.updateMany({
          where: { id: { in: childrenIds } },
          data: { parentId: params.id },
        })
      }
    }

    return NextResponse.json(parent)
  } catch (error) {
    console.error("Error updating parent:", error)
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

    // Remove parent from assigned children first
    await prisma.student.updateMany({
      where: { parentId: params.id },
      data: { parentId: null },
    })

    // Delete parent
    await prisma.user.delete({
      where: {
        id: params.id,
        role: "PARENT",
      },
    })

    return NextResponse.json({ message: "Parent deleted successfully" })
  } catch (error) {
    console.error("Error deleting parent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
