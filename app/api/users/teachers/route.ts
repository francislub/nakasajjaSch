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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const whereClause = {
      role: "CLASS_TEACHER" as const,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const teachers = await prisma.user.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, classId } = body

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

    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role: "CLASS_TEACHER",
    }

    // If classId is provided, validate and assign
    if (classId) {
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

    const teacher = await prisma.user.create({
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

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error("Error creating teacher:", error)

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const target = error.meta?.target
      if (target?.includes("email")) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
