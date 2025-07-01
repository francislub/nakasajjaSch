import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEADTEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    const whereClause = role ? { role: role as any } : {}

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
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

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEADTEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, classId } = body

    if (!name || !email || !password || !role) {
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

    // Prepare user data
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role,
    }

    // Only handle classId for CLASS_TEACHER role
    if (role === "CLASS_TEACHER" && classId) {
      // Check if this class already has a teacher assigned
      const existingClassTeacher = await prisma.user.findFirst({
        where: {
          classId: classId,
          role: "CLASS_TEACHER",
        },
      })

      if (existingClassTeacher) {
        return NextResponse.json(
          {
            error: "This class already has a teacher assigned",
          },
          { status: 400 },
        )
      }

      // Verify the class exists
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      })

      if (!classExists) {
        return NextResponse.json(
          {
            error: "Selected class does not exist",
          },
          { status: 400 },
        )
      }

      userData.classId = classId
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const target = error.meta?.target
      if (target?.includes("email")) {
        return NextResponse.json(
          {
            error: "User with this email already exists",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
