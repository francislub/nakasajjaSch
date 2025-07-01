import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studentId = params.id
    const body = await request.json()
    const { academicYearId, classId, termId, parentId } = body

    // Validation
    if (!academicYearId || !classId) {
      return NextResponse.json({ error: "Academic year and class are required" }, { status: 400 })
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        academicYear: true,
        term: true,
        parent: true,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    })

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 400 })
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 400 })
    }

    // Check if term exists (if provided)
    if (termId) {
      const termExists = await prisma.term.findUnique({
        where: { id: termId },
      })

      if (!termExists) {
        return NextResponse.json({ error: "Term not found" }, { status: 400 })
      }
    }

    // Check if parent exists (if provided)
    if (parentId) {
      const parentExists = await prisma.user.findUnique({
        where: { id: parentId, role: "PARENT" },
      })

      if (!parentExists) {
        return NextResponse.json({ error: "Parent not found" }, { status: 400 })
      }
    }

    // Check if student is already registered for this academic year and class
    const duplicateRegistration = await prisma.student.findFirst({
      where: {
        name: existingStudent.name,
        academicYearId,
        classId,
        id: { not: studentId }, // Exclude current student
      },
    })

    if (duplicateRegistration) {
      return NextResponse.json(
        { error: "Student is already registered for this academic year and class" },
        { status: 400 },
      )
    }

    // Prepare update data
    const updateData: any = {
      academicYearId,
      classId,
      updatedAt: new Date(),
    }

    // Only update fields that are provided
    if (termId) {
      updateData.termId = termId
    }

    if (parentId) {
      updateData.parentId = parentId
    }

    // Update the student registration
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                id: true,
                year: true,
                isActive: true,
              },
            },
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
            isActive: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Student re-registered successfully",
      student: updatedStudent,
    })
  } catch (error) {
    console.error("Error re-registering student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
