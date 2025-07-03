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

    const subjectTeacher = await prisma.subjectTeacher.findUnique({
      where: { id: params.id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
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
            isActive: true,
          },
        },
      },
    })

    if (!subjectTeacher) {
      return NextResponse.json({ error: "Subject teacher assignment not found" }, { status: 404 })
    }

    return NextResponse.json(subjectTeacher)
  } catch (error) {
    console.error("Error fetching subject teacher assignment:", error)
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
    const { teacherId, classId, termId, academicYearId } = body

    if (!teacherId || teacherId === "none") {
      return NextResponse.json({ error: "Teacher is required" }, { status: 400 })
    }

    if (!classId || classId === "none") {
      return NextResponse.json({ error: "Class is required" }, { status: 400 })
    }

    if (!termId || termId === "none") {
      return NextResponse.json({ error: "Term is required" }, { status: 400 })
    }

    if (!academicYearId || academicYearId === "none") {
      return NextResponse.json({ error: "Academic year is required" }, { status: 400 })
    }

    // Get the current assignment to get the subjectId
    const currentAssignment = await prisma.subjectTeacher.findUnique({
      where: { id: params.id },
    })

    if (!currentAssignment) {
      return NextResponse.json({ error: "Subject teacher assignment not found" }, { status: 404 })
    }

    // Check if another assignment exists with the same combination
    const existingAssignment = await prisma.subjectTeacher.findFirst({
      where: {
        id: { not: params.id },
        subjectId: currentAssignment.subjectId,
        classId,
        termId,
        academicYearId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        {
          error: "Another teacher is already assigned to this subject for the specified class, term and academic year",
        },
        { status: 400 },
      )
    }

    const updatedSubjectTeacher = await prisma.subjectTeacher.update({
      where: { id: params.id },
      data: {
        teacherId,
        classId,
        termId,
        academicYearId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
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
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(updatedSubjectTeacher)
  } catch (error) {
    console.error("Error updating subject teacher assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if assignment exists
    const assignment = await prisma.subjectTeacher.findUnique({
      where: { id: params.id },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Subject teacher assignment not found" }, { status: 404 })
    }

    await prisma.subjectTeacher.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Subject teacher assignment deleted successfully" })
  } catch (error) {
    console.error("Error deleting subject teacher assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
