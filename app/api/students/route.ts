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
    const academicYearId = searchParams.get("academicYearId")
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")

    const whereClause: any = {}

    // Handle academic year filter
    if (academicYearId && academicYearId !== "all") {
      if (academicYearId === "active") {
        const activeYear = await prisma.academicYear.findFirst({
          where: { isActive: true },
          select: { id: true },
        })
        if (activeYear) {
          whereClause.academicYearId = activeYear.id
        }
      } else {
        whereClause.academicYearId = academicYearId
      }
    }

    // Filter by class if provided
    if (classId && classId !== "all") {
      whereClause.classId = classId
    }

    // Filter by term if provided
    if (termId && termId !== "all") {
      whereClause.termId = termId
    }

    // For teachers, restrict to their assigned class
    if (session.user.role === "CLASS_TEACHER") {
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { classId: true },
      })

      if (teacher?.classId) {
        whereClause.classId = teacher.classId
      }
    }

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
        marks: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            term: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ subject: { name: "asc" } }, { term: { name: "asc" } }],
        },
        reportCards: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ students })
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

    const body = await request.json()
    const {
      name,
      email,
      dateOfBirth,
      gender,
      age,
      address,
      phone,
      photo,
      emergencyContact,
      medicalInfo,
      parentId,
      classId,
      termId,
      academicYearId,
    } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!classId) {
      return NextResponse.json({ error: "Class is required" }, { status: 400 })
    }

    if (!academicYearId) {
      return NextResponse.json({ error: "Academic year is required" }, { status: 400 })
    }

    // Validate gender if provided
    if (gender && !["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json({ error: "Invalid gender value" }, { status: 400 })
    }

    // Validate age if provided
    if (age && (typeof age !== "number" || age < 1 || age > 100)) {
      return NextResponse.json({ error: "Age must be a number between 1 and 100" }, { status: 400 })
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 400 })
    }

    // Check if academic year exists
    const academicYearExists = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    })

    if (!academicYearExists) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 400 })
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

    // Check for duplicate student in the same class and academic year
    const existingStudent = await prisma.student.findFirst({
      where: {
        name: name.trim(),
        classId,
        academicYearId,
      },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "A student with this name already exists in this class and academic year" },
        { status: 400 },
      )
    }

    // Build student data object dynamically
    const studentData: any = {
      name: name.trim(),
    }

    // Only add fields that have values
    if (email?.trim()) studentData.email = email.trim()
    if (dateOfBirth) studentData.dateOfBirth = new Date(dateOfBirth)
    if (gender) studentData.gender = gender
    if (age) studentData.age = Number.parseInt(age.toString())
    if (address?.trim()) studentData.address = address.trim()
    if (phone?.trim()) studentData.phone = phone.trim()
    if (photo?.trim()) studentData.photo = photo.trim()
    if (emergencyContact?.trim()) studentData.emergencyContact = emergencyContact.trim()
    if (medicalInfo?.trim()) studentData.medicalInfo = medicalInfo.trim()
    if (parentId) studentData.parentId = parentId
    if (classId) studentData.classId = classId
    if (termId) studentData.termId = termId
    if (academicYearId) studentData.academicYearId = academicYearId
    if (session.user.id) studentData.createdById = session.user.id

    // Create student
    const student = await prisma.student.create({
      data: studentData,
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

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
