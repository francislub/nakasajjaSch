import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      gender,
      age,
      classId,
      termId,
      photo,
      parentId,
      parentName,
      parentEmail,
      parentPassword,
      createNewParent,
    } = body

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    let finalParentId = parentId

    // Handle parent creation or selection
    if (createNewParent || !parentId) {
      // Create new parent
      if (!parentName || !parentEmail || !parentPassword) {
        return NextResponse.json({ error: "Parent details are required for new parent" }, { status: 400 })
      }

      // Check if parent email already exists
      const existingParent = await prisma.user.findUnique({
        where: { email: parentEmail },
      })

      if (existingParent) {
        return NextResponse.json({ error: "Parent with this email already exists" }, { status: 400 })
      }

      // Hash parent password
      const hashedPassword = await bcrypt.hash(parentPassword, 12)

      // Create parent user
      const parent = await prisma.user.create({
        data: {
          email: parentEmail,
          password: hashedPassword,
          name: parentName,
          role: "PARENT",
        },
      })

      finalParentId = parent.id
    }

    if (!finalParentId) {
      return NextResponse.json({ error: "Parent ID is required" }, { status: 400 })
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        name,
        gender,
        age: Number.parseInt(age),
        photo,
        classId,
        termId,
        academicYearId: activeAcademicYear.id,
        parentId: finalParentId,
        createdById: session.user.id,
      },
      include: {
        class: true,
        term: true,
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const whereClause: any = {
      academicYearId: activeAcademicYear.id,
    }

    // Filter by class if user is a class teacher
    if (session.user.role === "CLASS_TEACHER") {
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
      })
      if (teacher?.classId) {
        whereClause.classId = teacher.classId
      }
    } else if (classId) {
      whereClause.classId = classId
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: true,
        term: true,
        parent: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
