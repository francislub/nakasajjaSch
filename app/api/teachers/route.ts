import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teachers = await prisma.teacher.findMany({
      where: { isActive: true },
      include: {
        subjectAssignments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            term: {
              select: {
                id: true,
                name: true,
              },
            },
            academicYear: {
              select: {
                id: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
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
    const { name, email, phone, address, qualification, experience } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingTeacher = await prisma.teacher.findUnique({
        where: { email },
      })

      if (existingTeacher) {
        return NextResponse.json({ error: "Teacher with this email already exists" }, { status: 400 })
      }
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        qualification: qualification || null,
        experience: experience ? Number.parseInt(experience) : null,
      },
      include: {
        subjectAssignments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            term: {
              select: {
                id: true,
                name: true,
              },
            },
            academicYear: {
              select: {
                id: true,
                year: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error("Error creating teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
