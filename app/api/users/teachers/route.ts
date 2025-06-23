import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teachers = await prisma.user.findMany({
      where: { role: "CLASS_TEACHER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        assignedClasses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, classIds } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create teacher
    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLASS_TEACHER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Assign classes if provided
    if (classIds && classIds.length > 0) {
      await prisma.class.updateMany({
        where: { id: { in: classIds } },
        data: { classTeacherId: teacher.id },
      })
    }

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error("Error creating teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
