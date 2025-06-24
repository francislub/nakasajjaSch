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
    const date = searchParams.get("date")

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

    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    // Get students and their attendance for the specified date
    const students = await prisma.student.findMany({
      where: {
        classId: teacherClass.id,
        academicYearId: activeAcademicYear.id,
      },
      include: {
        attendance: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { attendanceData, date } = body

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

    // Get active academic year and term
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        terms: {
          where: {
            startDate: { lte: new Date(date) },
            endDate: { gte: new Date(date) },
          },
        },
      },
    })

    if (!activeAcademicYear || activeAcademicYear.terms.length === 0) {
      return NextResponse.json({ error: "No active academic year or term found" }, { status: 404 })
    }

    const activeTerm = activeAcademicYear.terms[0]

    // Delete existing attendance for the date
    await prisma.attendance.deleteMany({
      where: {
        classId: teacherClass.id,
        date: new Date(date),
      },
    })

    // Create new attendance records
    const attendanceRecords = attendanceData.map((record: any) => ({
      studentId: record.studentId,
      classId: teacherClass.id,
      termId: activeTerm.id,
      academicYearId: activeAcademicYear.id,
      date: new Date(date),
      status: record.status,
      createdById: session.user.id,
    }))

    await prisma.attendance.createMany({
      data: attendanceRecords,
    })

    return NextResponse.json({ message: "Attendance saved successfully" })
  } catch (error) {
    console.error("Error saving attendance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
