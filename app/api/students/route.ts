import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SECRETARY", "CLASS_TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const academicYearId = searchParams.get("academicYearId")
    const termId = searchParams.get("termId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}

    if (classId) {
      whereClause.classId = classId
    }

    if (academicYearId) {
      whereClause.academicYearId = academicYearId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // For teachers, restrict to their assigned class
    if (session.user.role === "CLASS_TEACHER") {
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { classId: true },
      })

      if (teacher?.classId) {
        whereClause.classId = teacher.classId
      } else {
        return NextResponse.json({ students: [], total: 0, page, limit })
      }
    }

    // Get total count
    const total = await prisma.student.count({ where: whereClause })

    // Get students with related data
    const students = await prisma.student.findMany({
      where: whereClause,
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
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        marks: {
          where: termId ? { termId } : undefined,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                category: true,
              },
            },
            term: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ subject: { name: "asc" } }],
        },
        attendance: {
          where: termId
            ? {
                date: {
                  gte: new Date(new Date().getFullYear(), 0, 1),
                  lte: new Date(new Date().getFullYear(), 11, 31),
                },
              }
            : undefined,
          select: {
            id: true,
            date: true,
            status: true,
          },
          orderBy: { date: "desc" },
        },
        reportCards: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    })

    // Calculate statistics for each student
    const studentsWithStats = students.map((student) => {
      const marks = student.marks || []
      const attendance = student.attendance || []

      // Calculate attendance stats
      const totalAttendanceDays = attendance.length
      const presentDays = attendance.filter((a) => a.status === "PRESENT").length
      const absentDays = attendance.filter((a) => a.status === "ABSENT").length
      const lateDays = attendance.filter((a) => a.status === "LATE").length
      const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0

      // Calculate academic stats
      const validMarks = marks.filter((m) => m.total !== null && m.total !== undefined)
      const averageMark =
        validMarks.length > 0
          ? Math.round(validMarks.reduce((sum, m) => sum + (m.total || 0), 0) / validMarks.length)
          : 0
      const highestMark = validMarks.length > 0 ? Math.max(...validMarks.map((m) => m.total || 0)) : 0
      const lowestMark = validMarks.length > 0 ? Math.min(...validMarks.map((m) => m.total || 0)) : 0
      const totalSubjects = [...new Set(marks.map((m) => m.subject?.id))].filter(Boolean).length

      return {
        ...student,
        stats: {
          attendanceRate,
          averageMark,
          highestMark,
          lowestMark,
          totalSubjects,
          totalAttendanceDays,
          presentDays,
          absentDays,
          lateDays,
        },
      }
    })

    return NextResponse.json({
      students: studentsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    let {
      name,
      gender,
      dateOfBirth,
      classId,
      parentId,
      academicYearId,
      termId,
      photo,
      email,
      age,
      address,
      phone,
      emergencyContact,
      medicalInfo,
    } = data

    // Validate required fields
    if (!name || !gender || !classId) {
      return NextResponse.json({ error: "Name, gender, and class are required" }, { status: 400 })
    }

    // If academicYearId is not provided, get the active academic year
    if (!academicYearId) {
      const activeAcademicYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true },
      })

      if (!activeAcademicYear) {
        return NextResponse.json(
          { error: "No active academic year found. Please set an active academic year first." },
          { status: 400 },
        )
      }

      academicYearId = activeAcademicYear.id
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true },
    })

    if (!classExists) {
      return NextResponse.json({ error: "Selected class not found" }, { status: 400 })
    }

    // Verify academic year exists
    const academicYearExists = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true, year: true },
    })

    if (!academicYearExists) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 400 })
    }

    // Verify parent exists (if provided)
    if (parentId) {
      const parentExists = await prisma.user.findUnique({
        where: {
          id: parentId,
          role: "PARENT",
        },
        select: { id: true },
      })

      if (!parentExists) {
        return NextResponse.json({ error: "Selected parent not found" }, { status: 400 })
      }
    }

    // Verify term exists (if provided)
    if (termId) {
      const termExists = await prisma.term.findUnique({
        where: { id: termId },
        select: { id: true },
      })

      if (!termExists) {
        return NextResponse.json({ error: "Selected term not found" }, { status: 400 })
      }
    }

    // Prepare student data using Prisma relation syntax
    const studentData: any = {
      name: name.trim(),
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      email: email?.trim() || null,
      age: age ? Number.parseInt(age) : null,
      address: address?.trim() || null,
      phone: phone?.trim() || null,
      emergencyContact: emergencyContact?.trim() || null,
      medicalInfo: medicalInfo?.trim() || null,
      photo: photo || null,
      class: {
        connect: { id: classId },
      },
      academicYear: {
        connect: { id: academicYearId },
      },
      createdBy: {
        connect: { id: session.user.id },
      },
    }

    // Add parent connection if provided
    if (parentId) {
      studentData.parent = {
        connect: { id: parentId },
      }
    }

    // Add term connection if provided
    if (termId) {
      studentData.term = {
        connect: { id: termId },
      }
    }

    // Create student
    const student = await prisma.student.create({
      data: studentData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Student registered successfully",
        student,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating student:", error)

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A student with this information already exists" }, { status: 400 })
    }

    if (error.code === "P2003") {
      return NextResponse.json({ error: "Invalid reference to class, parent, term, or academic year" }, { status: 400 })
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Referenced class, parent, term, or academic year not found" }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to register student. Please try again." }, { status: 500 })
  }
}
