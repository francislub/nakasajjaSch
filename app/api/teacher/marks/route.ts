import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const subjectId = searchParams.get("subjectId")

    // Get teacher's class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { class: true },
    })

    if (!teacher?.classId) {
      return NextResponse.json({ error: "No class assigned" }, { status: 400 })
    }

    const whereClause: any = {
      student: {
        classId: teacher.classId,
      },
    }

    if (studentId) whereClause.studentId = studentId
    if (subjectId) whereClause.subjectId = subjectId

    const marks = await prisma.mark.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ student: { name: "asc" } }, { subject: { name: "asc" } }],
    })

    return NextResponse.json(marks)
  } catch (error) {
    console.error("Error fetching marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, subjectId, marks: marksData } = body

    // Get grading system to calculate grade
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    const calculateGrade = (mark: number) => {
      for (const grade of gradingSystem) {
        if (mark >= grade.minMark && mark <= grade.maxMark) {
          return { grade: grade.grade, comment: grade.comment }
        }
      }
      return { grade: "F", comment: "Fail" }
    }

    const results = []

    for (const markData of marksData) {
      const { assessment1, assessment2, assessment3, bot, eot } = markData
      const total = (assessment1 + assessment2 + assessment3 + bot + eot) / 5
      const { grade, comment } = calculateGrade(total)

      const mark = await prisma.mark.upsert({
        where: {
          studentId_subjectId: {
            studentId,
            subjectId,
          },
        },
        update: {
          assessment1,
          assessment2,
          assessment3,
          bot,
          eot,
          total,
          grade,
          comment,
          updatedAt: new Date(),
        },
        create: {
          studentId,
          subjectId,
          assessment1,
          assessment2,
          assessment3,
          bot,
          eot,
          total,
          grade,
          comment,
          enteredById: session.user.id,
        },
        include: {
          student: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
      })

      results.push(mark)
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error("Error creating marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
