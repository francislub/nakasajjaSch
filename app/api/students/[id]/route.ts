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

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        class: true,
        term: true,
        academicYear: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        marks: {
          include: {
            subject: true,
          },
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 10,
        },
        reportCards: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, gender, age, classId, termId, photo, parentName, parentEmail } = body

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        name,
        gender,
        age: Number.parseInt(age),
        photo,
        classId,
        termId,
        updatedAt: new Date(),
      },
      include: {
        class: true,
        term: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update parent information if provided
    if (parentName || parentEmail) {
      await prisma.user.update({
        where: { id: student.parentId },
        data: {
          ...(parentName && { name: parentName }),
          ...(parentEmail && { email: parentEmail }),
        },
      })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student to find parent
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { parent: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Delete related records first
    await prisma.attendance.deleteMany({
      where: { studentId: params.id },
    })

    await prisma.mark.deleteMany({
      where: { studentId: params.id },
    })

    await prisma.reportCard.deleteMany({
      where: { studentId: params.id },
    })

    // Delete student
    await prisma.student.delete({
      where: { id: params.id },
    })

    // Delete parent if they have no other children
    const otherChildren = await prisma.student.findMany({
      where: { parentId: student.parentId },
    })

    if (otherChildren.length === 0) {
      await prisma.user.delete({
        where: { id: student.parentId },
      })
    }

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
