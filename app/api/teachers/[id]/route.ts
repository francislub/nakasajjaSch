import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
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
    const { name, email, phone, address, qualification, experience, isActive } = body

    // Check if email already exists (if provided and different from current)
    if (email) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      })

      if (existingTeacher) {
        return NextResponse.json({ error: "Teacher with this email already exists" }, { status: 400 })
      }
    }

    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        qualification: qualification || null,
        experience: experience ? Number.parseInt(experience) : null,
        isActive: isActive !== undefined ? isActive : true,
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

    return NextResponse.json(teacher)
  } catch (error) {
    console.error("Error updating teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete related subject assignments first
    await prisma.subjectTeacher.deleteMany({
      where: { teacherId: params.id },
    })

    // Delete the teacher
    await prisma.teacher.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
