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
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    const whereClause: any = {
      student: {
        academicYearId: activeAcademicYear.id,
      },
    }

    if (classId) {
      whereClause.student.classId = classId
    }

    if (search) {
      whereClause.student.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    if (status === "approved") {
      whereClause.isApproved = true
    } else if (status === "pending") {
      whereClause.isApproved = false
    }

    const reportCards = await prisma.reportCard.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
            parent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ reportCards })
  } catch (error) {
    console.error("Error fetching report cards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
