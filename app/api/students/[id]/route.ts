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

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      gender,
      age,
      dateOfBirth,
      address,
      phone,
      emergencyContact,
      medicalInfo,
      classId,
      termId,
      academicYearId,
      parentId,
      photo,
    } = body

    // Validate required fields
    if (!name || !gender || !age || !dateOfBirth || !classId || !termId || !academicYearId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        gender,
        age: Number.parseInt(age),
        dateOfBirth: new Date(dateOfBirth),
        address: address || null,
        phone: phone || null,
        emergencyContact: emergencyContact || null,
        medicalInfo: medicalInfo || null,
        classId,
        termId,
        academicYearId,
        parentId: parentId || null,
        photo: photo || null,
        updatedAt: new Date(),
      },
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
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
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

    // Check if parent has other children before deleting
    if (student.parentId) {
      const otherChildren = await prisma.student.findMany({
        where: {
          parentId: student.parentId,
          id: { not: params.id },
        },
      })

      if (otherChildren.length === 0) {
        await prisma.user.delete({
          where: { id: student.parentId },
        })
      }
    }

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
