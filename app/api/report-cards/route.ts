import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    const whereClause: any = {}

    if (session.user.role === "PARENT") {
      // Parents can only see their children's report cards
      const parent = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { children: true },
      })

      if (!parent) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 })
      }

      whereClause.studentId = { in: parent.children.map((child) => child.id) }
      whereClause.isApproved = true // Parents can only see approved reports
    } else if (studentId) {
      whereClause.studentId = studentId
    }

    const reportCards = await prisma.reportCard.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: true,
            parent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reportCards)
  } catch (error) {
    console.error("Error fetching report cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      studentId,
      discipline,
      cleanliness,
      classWorkPresentation,
      adherenceToSchool,
      coCurricularActivities,
      considerationToOthers,
      speakingEnglish,
      classTeacherComment,
      headteacherComment,
    } = body

    const reportCard = await prisma.reportCard.create({
      data: {
        studentId,
        discipline,
        cleanliness,
        classWorkPresentation,
        adherenceToSchool,
        coCurricularActivities,
        considerationToOthers,
        speakingEnglish,
        classTeacherComment,
        headteacherComment,
        isApproved: session.user.role === "HEADTEACHER",
        approvedAt: session.user.role === "HEADTEACHER" ? new Date() : null,
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    })

    return NextResponse.json(reportCard, { status: 201 })
  } catch (error) {
    console.error("Error creating report card:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
