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
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")

    // Get teacher's assigned class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        class: {
          include: {
            students: {
              where: {
                ...(academicYearId && { academicYearId }),
              },
              include: {
                marks: {
                  where: {
                    ...(termId && { termId }),
                  },
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
                },
                attendance: {
                  where: {
                    ...(termId && { termId }),
                  },
                  select: {
                    id: true,
                    date: true,
                    status: true,
                  },
                },
                reportCards: {
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                },
              },
              orderBy: {
                name: "asc",
              },
            },
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    if (!teacher?.class) {
      return NextResponse.json({ error: "No class assigned to teacher" }, { status: 404 })
    }

    // Get grading system from database
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    const calculateGradeFromDatabase = (average: number) => {
      for (const grade of gradingSystem) {
        if (average >= (grade.minMark || 0) && average <= (grade.maxMark || 100)) {
          return grade.grade
        }
      }
      return "F"
    }

    // Process student reports
    const studentReports = teacher.class.students.map((student) => {
      const marks = student.marks || []
      const attendance = student.attendance || []

      // Calculate attendance statistics
      const totalAttendanceDays = attendance.length
      const presentDays = attendance.filter((a) => a.status === "PRESENT").length
      const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0

      // Calculate academic statistics
      const validMarks = marks.filter((m) => m.total !== null && m.total !== undefined)
      const averageMark =
        validMarks.length > 0
          ? Math.round(validMarks.reduce((sum, m) => sum + (m.total || 0), 0) / validMarks.length)
          : 0

      // Group marks by subject
      const subjectPerformance = marks.reduce((acc: any, mark) => {
        const subjectId = mark.subject?.id
        if (!subjectId) return acc

        if (!acc[subjectId]) {
          acc[subjectId] = {
            subject: mark.subject,
            marks: [],
            average: 0,
          }
        }
        acc[subjectId].marks.push(mark)
        return acc
      }, {})

      // Calculate average for each subject
      Object.keys(subjectPerformance).forEach((subjectId) => {
        const subjectMarks = subjectPerformance[subjectId].marks.filter((m: any) => m.total !== null)
        subjectPerformance[subjectId].average =
          subjectMarks.length > 0
            ? Math.round(subjectMarks.reduce((sum: number, m: any) => sum + (m.total || 0), 0) / subjectMarks.length)
            : 0
      })

      return {
        student: {
          id: student.id,
          name: student.name,
          photo: student.photo,
        },
        stats: {
          attendanceRate,
          averageMark,
          grade: calculateGradeFromDatabase(averageMark),
          totalSubjects: Object.keys(subjectPerformance).length,
          subjectPerformance: Object.values(subjectPerformance),
        },
        latestReportCard: student.reportCards[0] || null,
      }
    })

    // Calculate class statistics
    const classStats = {
      totalStudents: studentReports.length,
      averageClassPerformance:
        studentReports.length > 0
          ? Math.round(studentReports.reduce((sum, s) => sum + s.stats.averageMark, 0) / studentReports.length)
          : 0,
      averageAttendance:
        studentReports.length > 0
          ? Math.round(studentReports.reduce((sum, s) => sum + s.stats.attendanceRate, 0) / studentReports.length)
          : 0,
      gradeDistribution: studentReports.reduce((acc: any, s) => {
        const grade = s.stats.grade
        acc[grade] = (acc[grade] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({
      classInfo: {
        id: teacher.class.id,
        name: teacher.class.name,
        subjects: teacher.class.subjects,
      },
      studentReports,
      classStats,
      gradingSystem,
    })
  } catch (error) {
    console.error("Error fetching teacher reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
