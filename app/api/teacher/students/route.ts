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

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!currentAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 400 })
    }

    // Get teacher's assigned classes
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assignedClasses: {
          where: {
            academicYearId: currentAcademicYear.id,
          },
          select: {
            id: true,
            name: true,
            // level: true,
          },
        },
      },
    })

    if (!teacher?.assignedClasses?.length) {
      return NextResponse.json({ error: "No classes assigned to teacher" }, { status: 400 })
    }

    const classIds = teacher.assignedClasses.map((cls) => cls.id)

    // Build marks filter
    const marksWhere: any = {
      academicYearId: currentAcademicYear.id,
      student: {
        classId: { in: classIds },
      },
    }

    if (termId && termId !== "all") {
      marksWhere.termId = termId
    }

    // Build attendance filter
    const attendanceWhere: any = {
      academicYearId: currentAcademicYear.id,
      student: {
        classId: { in: classIds },
      },
    }

    if (termId && termId !== "all") {
      attendanceWhere.termId = termId
    }

    // Fetch students with comprehensive data
    const students = await prisma.student.findMany({
      where: {
        classId: { in: classIds },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            // level: true,
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
          where: marksWhere,
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
          orderBy: [{ term: { name: "asc" } }, { subject: { name: "asc" } }],
        },
        attendance: {
          where: attendanceWhere,
          select: {
            id: true,
            date: true,
            status: true,
            // remarks: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Calculate statistics for each student
    const studentsWithStats = students.map((student) => {
      // Calculate attendance statistics
      const totalAttendance = student.attendance.length
      const presentCount = student.attendance.filter((att) => att.status === "PRESENT").length
      const absentCount = student.attendance.filter((att) => att.status === "ABSENT").length
      const lateCount = student.attendance.filter((att) => att.status === "LATE").length
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

      // Calculate academic performance
      const validMarks = student.marks.filter((mark) => mark.total && mark.total > 0)
      const averageMark =
        validMarks.length > 0
          ? Math.round(validMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / validMarks.length)
          : 0

      const highestMark = validMarks.length > 0 ? Math.max(...validMarks.map((mark) => mark.total || 0)) : 0
      const lowestMark = validMarks.length > 0 ? Math.min(...validMarks.map((mark) => mark.total || 0)) : 0

      // Get unique subjects
      const uniqueSubjects = new Set(student.marks.map((mark) => mark.subject?.id).filter(Boolean))
      const totalSubjects = uniqueSubjects.size

      return {
        ...student,
        stats: {
          attendanceRate,
          averageMark,
          highestMark,
          lowestMark,
          totalSubjects,
          totalAttendanceDays: totalAttendance,
          presentDays: presentCount,
          absentDays: absentCount,
          lateDays: lateCount,
        },
      }
    })

    return NextResponse.json({
      students: studentsWithStats,
      academicYear: currentAcademicYear,
      classes: teacher.assignedClasses,
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
