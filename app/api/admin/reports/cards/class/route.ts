import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")

    if (!classId || classId === "all") {
      return NextResponse.json({ error: "Valid class ID is required" }, { status: 400 })
    }

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        name: true,
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

    // Get all report cards for students in this class
    const reportCards = await prisma.reportCard.findMany({
      where: {
        student: {
          classId: classId,
          academicYearId: activeAcademicYear.id,
        },
      },
      include: {
        student: {
          include: {
            parent: {
              select: {
                name: true,
                email: true,
                phone: true,
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
              },
            },
          },
        },
        term: {
          select: {
            name: true,
          },
        },
        academicYear: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        student: {
          name: "asc",
        },
      },
    })

    return NextResponse.json({
      classInfo,
      reportCards,
      totalStudents: reportCards.length,
      approvedReports: reportCards.filter((r) => r.isApproved).length,
      pendingReports: reportCards.filter((r) => !r.isApproved).length,
    })
  } catch (error) {
    console.error("Error fetching class report cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
