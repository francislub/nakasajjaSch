import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const academicYearId = searchParams.get("academicYearId")

    const whereClause: any = {}

    // For teachers, restrict to their assigned class
    if (session.user.role === "CLASS_TEACHER") {
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          assignedClasses: true,
        },
      })

      if (!teacher?.assignedClasses || teacher.assignedClasses.length === 0) {
        return NextResponse.json({ error: "No class assigned" }, { status: 400 })
      }

      whereClause.classId = teacher.assignedClasses[0].id
    } else if (classId) {
      // For secretary/admin, allow filtering by specific class
      whereClause.classId = classId
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            classTeacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            academicYear: {
              select: {
                id: true,
                year: true,
                isActive: true,
              },
            },
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
                id: true,
                name: true,
                code: true,
              },
            },
            term: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ subject: { name: "asc" } }, { term: { name: "asc" } }],
        },
        reportCards: {
          orderBy: {
            createdAt: "desc",
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
