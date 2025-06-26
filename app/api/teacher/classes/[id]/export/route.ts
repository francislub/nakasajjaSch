import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a teacher
    if (session.user.role !== "CLASS_TEACHER" && session.user.role !== "HEAD_TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!currentAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get class with students
    const classData = await prisma.class.findFirst({
      where: {
        id: params.id,
        classTeacherId: session.user.id,
        academicYearId: currentAcademicYear.id,
      },
      include: {
        students: {
          include: {
            parent: {
              select: {
                name: true,
                email: true,
              },
            },
            marks: {
              where: {
                academicYearId: currentAcademicYear.id,
              },
              include: {
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            attendance: {
              where: {
                academicYearId: currentAcademicYear.id,
              },
            },
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Create CSV content
    const headers = [
      "Student Name",
      "Gender",
      "Age",
      "Parent Name",
      "Parent Email",
      "Average Score",
      "Attendance Rate",
      "Total Marks",
      "Total Attendance Records",
    ]

    const csvRows = classData.students.map((student) => {
      const avgScore =
        student.marks.length > 0
          ? Math.round(
              student.marks.reduce((sum, mark) => sum + (mark.bot || 0) + (mark.midterm || 0) + (mark.eot || 0), 0) /
                (student.marks.length * 3),
            )
          : 0

      const attendanceRate =
        student.attendance.length > 0
          ? Math.round(
              (student.attendance.filter((a) => a.status === "PRESENT").length / student.attendance.length) * 100,
            )
          : 0

      return [
        student.name,
        student.gender,
        student.age,
        student.parent?.name || "",
        student.parent?.email || "",
        `${avgScore}%`,
        `${attendanceRate}%`,
        student.marks.length,
        student.attendance.length,
      ]
    })

    const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${classData.name}-students.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting class list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
