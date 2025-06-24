import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const subjectId = searchParams.get("subjectId")
    const search = searchParams.get("search")
    const performance = searchParams.get("performance")

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const whereClause: any = {
      academicYearId: activeAcademicYear.id,
    }

    if (classId) {
      whereClause.classId = classId
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            name: true,
          },
        },
        marks: {
          where: {
            ...(subjectId && { subjectId }),
            academicYearId: activeAcademicYear.id,
          },
          include: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Process student performance data
    const studentsWithPerformance = students.map((student) => {
      const marks = student.marks.filter((mark) => mark.total !== null)

      if (marks.length === 0) {
        return {
          id: student.id,
          name: student.name,
          photo: student.photo,
          class: student.class,
          averageMark: 0,
          totalSubjects: 0,
          highestMark: 0,
          lowestMark: 0,
          trend: "stable" as const,
          subjectPerformance: [],
          termProgress: [],
        }
      }

      const totalMarks = marks.reduce((sum, mark) => sum + (mark.total || 0), 0)
      const averageMark = Math.round(totalMarks / marks.length)
      const highestMark = Math.max(...marks.map((mark) => mark.total || 0))
      const lowestMark = Math.min(...marks.map((mark) => mark.total || 0))

      // Calculate subject performance
      const subjectPerformance = marks.map((mark) => ({
        subject: mark.subject?.name || "Unknown",
        average: mark.total || 0,
        grade: mark.grade || "N/A",
      }))

      // Determine trend (simplified - could be more sophisticated)
      const trend = averageMark >= 70 ? "up" : averageMark >= 50 ? "stable" : "down"

      return {
        id: student.id,
        name: student.name,
        photo: student.photo,
        class: student.class,
        averageMark,
        totalSubjects: marks.length,
        highestMark,
        lowestMark,
        trend,
        subjectPerformance,
        termProgress: [], // Can be implemented with term-based data
      }
    })

    // Filter by performance level if specified
    let filteredStudents = studentsWithPerformance
    if (performance) {
      filteredStudents = studentsWithPerformance.filter((student) => {
        switch (performance) {
          case "excellent":
            return student.averageMark >= 80
          case "good":
            return student.averageMark >= 70 && student.averageMark < 80
          case "average":
            return student.averageMark >= 60 && student.averageMark < 70
          case "below":
            return student.averageMark >= 50 && student.averageMark < 60
          case "poor":
            return student.averageMark < 50
          default:
            return true
        }
      })
    }

    return NextResponse.json({ students: filteredStudents })
  } catch (error) {
    console.error("Error fetching student performance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
