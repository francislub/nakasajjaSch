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
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")
    const search = searchParams.get("search")

    const where: any = {}

    if (classId && classId !== "all") {
      where.classId = classId
    }

    if (termId && termId !== "all") {
      where.termId = termId
    }

    // Handle academicYearId properly
    if (academicYearId && academicYearId !== "all") {
      if (academicYearId === "active") {
        // Find the active academic year first
        const activeYear = await prisma.academicYear.findFirst({
          where: { isActive: true },
        })
        if (activeYear) {
          where.academicYearId = activeYear.id
        }
      } else {
        // Use the provided academicYearId directly
        where.academicYearId = academicYearId
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { parent: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
        term: true,
        academicYear: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportCards: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Error fetching students with reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
