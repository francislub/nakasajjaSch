import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subjectId")
    const termId = searchParams.get("termId")

    // Get teacher's assigned classes or allow secretary/admin to access all
    let teacherClass
    if (session.user.role === "CLASS_TEACHER") {
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          assignedClasses: true,
        },
      })

      if (!teacher?.assignedClasses || teacher.assignedClasses.length === 0) {
        return NextResponse.json({ error: "No class assigned" }, { status: 400 })
      }
      teacherClass = teacher.assignedClasses[0]
    } else if (session.user.role === "SECRETARY" || session.user.role === "ADMIN") {
      // Secretary and Admin can access marks from any class
      teacherClass = null
    }

    const whereClause: any = {}

    // Only filter by class if user is a teacher with assigned class
    if (teacherClass) {
      whereClause.student = {
        classId: teacherClass.id,
      }
    }

    if (subjectId) whereClause.subjectId = subjectId
    if (termId) whereClause.termId = termId

    const marks = await prisma.mark.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
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

    if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { marks, examType } = body

    if (!marks || !Array.isArray(marks) || !examType) {
      return NextResponse.json({ error: "Invalid marks data" }, { status: 400 })
    }

    // Get grading system from database
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    const calculateGrade = (mark: number) => {
      for (const grade of gradingSystem) {
        if (mark >= (grade.minMark || 0) && mark <= (grade.maxMark || 100)) {
          return grade.grade
        }
      }
      return "F"
    }

    const results = []

    for (const markData of marks) {
      const { studentId, subjectId, termId, mark } = markData

      if (!studentId || !subjectId || !termId || mark === undefined) {
        continue
      }

      const grade = calculateGrade(Number(mark))

      // Find existing mark record
      const existingMark = await prisma.mark.findFirst({
        where: {
          studentId,
          subjectId,
          termId,
        },
      })

      // Prepare update data based on exam type
      const updateData: any = {
        grade,
        updatedAt: new Date(),
      }

      const createData: any = {
        studentId,
        subjectId,
        termId,
        grade,
        createdById: session.user.id,
      }

      // Set the appropriate field based on exam type
      switch (examType) {
        case "BOT":
          updateData.bot = Number(mark)
          createData.bot = Number(mark)
          break
        case "MOT":
          updateData.midterm = Number(mark)
          createData.midterm = Number(mark)
          break
        case "EOT":
          updateData.eot = Number(mark)
          createData.eot = Number(mark)
          break
        default:
          continue
      }

      // Calculate total if all marks are present
      let total = 0
      let count = 0

      if (examType === "BOT") {
        total += Number(mark)
        count++
        if (existingMark?.midterm) {
          total += existingMark.midterm
          count++
        }
        if (existingMark?.eot) {
          total += existingMark.eot
          count++
        }
      } else if (examType === "MOT") {
        total += Number(mark)
        count++
        if (existingMark?.bot) {
          total += existingMark.bot
          count++
        }
        if (existingMark?.eot) {
          total += existingMark.eot
          count++
        }
      } else if (examType === "EOT") {
        total += Number(mark)
        count++
        if (existingMark?.bot) {
          total += existingMark.bot
          count++
        }
        if (existingMark?.midterm) {
          total += existingMark.midterm
          count++
        }
      }

      if (count > 0) {
        updateData.total = Math.round(total / count)
        createData.total = Math.round(total / count)
      }

      let savedMark
      if (existingMark) {
        // Update existing record
        savedMark = await prisma.mark.update({
          where: { id: existingMark.id },
          data: updateData,
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
            term: {
              select: {
                name: true,
              },
            },
          },
        })
      } else {
        // Create new record
        savedMark = await prisma.mark.create({
          data: createData,
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
            term: {
              select: {
                name: true,
              },
            },
          },
        })
      }

      results.push(savedMark)
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error("Error saving marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
