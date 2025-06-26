import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
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

    // Get all students in the class with their existing reports for the term
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            name: true,
            email: true,
          },
        },
        reportCards: {
          where: {
            termId: termId,
            academicYearId: currentAcademicYearId || undefined,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      students,
      termId,
      academicYearId: currentAcademicYearId,
    })
  } catch (error) {
    console.error("Error fetching report cards by term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
