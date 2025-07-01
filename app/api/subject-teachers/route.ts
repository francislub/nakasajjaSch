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

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")

    const whereClause: any = {}
    if (classId) whereClause.classId = classId
    if (termId) whereClause.termId = termId
    if (academicYearId) whereClause.academicYearId = academicYearId

    const subjectTeachers = await prisma.subjectTeacher.findMany({
      where: whereClause,
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
          },
        },
      },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    })

    return NextResponse.json(subjectTeachers)
  } catch (error) {
    console.error("Error fetching subject teachers:", error)
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
    const { teacherId, subjectId, classId, termId, academicYearId } = body

    if (!teacherId || !subjectId || !classId || !termId || !academicYearId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.subjectTeacher.findUnique({
      where: {
        subjectId_classId_termId_academicYearId: {
          subjectId,
          classId,
          termId,
          academicYearId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "A teacher is already assigned to this subject for the specified term and academic year" },
        { status: 400 },
      )
    }

    const subjectTeacher = await prisma.subjectTeacher.create({
      data: {
        teacherId,
        subjectId,
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
          },
        },
      },
    })

    return NextResponse.json(subjectTeacher, { status: 201 })
  } catch (error) {
    console.error("Error creating subject teacher assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
