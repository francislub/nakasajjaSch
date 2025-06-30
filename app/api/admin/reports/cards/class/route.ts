import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const academicYearId = searchParams.get("academicYearId")
    const termId = searchParams.get("termId")

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        classTeacher: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Build where clause for students
    const studentWhereClause: any = {
      classId: classId,
    }

    if (academicYearId) {
      studentWhereClause.academicYearId = academicYearId
    }

    if (termId && termId !== "all") {
      studentWhereClause.termId = termId
    }

    // Get report cards for the class
    const reportCards = await prisma.reportCard.findMany({
      where: {
        student: studentWhereClause,
      },
      include: {
        student: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            marks: {
              where: {
                ...(academicYearId && { academicYearId: academicYearId }),
                ...(termId && termId !== "all" && { termId: termId }),
              },
              include: {
                subject: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
                term: {
                  select: {
                    name: true,
                  },
                },
                teacher: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            term: {
              select: {
                id: true,
                name: true,
              },
            },
            academicYear: {
              select: {
                id: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          name: "asc",
        },
      },
    })

    // Get total students in class
    const totalStudents = await prisma.student.count({
      where: studentWhereClause,
    })

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: {
        minScore: "desc",
      },
    })

    const approvedReports = reportCards.filter((r) => r.isApproved).length
    const pendingReports = reportCards.length - approvedReports

    // Transform data to match frontend interface
    const transformedReportCards = reportCards.map((reportCard) => ({
      ...reportCard,
      term: reportCard.student?.term || { name: "Unknown" },
      academicYear: {
        id: reportCard.student?.academicYear?.id || "",
        name: reportCard.student?.academicYear?.year || "Unknown",
      },
    }))

    return NextResponse.json({
      classInfo: {
        name: classInfo.name,
        classTeacher: classInfo.classTeacher,
      },
      reportCards: transformedReportCards,
      totalStudents,
      approvedReports,
      pendingReports,
      gradingSystem,
    })
  } catch (error) {
    console.error("Error fetching class report cards:", error)
    return NextResponse.json({ error: "Failed to fetch class report cards" }, { status: 500 })
  }
}
