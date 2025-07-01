import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY", "CLASS_TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")
    const search = searchParams.get("search")

    const where: any = {}

    // Handle academic year filter
    if (academicYearId && academicYearId !== "all") {
      if (academicYearId === "active") {
        // Get active academic year
        const activeYear = await prisma.academicYear.findFirst({
          where: { isActive: true },
        })
        if (activeYear) {
          where.academicYearId = activeYear.id
        }
      } else {
        where.academicYearId = academicYearId
      }
    }

    // Filter by class
    if (classId && classId !== "all") {
      where.classId = classId
    }

    // Filter by term
    if (termId && termId !== "all") {
      where.termId = termId
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { parent: { name: { contains: search, mode: "insensitive" } } },
        { parent: { email: { contains: search, mode: "insensitive" } } },
      ]
    }

    // If user is a class teacher, only show their students
    if (session.user.role === "CLASS_TEACHER") {
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { classId: true },
      })

      if (teacher?.classId) {
        where.classId = teacher.classId
      }
    }

    const students = await prisma.student.findMany({
      where,
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
      orderBy: { name: "asc" },
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

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
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
      parentId,
      classId,
      termId,
      academicYearId,
      emergencyContact,
      medicalInfo,
      photo,
    } = body

    // Validate required fields
    if (!name || !gender || !age || !classId || !termId) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, gender, age, classId, and termId are required",
        },
        { status: 400 },
      )
    }

    // Validate age is a number
    const parsedAge = Number.parseInt(age)
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 100) {
      return NextResponse.json(
        {
          error: "Age must be a valid number between 1 and 100",
        },
        { status: 400 },
      )
    }

    // Validate gender
    if (!["MALE", "FEMALE"].includes(gender)) {
      return NextResponse.json(
        {
          error: "Gender must be either MALE or FEMALE",
        },
        { status: 400 },
      )
    }

    // Validate class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })
    if (!classExists) {
      return NextResponse.json(
        {
          error: "Selected class does not exist",
        },
        { status: 400 },
      )
    }

    // Validate term exists
    const termExists = await prisma.term.findUnique({
      where: { id: termId },
    })
    if (!termExists) {
      return NextResponse.json(
        {
          error: "Selected term does not exist",
        },
        { status: 400 },
      )
    }

    // If no academic year specified, use the active one
    let finalAcademicYearId = academicYearId
    if (!finalAcademicYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })
      if (activeYear) {
        finalAcademicYearId = activeYear.id
      } else {
        return NextResponse.json({ error: "No active academic year found" }, { status: 400 })
      }
    }

    // Validate academic year exists
    const academicYearExists = await prisma.academicYear.findUnique({
      where: { id: finalAcademicYearId },
    })
    if (!academicYearExists) {
      return NextResponse.json(
        {
          error: "Selected academic year does not exist",
        },
        { status: 400 },
      )
    }

    // Validate parent exists if provided
    if (parentId) {
      const parentExists = await prisma.user.findUnique({
        where: { id: parentId, role: "PARENT" },
      })
      if (!parentExists) {
        return NextResponse.json(
          {
            error: "Selected parent does not exist or is not a parent user",
          },
          { status: 400 },
        )
      }
    }

    // Check if student with same name already exists in the same class
    const existingStudent = await prisma.student.findFirst({
      where: {
        name,
        classId,
        academicYearId: finalAcademicYearId,
      },
    })

    if (existingStudent) {
      return NextResponse.json(
        {
          error: "A student with this name already exists in the selected class for this academic year",
        },
        { status: 400 },
      )
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        // email: email?.trim() || null,
        // dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        age: parsedAge,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        parentId: parentId || null,
        classId,
        termId,
        academicYearId: finalAcademicYearId,
        emergencyContact: emergencyContact?.trim() || null,
        medicalInfo: medicalInfo?.trim() || null,
        photo: photo || null,
        createdById: session.user.id,
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

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            error: "A student with this information already exists",
          },
          { status: 400 },
        )
      }

      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            error: "Invalid reference to class, term, academic year, or parent",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
