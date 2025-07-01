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

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    // Get teacher's assigned class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        class: true,
      },
    })

    if (!teacher?.class) {
      return NextResponse.json({ error: "No class assigned to teacher" }, { status: 404 })
    }

    // Get student details with all related data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                id: true,
                year: true,
                isActive: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        marks: {
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
          orderBy: [{ subject: { name: "asc" } }, { term: { name: "asc" } }],
        },
        attendance: {
          select: {
            id: true,
            date: true,
            status: true,
          },
          orderBy: {
            date: "desc",
          },
          take: 30, // Last 30 attendance records
        },
        reportCards: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Last 5 report cards
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify student belongs to teacher's class
    if (student.classId !== teacher.class.id) {
      return NextResponse.json({ error: "Student not in your class" }, { status: 403 })
    }

    // Calculate student statistics
    const marks = student.marks || []
    const attendance = student.attendance || []

    // Attendance statistics
    const totalAttendanceDays = attendance.length
    const presentDays = attendance.filter((a) => a.status === "PRESENT").length
    const absentDays = attendance.filter((a) => a.status === "ABSENT").length
    const lateDays = attendance.filter((a) => a.status === "LATE").length
    const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0

    // Academic statistics
    const validMarks = marks.filter((m) => m.total !== null && m.total !== undefined)
    const averageMark =
      validMarks.length > 0 ? Math.round(validMarks.reduce((sum, m) => sum + (m.total || 0), 0) / validMarks.length) : 0
    const highestMark = validMarks.length > 0 ? Math.max(...validMarks.map((m) => m.total || 0)) : 0
    const lowestMark = validMarks.length > 0 ? Math.min(...validMarks.map((m) => m.total || 0)) : 0
    const totalSubjects = [...new Set(marks.map((m) => m.subject?.id))].length

    // Group marks by subject
    const marksBySubject = marks.reduce((acc: any, mark) => {
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
    Object.keys(marksBySubject).forEach((subjectId) => {
      const subjectMarks = marksBySubject[subjectId].marks.filter((m: any) => m.total !== null)
      marksBySubject[subjectId].average =
        subjectMarks.length > 0
          ? Math.round(subjectMarks.reduce((sum: number, m: any) => sum + (m.total || 0), 0) / subjectMarks.length)
          : 0
    })

    const studentDetails = {
      ...student,
      stats: {
        attendanceRate,
        averageMark,
        highestMark,
        lowestMark,
        totalSubjects,
        totalAttendanceDays,
        presentDays,
        absentDays,
        lateDays,
        marksBySubject: Object.values(marksBySubject),
      },
    }

    return NextResponse.json({ student: studentDetails })
  } catch (error) {
    console.error("Error fetching student details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
