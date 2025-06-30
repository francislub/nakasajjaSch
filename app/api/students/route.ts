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
        select: { assignedClasses: true },
      })

      if (teacher?.assignedClasses && teacher.assignedClasses.length > 0) {
        where.classId = { in: teacher.assignedClasses.map((c: any) => c.id) }
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
    if (!name || !gender || !age || !dateOfBirth || !classId || !termId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    const student = await prisma.student.create({
      data: {
        name,
        email: email || null,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        age: Number.parseInt(age),
        address: address || null,
        phone: phone || null,
        parentId: parentId || null,
        classId,
        termId,
        academicYearId: finalAcademicYearId,
        emergencyContact: emergencyContact || null,
        medicalInfo: medicalInfo || null,
        photo: photo || null,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
