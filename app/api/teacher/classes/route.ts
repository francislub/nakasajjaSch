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

    // Get teacher's assigned class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { classId: true },
    })

    if (!teacher?.classId) {
      return NextResponse.json(
        {
          classes: [],
          message: "No class assigned to this teacher",
        },
        { status: 200 },
      )
    }

    // Get the class details with all related information
    const teacherClass = await prisma.class.findUnique({
      where: { id: teacher.classId },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            age: true,
            photo: true,
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            marks: {
              select: {
                id: true,
                bot: true,
                midterm: true,
                eot: true,
                total: true,
                grade: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    category: true,
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
              select: {
                id: true,
                date: true,
                status: true,
              },
              orderBy: {
                date: "desc",
              },
              take: 50, // Limit to recent attendance records
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    if (!teacherClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Calculate stats for each student
    const studentsWithStats = teacherClass.students.map((student) => {
      // Calculate attendance stats
      const totalAttendanceDays = student.attendance.length
      const presentDays = student.attendance.filter((a) => a.status === "PRESENT").length
      const absentDays = student.attendance.filter((a) => a.status === "ABSENT").length
      const lateDays = student.attendance.filter((a) => a.status === "LATE").length
      const excusedDays = student.attendance.filter((a) => a.status === "EXCUSED").length
      const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0

      // Calculate marks stats
      const validMarks = student.marks.filter((m) => m.total !== null).map((m) => m.total as number)
      const averageMark =
        validMarks.length > 0 ? Math.round(validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length) : 0
      const highestMark = validMarks.length > 0 ? Math.max(...validMarks) : 0
      const lowestMark = validMarks.length > 0 ? Math.min(...validMarks) : 0
      const totalSubjects = student.marks.length

      return {
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
          excusedDays,
        },
      }
    })

    // Format the response to match expected structure
    const formattedClass = {
      ...teacherClass,
      students: studentsWithStats,
      classTeacher: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    }

    return NextResponse.json({
      classes: [formattedClass], // Return as array for consistency
      totalClasses: 1,
    })
  } catch (error) {
    console.error("Error fetching teacher classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
