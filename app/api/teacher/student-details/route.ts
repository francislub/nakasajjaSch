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
    const termId = searchParams.get("termId")

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!currentAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 400 })
    }

    // Verify teacher has access to this student
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assignedClasses: {
          where: {
            academicYearId: currentAcademicYear.id,
          },
        },
      },
    })

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if teacher has access to this student's class
    const hasAccess = teacher?.assignedClasses?.some((cls) => cls.id === student.classId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this student" }, { status: 403 })
    }

    // Get detailed marks with term filter if provided
    const marksWhere: any = {
      studentId: studentId,
      academicYearId: currentAcademicYear.id,
    }

    if (termId && termId !== "all") {
      marksWhere.termId = termId
    }

    const marks = await prisma.mark.findMany({
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
    })

    // Get attendance with term filter if provided
    const attendanceWhere: any = {
      studentId: studentId,
      academicYearId: currentAcademicYear.id,
    }

    if (termId && termId !== "all") {
      attendanceWhere.termId = termId
    }

    const attendance = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Get report cards
    const reportCards = await prisma.reportCard.findMany({
      where: {
        studentId: studentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate detailed statistics
    const totalAttendance = attendance.length
    const presentCount = attendance.filter((att) => att.status === "PRESENT").length
    const absentCount = attendance.filter((att) => att.status === "ABSENT").length
    const lateCount = attendance.filter((att) => att.status === "LATE").length
    const excusedCount = attendance.filter((att) => att.status === "EXCUSED").length

    const validMarks = marks.filter((mark) => mark.total && mark.total > 0)
    const averageMark =
      validMarks.length > 0
        ? Math.round(validMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / validMarks.length)
        : 0

    // Group marks by term and subject for better organization
    const marksByTerm = marks.reduce(
      (acc, mark) => {
        const termName = mark.term?.name || "Unknown Term"
        if (!acc[termName]) {
          acc[termName] = []
        }
        acc[termName].push(mark)
        return acc
      },
      {} as Record<string, typeof marks>,
    )

    // Group marks by subject
    const marksBySubject = marks.reduce(
      (acc, mark) => {
        const subjectName = mark.subject?.name || "Unknown Subject"
        if (!acc[subjectName]) {
          acc[subjectName] = []
        }
        acc[subjectName].push(mark)
        return acc
      },
      {} as Record<string, typeof marks>,
    )

    // Calculate grade distribution
    const gradeDistribution = validMarks.reduce(
      (acc, mark) => {
        const grade = mark.grade || "N/A"
        acc[grade] = (acc[grade] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return NextResponse.json({
      student: {
        ...student,
        marks,
        attendance,
        reportCards,
        stats: {
          attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
          averageMark,
          totalAttendanceDays: totalAttendance,
          presentDays: presentCount,
          absentDays: absentCount,
          lateDays: lateCount,
          excusedDays: excusedCount,
          totalSubjects: Object.keys(marksBySubject).length,
          highestMark: validMarks.length > 0 ? Math.max(...validMarks.map((m) => m.total || 0)) : 0,
          lowestMark: validMarks.length > 0 ? Math.min(...validMarks.map((m) => m.total || 0)) : 0,
          gradeDistribution,
        },
        marksByTerm,
        marksBySubject,
      },
      academicYear: currentAcademicYear,
    })
  } catch (error) {
    console.error("Error fetching student details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
