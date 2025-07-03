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
    const teacherId = searchParams.get("teacherId")
    const subjectId = searchParams.get("subjectId")

    // Build where clause based on filters
    const whereClause: any = {}
    if (classId && classId !== "none") whereClause.classId = classId
    if (termId && termId !== "none") whereClause.termId = termId
    if (academicYearId && academicYearId !== "none") whereClause.academicYearId = academicYearId
    if (teacherId && teacherId !== "none") whereClause.teacherId = teacherId
    if (subjectId && subjectId !== "none") whereClause.subjectId = subjectId

    // If no academic year specified, default to active academic year
    if (!academicYearId || academicYearId === "active") {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })

      if (activeYear) {
        whereClause.academicYearId = activeYear.id
      }
    }

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
            isActive: true,
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

    if (!teacherId || teacherId === "none") {
      return NextResponse.json({ error: "Teacher is required" }, { status: 400 })
    }

    if (!subjectId || subjectId === "none") {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
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

    // Validate that all referenced entities exist
    const [teacher, subject, classEntity, term, academicYear] = await Promise.all([
      prisma.teacher.findUnique({ where: { id: teacherId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.term.findUnique({ where: { id: termId } }),
      prisma.academicYear.findUnique({ where: { id: academicYearId } }),
    ])

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }
    if (!classEntity) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }
    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }
    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.subjectTeacher.findFirst({
      where: {
        subjectId,
        classId,
        termId,
        academicYearId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "A teacher is already assigned to this subject for the specified class, term and academic year" },
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
            isActive: true,
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
