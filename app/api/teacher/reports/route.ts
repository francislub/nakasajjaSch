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

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get teacher's class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        class: true,
      },
    })

    if (!teacher?.classId) {
      return NextResponse.json({ error: "Teacher not assigned to a class" }, { status: 404 })
    }

    // Get students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: teacher.classId,
        academicYearId: activeAcademicYear.id,
        ...(termId && { termId }),
      },
      include: {
        marks: {
          where: {
            academicYearId: activeAcademicYear.id,
            ...(termId && { termId }),
          },
          include: {
            subject: true,
          },
        },
        attendance: {
          where: {
            academicYearId: activeAcademicYear.id,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        },
      },
    })

    // Calculate class statistics
    const totalStudents = students.length
    const studentsWithMarks = students.filter((student) => student.marks.length > 0)

    let totalScore = 0
    let totalMarks = 0
    const subjectPerformance: Record<string, { total: number; count: number; passed: number }> = {}
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }

    studentsWithMarks.forEach((student) => {
      student.marks.forEach((mark) => {
        if (mark.total !== null) {
          totalScore += mark.total
          totalMarks++

          const subjectName = mark.subject?.name || "Unknown"
          if (!subjectPerformance[subjectName]) {
            subjectPerformance[subjectName] = { total: 0, count: 0, passed: 0 }
          }
          subjectPerformance[subjectName].total += mark.total
          subjectPerformance[subjectName].count++
          if (mark.total >= 50) {
            subjectPerformance[subjectName].passed++
          }

          // Grade distribution
          if (mark.grade) {
            gradeDistribution[mark.grade] = (gradeDistribution[mark.grade] || 0) + 1
          }
        }
      })
    })

    const averageScore = totalMarks > 0 ? Math.round(totalScore / totalMarks) : 0
    const passRate = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0

    // Subject performance
    const subjectPerformanceArray = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      passRate: Math.round((data.passed / data.count) * 100),
    }))

    // Grade distribution
    const gradeDistributionArray = Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
    }))

    // Top performers
    const topPerformers = studentsWithMarks
      .map((student) => {
        const studentMarks = student.marks.filter((mark) => mark.total !== null)
        if (studentMarks.length === 0) return null

        const average = Math.round(studentMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / studentMarks.length)
        const grade = studentMarks[0]?.grade || "N/A"

        return {
          id: student.id,
          name: student.name,
          photo: student.photo,
          average,
          grade,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b?.average || 0) - (a?.average || 0))
      .slice(0, 5)

    // Weekly attendance
    const weeklyAttendance = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

      const dayAttendance = students.reduce(
        (acc, student) => {
          const attendance = student.attendance.find((att) => {
            const attDate = new Date(att.date)
            return attDate.toDateString() === date.toDateString()
          })

          if (attendance) {
            if (attendance.status === "PRESENT") acc.present++
            else acc.absent++
          }

          return acc
        },
        { present: 0, absent: 0 },
      )

      const total = dayAttendance.present + dayAttendance.absent
      const rate = total > 0 ? Math.round((dayAttendance.present / total) * 100) : 0

      return {
        day: dayName,
        present: dayAttendance.present,
        absent: dayAttendance.absent,
        rate,
      }
    })

    const report = {
      totalStudents,
      averageScore,
      passRate,
      subjectPerformance: subjectPerformanceArray,
      gradeDistribution: gradeDistributionArray,
      topPerformers,
      weeklyAttendance,
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error generating class report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
