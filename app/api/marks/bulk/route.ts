import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { marks } = body

    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ error: "Invalid marks data" }, { status: 400 })
    }

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get grading system from database
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    const calculateGrade = (mark: number): string => {
      for (const grade of gradingSystem) {
        if (mark >= (grade.minMark || 0) && mark <= (grade.maxMark || 100)) {
          return grade.grade
        }
      }
      return "F"
    }

    const results = []

    for (const markData of marks) {
      const { studentId, subjectId, termId, examType, mark, existingMarkId } = markData

      if (!studentId || !subjectId || !termId || !examType || mark === undefined || mark === null) {
        continue
      }

      const numericMark = Number(mark)
      if (isNaN(numericMark) || numericMark < 0 || numericMark > 100) {
        continue
      }

      const grade = calculateGrade(numericMark)

      // Find existing mark record
      const existingMark = await prisma.mark.findFirst({
        where: {
          studentId,
          subjectId,
          termId,
          academicYearId: activeAcademicYear.id,
        },
      })

      // Get student's class for the mark record
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { classId: true },
      })

      if (!student?.classId) {
        console.error(`Student ${studentId} has no class assigned`)
        continue
      }

      // Prepare update/create data based on exam type
      const updateData: any = {
        updatedAt: new Date(),
      }

      const createData: any = {
        studentId,
        subjectId,
        termId,
        classId: student.classId,
        academicYearId: activeAcademicYear.id,
        createdById: session.user.id,
      }

      // Set the appropriate field based on exam type
      switch (examType.toUpperCase()) {
        case "BOT":
          updateData.bot = numericMark
          createData.bot = numericMark
          break
        case "MOT":
          updateData.midterm = numericMark
          createData.midterm = numericMark
          break
        case "EOT":
          updateData.eot = numericMark
          createData.eot = numericMark
          break
        default:
          console.error(`Invalid exam type: ${examType}`)
          continue
      }

      // Calculate total if we have existing marks
      let total = 0
      let count = 0
      let hasMarks = false

      if (existingMark) {
        // Use existing marks and update with new mark
        const marks = {
          bot: existingMark.bot || 0,
          midterm: existingMark.midterm || 0,
          eot: existingMark.eot || 0,
        }

        // Update with new mark
        if (examType.toUpperCase() === "BOT") marks.bot = numericMark
        if (examType.toUpperCase() === "MOT") marks.midterm = numericMark
        if (examType.toUpperCase() === "EOT") marks.eot = numericMark

        // Calculate total from all available marks
        if (marks.bot > 0) {
          total += marks.bot
          count++
          hasMarks = true
        }
        if (marks.midterm > 0) {
          total += marks.midterm
          count++
          hasMarks = true
        }
        if (marks.eot > 0) {
          total += marks.eot
          count++
          hasMarks = true
        }
      } else {
        // New record, only count the current mark
        total = numericMark
        count = 1
        hasMarks = true
      }

      if (hasMarks && count > 0) {
        const calculatedTotal = Math.round(total / count)
        updateData.total = calculatedTotal
        updateData.grade = calculateGrade(calculatedTotal)
        createData.total = calculatedTotal
        createData.grade = calculateGrade(calculatedTotal)
      } else {
        updateData.grade = grade
        createData.grade = grade
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
          },
        })
      } else {
        // Create new record
        savedMark = await prisma.mark.create({
          data: createData,
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
          },
        })
      }

      results.push(savedMark)
    }

    return NextResponse.json(
      {
        message: `Successfully processed ${results.length} marks`,
        results,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error saving bulk marks:", error)
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 })
  }
}
