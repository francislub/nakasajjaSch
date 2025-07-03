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

    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        class: {
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
        subjectTeachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
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
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error fetching subject:", error)
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
    const { name, code, classId, category, academicYearId } = body

    if (!name) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 })
    }

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: params.id },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if another subject with same name already exists for the same class and academic year
    const duplicateSubject = await prisma.subject.findFirst({
      where: {
        id: { not: params.id },
        name: { equals: name, mode: "insensitive" },
        ...(classId && classId !== "none" ? { classId } : {}),
        ...(academicYearId && academicYearId !== "none" ? { academicYearId } : {}),
      },
    })

    if (duplicateSubject) {
      return NextResponse.json(
        { error: "A subject with this name already exists for the specified class and academic year" },
        { status: 400 },
      )
    }

    // If no academic year specified, use active academic year
    let finalAcademicYearId = academicYearId
    if (!finalAcademicYearId || finalAcademicYearId === "none") {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })

      if (activeYear) {
        finalAcademicYearId = activeYear.id
      } else {
        return NextResponse.json({ error: "No active academic year found" }, { status: 400 })
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: params.id },
      data: {
        name,
        code,
        category,
        ...(classId && classId !== "none" ? { classId } : { classId: null }),
        academicYearId: finalAcademicYearId,
      },
      include: {
        class: {
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
        subjectTeachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
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
        },
      },
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: params.id },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Delete the subject (this will cascade delete related subject teachers)
    await prisma.subject.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
