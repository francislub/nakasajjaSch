import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateClassDivisions, getDivisionStatistics } from "@/lib/division"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")

    if (!classId || !termId) {
      return NextResponse.json({ error: "Class ID and Term ID are required" }, { status: 400 })
    }

    // Get current academic year if not provided
    let currentAcademicYearId = academicYearId
    if (!currentAcademicYearId) {
      const currentAcademicYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true },
      })
      currentAcademicYearId = currentAcademicYear?.id
    }

    // Get students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        class: {
          select: { id: true, name: true },
        },
        parent: {
          select: { name: true, email: true },
        },
        reportCards: {
          where: {
            termId,
            academicYearId: currentAcademicYearId,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    })

    // Calculate divisions for all exam types
    const [botDivisions, midDivisions, endDivisions] = await Promise.all([
      calculateClassDivisions(classId, termId, "BOT", currentAcademicYearId),
      calculateClassDivisions(classId, termId, "MID", currentAcademicYearId),
      calculateClassDivisions(classId, termId, "END", currentAcademicYearId),
    ])

    // Get statistics for all exam types
    const [botStats, midStats, endStats] = await Promise.all([
      getDivisionStatistics(classId, termId, "BOT", currentAcademicYearId),
      getDivisionStatistics(classId, termId, "MID", currentAcademicYearId),
      getDivisionStatistics(classId, termId, "END", currentAcademicYearId),
    ])

    // Combine student data with divisions
    const studentsWithDivisions = students.map((student) => ({
      ...student,
      divisions: {
        BOT: botDivisions[student.id] || null,
        MID: midDivisions[student.id] || null,
        END: endDivisions[student.id] || null,
      },
    }))

    return NextResponse.json({
      students: studentsWithDivisions,
      statistics: {
        BOT: botStats,
        MID: midStats,
        END: endStats,
      },
    })
  } catch (error) {
    console.error("Error fetching students with divisions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
