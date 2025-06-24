import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher's assigned classes
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assignedClasses: true,
      },
    })

    if (!teacher?.assignedClasses || teacher.assignedClasses.length === 0) {
      return NextResponse.json({ error: "No class assigned to teacher" }, { status: 404 })
    }

    const teacherClass = teacher.assignedClasses[0]

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get students in teacher's class
    const students = await prisma.student.findMany({
      where: {
        classId: teacherClass.id,
        academicYearId: activeAcademicYear.id,
      },
      include: {
        class: true,
        term: true,
        parent: {
          select: {
            name: true,
            email: true,
          },
        },
        marks: {
          where: {
            academicYearId: activeAcademicYear.id,
          },
          include: {
            subject: true,
          },
        },
        attendance: {
          where: {
            academicYearId: activeAcademicYear.id,
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Calculate attendance rate for each student
    const studentsWithStats = students.map((student) => {
      const totalAttendance = student.attendance.length
      const presentDays = student.attendance.filter((record) => record.status === "PRESENT").length
      const attendanceRate = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0

      // Calculate average marks
      const totalMarks = student.marks.filter((mark) => mark.total !== null)
      const averageMark =
        totalMarks.length > 0
          ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
          : 0

      return {
        ...student,
        attendanceRate,
        averageMark,
        totalMarks: totalMarks.length,
      }
    })

    return NextResponse.json(studentsWithStats)
  } catch (error) {
    console.error("Error fetching teacher's students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
