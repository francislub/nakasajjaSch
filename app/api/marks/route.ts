import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, subjectId, classId, termId, homework, bot, midterm, eot } = body

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Calculate total and grade
    const total = (homework || 0) + (bot || 0) + (midterm || 0) + (eot || 0)

    // Get grade based on total
    const gradingSystem = await prisma.gradingSystem.findFirst({
      where: {
        minMark: { lte: total },
        maxMark: { gte: total },
      },
    })

    const grade = gradingSystem?.grade || "F"

    // Create or update mark
    const mark = await prisma.mark.upsert({
      where: {
        studentId_subjectId_termId: {
          studentId,
          subjectId,
          termId,
        },
      },
      update: {
        homework: homework ? Number.parseFloat(homework) : null,
        bot: bot ? Number.parseFloat(bot) : null,
        midterm: midterm ? Number.parseFloat(midterm) : null,
        eot: eot ? Number.parseFloat(eot) : null,
        total,
        grade,
      },
      create: {
        studentId,
        subjectId,
        classId,
        termId,
        academicYearId: activeAcademicYear.id,
        homework: homework ? Number.parseFloat(homework) : null,
        bot: bot ? Number.parseFloat(bot) : null,
        midterm: midterm ? Number.parseFloat(midterm) : null,
        eot: eot ? Number.parseFloat(eot) : null,
        total,
        grade,
        createdById: session.user.id,
      },
      include: {
        student: true,
        subject: true,
      },
    })

    return NextResponse.json(mark, { status: 201 })
  } catch (error) {
    console.error("Error saving marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Allow ADMIN, SECRETARY, and CLASS_TEACHER to view marks
    if (!["ADMIN", "SECRETARY", "CLASS_TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")

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
    if (termId) whereClause.termId = termId

    const marks = await prisma.mark.findMany({
      where: whereClause,
      include: {
        student: true,
        subject: true,
        class: true,
        term: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ student: { name: "asc" } }, { subject: { name: "asc" } }],
    })

    return NextResponse.json(marks)
  } catch (error) {
    console.error("Error fetching marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
