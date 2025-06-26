import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const academicYearId = searchParams.get("academicYearId")

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Verify teacher has access to this class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assignedClasses: true,
      },
    })

    const hasAccess = teacher?.assignedClasses?.some((cls) => cls.id === classId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this class" }, { status: 403 })
    }

    const whereClause: any = {
      classId,
    }

    if (academicYearId) {
      whereClause.academicYearId = academicYearId
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
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
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
