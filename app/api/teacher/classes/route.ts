import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a teacher
    if (session.user.role !== "CLASS_TEACHER" && session.user.role !== "HEAD_TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!currentAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get teacher's assigned classes
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assignedClasses: {
          where: {
            academicYearId: currentAcademicYear.id,
          },
          include: {
            students: {
              include: {
                parent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                marks: {
                  where: {
                    academicYearId: currentAcademicYear.id,
                  },
                  include: {
                    subject: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                      },
                    },
                  },
                },
                attendance: {
                  where: {
                    academicYearId: currentAcademicYear.id,
                  },
                },
              },
            },
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    return NextResponse.json({
      classes: teacher.assignedClasses,
      academicYear: currentAcademicYear,
    })
  } catch (error) {
    console.error("Error fetching teacher classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
