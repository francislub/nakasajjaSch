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

    const secretary = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: "SECRETARY",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (!secretary) {
      return NextResponse.json({ error: "Secretary not found" }, { status: 404 })
    }

    return NextResponse.json(secretary)
  } catch (error) {
    console.error("Error fetching secretary:", error)
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
    const { email, name, password } = body

    const updateData: any = {
      email,
      name,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const secretary = await prisma.user.update({
      where: {
        id: params.id,
        role: "SECRETARY",
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

    return NextResponse.json(secretary)
  } catch (error) {
    console.error("Error updating secretary:", error)
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

    await prisma.user.delete({
      where: {
        id: params.id,
        role: "SECRETARY",
      },
    })

    return NextResponse.json({ message: "Secretary deleted successfully" })
  } catch (error) {
    console.error("Error deleting secretary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
