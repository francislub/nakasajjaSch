import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateBulkReportCardsHTML } from "@/lib/report-card-generator"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { academicYearId, classId, termId, status } = await request.json()

    if (!academicYearId) {
      return NextResponse.json({ error: "Academic Year ID is required" }, { status: 400 })
    }

    // Build where clause for students
    const studentWhereClause: any = {
      academicYearId: academicYearId,
    }

    if (classId) {
      studentWhereClause.classId = classId
    }

    if (termId) {
      studentWhereClause.termId = termId
    }

    // Build where clause for report cards
    const reportCardWhereClause: any = {
      student: studentWhereClause,
    }

    if (status) {
      reportCardWhereClause.isApproved = status === "approved"
    }

    // Get report cards
    const reportCards = await prisma.reportCard.findMany({
      where: reportCardWhereClause,
      include: {
        student: {
          include: {
            class: {
              include: {
                subjects: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    category: true,
                  },
                },
              },
            },
            parent: true,
            marks: {
              include: {
                subject: {
                  include: {
                    subjectTeachers: {
                      include: {
                        teacher: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
                term: true,
                teacher: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            term: true,
            academicYear: true,
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

    if (reportCards.length === 0) {
      return NextResponse.json({ error: "No report cards found matching the criteria" }, { status: 404 })
    }

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: {
        minMark: "desc",
      },
    })

    // Generate HTML for bulk report cards
    const htmlContent = generateBulkReportCardsHTML(reportCards, gradingSystem)

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="bulk-report-cards-${Date.now()}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating bulk report cards:", error)
    return NextResponse.json({ error: "Failed to generate bulk report cards" }, { status: 500 })
  }
}
