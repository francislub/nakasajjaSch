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
    const search = searchParams.get("search")
    const status = searchParams.get("status")

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

    if (search) {
      studentWhereClause.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    // Build where clause for report cards
    const reportCardWhereClause: any = {
      student: studentWhereClause,
    }

    if (status) {
      reportCardWhereClause.isApproved = status === "approved"
    }

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
              where: {
                academicYearId: academicYearId,
                ...(termId && { termId: termId }),
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
        createdAt: "desc",
      },
    })

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
      reportCards: transformedReportCards,
      total: transformedReportCards.length,
    })
  } catch (error) {
    console.error("Error fetching report cards:", error)
    return NextResponse.json({ error: "Failed to fetch report cards" }, { status: 500 })
  }
}
