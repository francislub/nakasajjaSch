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

    const classId = params.id

    // Verify teacher has access to this class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
      include: {
        students: {
          include: {
            parent: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            marks: {
              include: {
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            attendance: {
              select: {
                status: true,
                date: true,
              },
            },
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Generate CSV content
    const csvHeaders = [
      "Student Name",
      "Gender",
      "Age",
      "Parent Name",
      "Parent Email",
      "Parent Phone",
      "Average Score",
      "Attendance Rate",
      "Total Marks",
      "Present Days",
      "Total Days",
    ]

    const csvRows = classData.students.map((student) => {
      const avgScore =
        student.marks.length > 0
          ? Math.round(student.marks.reduce((sum, m) => sum + m.value, 0) / student.marks.length)
          : 0

      const presentDays = student.attendance.filter((a) => a.status === "PRESENT").length
      const totalDays = student.attendance.length
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

      return [
        student.name,
        student.gender,
        student.age.toString(),
        student.parent?.name || "N/A",
        student.parent?.email || "N/A",
        student.parent?.phone || "N/A",
        `${avgScore}%`,
        `${attendanceRate}%`,
        student.marks.length.toString(),
        presentDays.toString(),
        totalDays.toString(),
      ]
    })

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
      "\n",
    )

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${classData.name}-students.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting class list:", error)
    return NextResponse.json({ error: "Failed to export class list" }, { status: 500 })
  }
}
