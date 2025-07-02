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
    const { classId, academicYearId, termId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Build where clause for students
    const studentWhereClause: any = {
      classId: classId,
    }

    if (academicYearId) {
      studentWhereClause.academicYearId = academicYearId
    }

    if (termId) {
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
              where: {
                ...(academicYearId && { academicYearId: academicYearId }),
                ...(termId && { termId: termId }),
              },
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
      orderBy: {
        student: {
          name: "asc",
        },
      },
    })

    if (reportCards.length === 0) {
      return NextResponse.json({ error: "No report cards found for this class" }, { status: 404 })
    }

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: {
        minMark: "desc",
      },
    })

    // Generate HTML for class report cards
    const htmlContent = generateBulkReportCardsHTML(reportCards, gradingSystem)

    const className = reportCards[0]?.student?.class?.name || "Unknown Class"

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="class-report-cards-${className}-${Date.now()}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating class report cards:", error)
    return NextResponse.json({ error: "Failed to generate class report cards" }, { status: 500 })
  }
}
