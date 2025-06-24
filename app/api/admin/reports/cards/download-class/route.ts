import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { classId } = await request.json()

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

    // Get class info and report cards
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

    // Generate CSV content
    const csvHeaders = [
      "Student Name",
      "Class",
      "Term",
      "Academic Year",
      "Discipline",
      "Cleanliness",
      "Class Work Presentation",
      "Adherence to School",
      "Co-Curricular Activities",
      "Consideration to Others",
      "Speaking English",
      "Class Teacher Comment",
      "Headteacher Comment",
      "Status",
      "Parent Name",
      "Parent Email",
      "Parent Phone",
      "Created Date",
    ]

    const csvRows = reportCards.map((report) => [
      report.student.name,
      classInfo?.name || "",
      report.term?.name || "",
      report.academicYear?.name || "",
      report.discipline,
      report.cleanliness,
      report.classWorkPresentation,
      report.adherenceToSchool,
      report.coCurricularActivities,
      report.considerationToOthers,
      report.speakingEnglish,
      report.classTeacherComment || "",
      report.headteacherComment || "",
      report.isApproved ? "Approved" : "Pending",
      report.student.parent?.name || "",
      report.student.parent?.email || "",
      report.student.parent?.phone || "",
      new Date(report.createdAt).toLocaleDateString(),
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const fileName = `${classInfo?.name || "Class"}_Report_Cards_${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading class report cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
