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
    const { name, gender, age, classId, termId, photo, parentName, parentEmail, parentPassword } = body

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Hash parent password
    const hashedPassword = await bcrypt.hash(parentPassword, 12)

    // Create parent user first
    const parent = await prisma.user.create({
      data: {
        email: parentEmail,
        password: hashedPassword,
        name: parentName,
        role: "PARENT",
      },
    })

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
        parentId: parent.id,
        createdById: session.user.id,
      },
      include: {
        class: true,
        term: true,
        parent: true,
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
