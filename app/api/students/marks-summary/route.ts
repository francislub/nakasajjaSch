import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getGradeFromSystem } from "@/lib/grading"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Get the most recent grading system
    const gradingSystem = await prisma.gradingSystem.findFirst({
      orderBy: { createdAt: "desc" },
    })

    // Get all subjects for the class using classId
    const classSubjects = await prisma.subject.findMany({
      where: {
        classId: classId,
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get students with their marks
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            name: true,
            email: true,
          },
        },
        marks: {
          where: termId && termId !== "all" ? { termId } : {},
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: [
            {
              subject: {
                name: "asc",
              },
            },
            {
              createdAt: "asc",
            },
          ],
        },
        reportCards: {
          select: {
            id: true,
            createdAt: true,
            discipline: true,
            cleanliness: true,
            classWorkPresentation: true,
            adherenceToSchool: true,
            coCurricularActivities: true,
            considerationToOthers: true,
            speakingEnglish: true,
            classTeacherComment: true,
            headteacherComment: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Process students to include complete subject performance
    const studentsWithPerformance = students.map((student) => {
      // Create performance data for all subjects
      const subjectPerformance = classSubjects.map((subject) => {
        // Find marks for this subject
        const subjectMarks = student.marks.filter((mark) => mark.subject.id === subject.id)

        // Group by exam type
        const botMarks = subjectMarks.filter((mark) => mark.examType === "BOT")
        const midMarks = subjectMarks.filter((mark) => mark.examType === "MID")
        const endMarks = subjectMarks.filter((mark) => mark.examType === "END")

        // Calculate averages
        const botAvg =
          botMarks.length > 0 ? botMarks.reduce((sum, mark) => sum + (mark.score || 0), 0) / botMarks.length : 0

        const midAvg =
          midMarks.length > 0 ? midMarks.reduce((sum, mark) => sum + (mark.score || 0), 0) / midMarks.length : 0

        const endAvg =
          endMarks.length > 0 ? endMarks.reduce((sum, mark) => sum + (mark.score || 0), 0) / endMarks.length : 0

        // Calculate total average from all marks if no exam type separation
        const allMarksAvg =
          subjectMarks.length > 0
            ? subjectMarks.reduce((sum, mark) => sum + (mark.score || 0), 0) / subjectMarks.length
            : 0

        const totalAvg = botAvg + midAvg + endAvg > 0 ? (botAvg + midAvg + endAvg) / 3 : allMarksAvg

        return {
          subject: {
            id: subject.id,
            name: subject.name,
            code: subject.code,
          },
          botAverage: Math.round(botAvg * 10) / 10,
          midAverage: Math.round(midAvg * 10) / 10,
          endAverage: Math.round(endAvg * 10) / 10,
          totalAverage: Math.round(totalAvg * 10) / 10,
          grade: getGradeFromSystem(totalAvg, gradingSystem),
          botMarks: botMarks.map((mark) => ({
            id: mark.id,
            score: mark.score,
            maxScore: mark.maxScore,
            examType: mark.examType,
            createdAt: mark.createdAt,
          })),
          midMarks: midMarks.map((mark) => ({
            id: mark.id,
            score: mark.score,
            maxScore: mark.maxScore,
            examType: mark.examType,
            createdAt: mark.createdAt,
          })),
          endMarks: endMarks.map((mark) => ({
            id: mark.id,
            score: mark.score,
            maxScore: mark.maxScore,
            examType: mark.examType,
            createdAt: mark.createdAt,
          })),
          allMarks: subjectMarks.map((mark) => ({
            id: mark.id,
            score: mark.score,
            maxScore: mark.maxScore,
            examType: mark.examType,
            createdAt: mark.createdAt,
          })),
        }
      })

      // Calculate overall average
      const subjectsWithMarks = subjectPerformance.filter((subject) => subject.totalAverage > 0)
      const overallAverage =
        subjectsWithMarks.length > 0
          ? subjectsWithMarks.reduce((sum, subject) => sum + subject.totalAverage, 0) / subjectsWithMarks.length
          : 0

      return {
        ...student,
        subjectPerformance,
        overallAverage: Math.round(overallAverage * 10) / 10,
        overallGrade: getGradeFromSystem(overallAverage, gradingSystem),
      }
    })

    return NextResponse.json({
      students: studentsWithPerformance,
      subjects: classSubjects,
      gradingSystem,
    })
  } catch (error) {
    console.error("Error fetching students marks summary:", error)
    return NextResponse.json({ error: "Failed to fetch students marks summary" }, { status: 500 })
  }
}
