import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { attendanceData, date, classId, termId } = body

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Create attendance records
    const attendanceRecords = await Promise.all(
      attendanceData.map(async (record: any) => {
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: new Date(date),
            },
          },
          update: {
            status: record.status,
          },
          create: {
            studentId: record.studentId,
            classId,
            termId,
            academicYearId: activeAcademicYear.id,
            date: new Date(date),
            status: record.status,
            createdById: session.user.id,
          },
        })
      }),
    )

    return NextResponse.json(attendanceRecords, { status: 201 })
  } catch (error) {
    console.error("Error saving attendance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const classId = searchParams.get("classId")
    const date = searchParams.get("date")

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

    if (studentId) whereClause.studentId = studentId
    if (classId) whereClause.classId = classId
    if (date) whereClause.date = new Date(date)

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
