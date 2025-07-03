import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const academicYearId = searchParams.get("academicYearId")
    const termId = searchParams.get("termId")

    // Build where clause for children filtering
    const childrenWhere: any = {}
    if (studentId) {
      childrenWhere.id = studentId
    }
    if (academicYearId) {
      childrenWhere.academicYearId = academicYearId
    }
    if (termId) {
      childrenWhere.termId = termId
    }

    // Get parent's children with report cards
    const parent = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        children: {
          where: Object.keys(childrenWhere).length > 0 ? childrenWhere : undefined,
          include: {
            class: {
              include: {
                subjects: true,
              },
            },
            term: true,
            academicYear: true,
            reportCards: {
              include: {
                student: true,
              },
              orderBy: { createdAt: "desc" },
            },
            marks: {
              include: {
                subject: true,
                term: true,
                academicYear: true,
              },
            },
          },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Filter report cards to only show those with parent access enabled
    const childrenWithAccessibleReports = parent.children
      .map((child) => ({
        ...child,
        reportCards: child.reportCards
          .filter((reportCard) => {
            const comment = reportCard.headteacherComment || ""
            const accessMarkerRegex = /\[PARENT_ACCESS_ENABLED_\d+\]/
            return accessMarkerRegex.test(comment)
          })
          .map((reportCard) => ({
            ...reportCard,
            // Clean the comment for display (remove access markers)
            headteacherComment: (reportCard.headteacherComment || "")
              .replace(/\[PARENT_ACCESS_ENABLED_\d+\]/g, "")
              .trim(),
            // Add term and academic year from student
            term: child.term,
            academicYear: child.academicYear,
          })),
      }))
      .filter((child) => child.reportCards.length > 0) // Only include children with accessible reports

    return NextResponse.json({ children: childrenWithAccessibleReports })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
