import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateReportCardHTML } from "@/lib/report-card-generator"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const reportId = searchParams.get("reportId")

    if (!studentId || !reportId) {
      return NextResponse.json({ error: "Student ID and Report ID are required" }, { status: 400 })
    }

    // Get report card with all related data
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportId },
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
                academicYearId: {
                  not: null,
                },
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
                createdBy: {
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
    })

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 })
    }

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: {
        minMark: "desc",
      },
    })

    // Generate HTML for the report card
    const htmlContent = generateReportCardHTML({
      reportCard,
      student: reportCard.student,
      gradingSystem,
    })

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="report-card-${studentId}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating report card:", error)
    return NextResponse.json({ error: "Failed to generate report card" }, { status: 500 })
  }
}
