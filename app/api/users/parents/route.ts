import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const whereClause = {
      role: "PARENT" as const,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const parents = await prisma.user.findMany({
      where: whereClause,
      include: {
        children: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(parents)
  } catch (error) {
    console.error("Error fetching parents:", error)
    return NextResponse.json({ error: "Failed to fetch parents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, childrenIds } = body

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

    // Create parent
    const parent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PARENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Assign children if provided
    if (childrenIds && childrenIds.length > 0) {
      await prisma.student.updateMany({
        where: { id: { in: childrenIds } },
        data: { parentId: parent.id },
      })
    }

    return NextResponse.json(parent, { status: 201 })
  } catch (error) {
    console.error("Error creating parent:", error)

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      const target = error.meta?.target
      if (target?.includes("email")) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
