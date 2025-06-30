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
    const academicYearId = searchParams.get("academicYearId")
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")
    const status = searchParams.get("status")

    if (!academicYearId) {
      return NextResponse.json({ error: "Academic Year ID is required" }, { status: 400 })
    }

    // Build where clause for students
    const studentWhereClause: any = {
      academicYearId: academicYearId,
    }

    if (classId && classId !== "all") {
      studentWhereClause.classId = classId
    }

    if (termId && termId !== "all") {
      studentWhereClause.termId = termId
    }

    // Build where clause for report cards
    const reportCardWhereClause: any = {
      student: studentWhereClause,
    }

    if (status && status !== "all") {
      reportCardWhereClause.isApproved = status === "approved"
    }

    // Get report cards
    const reportCards = await prisma.reportCard.findMany({
      where: reportCardWhereClause,
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
      orderBy: [
        {
          student: {
            class: {
              name: "asc",
            },
          },
        },
        {
          student: {
            name: "asc",
          },
        },
      ],
    })

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: {
        minScore: "desc",
      },
    })

    // Transform data
    const transformedReportCards = reportCards.map((reportCard) => ({
      ...reportCard,
      term: reportCard.student?.term || { name: "Unknown" },
      academicYear: {
        id: reportCard.student?.academicYear?.id || "",
        name: reportCard.student?.academicYear?.year || "Unknown",
      },
    }))

    return NextResponse.json({
      reportCards: transformedReportCards,
      totalCount: transformedReportCards.length,
      gradingSystem,
      filters: {
        academicYear: academicYearId,
        term: termId !== "all" ? termId : undefined,
        class: classId !== "all" ? classId : undefined,
        status: status !== "all" ? status : undefined,
      },
    })
  } catch (error) {
    console.error("Error fetching bulk preview:", error)
    return NextResponse.json({ error: "Failed to fetch bulk preview" }, { status: 500 })
  }
}
