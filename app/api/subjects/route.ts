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
    const academicYearId = searchParams.get("academicYearId")
    const category = searchParams.get("category")
    const termId = searchParams.get("termId")
    const search = searchParams.get("search")
    const tab = searchParams.get("tab")

    // Build the where clause based on filters
    const whereClause: any = {}

    // Handle class filter
    if (classId && classId !== "none") {
      whereClause.classId = classId
    }

    // Handle category filter
    if (category && category !== "none") {
      whereClause.category = category
    }

    // Handle academic year filter
    if (academicYearId && academicYearId !== "none") {
      whereClause.academicYearId = academicYearId
    } else if (!academicYearId || academicYearId === "none") {
      // If no academic year specified, default to active academic year
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })

      if (activeYear) {
        whereClause.academicYearId = activeYear.id
      }
    }

    // Handle search
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }

    // Handle tab filter for assigned subjects
    let subjectTeachersFilter = {}
    if (tab === "assigned") {
      if (termId && termId !== "none") {
        subjectTeachersFilter = {
          some: {
            termId,
          },
        }
      } else {
        subjectTeachersFilter = {
          some: {},
        }
      }
    }

    const subjects = await prisma.subject.findMany({
      where: {
        ...whereClause,
        ...(tab === "assigned" ? { subjectTeachers: subjectTeachersFilter } : {}),
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
          // Filter subject teachers by term if specified
          ...(termId && termId !== "none" ? { where: { termId } } : {}),
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
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
    const { name, code, classId, category = "GENERAL", academicYearId } = body

    if (!name) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 })
    }

    // Check if subject with same name already exists for the same class and academic year
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(classId && classId !== "none" ? { classId } : {}),
        ...(academicYearId && academicYearId !== "none" ? { academicYearId } : {}),
      },
    })

    if (existingSubject) {
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

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        category,
        ...(classId && classId !== "none" ? { classId } : {}),
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

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
