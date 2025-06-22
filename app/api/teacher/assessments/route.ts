import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher's assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        teacherId: session.user.id,
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, type, totalMarks, dueDate, subjectId, classId } = body

    // Get teacher's class and subject
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teachingClass: true,
        subjects: true,
      },
    })

    if (!teacher?.teachingClass) {
      return NextResponse.json({ error: "Teacher not assigned to any class" }, { status: 400 })
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        type,
        totalMarks: Number.parseInt(totalMarks),
        dueDate: new Date(dueDate),
        teacherId: session.user.id,
        subjectId: teacher.subjects[0]?.id || "",
        classId: teacher.teachingClass.id,
        status: "ACTIVE",
      },
      include: {
        subject: true,
        class: true,
      },
    })

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error creating assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
