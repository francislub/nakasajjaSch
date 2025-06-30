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
    const reportId = searchParams.get("reportId")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportId },
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
                createdBy: {
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

    // Transform data to match frontend interface
    const transformedReportCard = {
      ...reportCard,
      term: reportCard.student?.term || { name: "Unknown" },
      academicYear: {
        id: reportCard.student?.academicYear?.id || "",
        name: reportCard.student?.academicYear?.year || "Unknown",
      },
      gradingSystem,
    }

    return NextResponse.json({
      reportCard: transformedReportCard,
    })
  } catch (error) {
    console.error("Error fetching report card preview:", error)
    return NextResponse.json({ error: "Failed to fetch report card preview" }, { status: 500 })
  }
}
