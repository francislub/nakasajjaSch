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

    let classes = []

    if (session.user.role === "CLASS_TEACHER") {
      // Get teacher's assigned classes
      const teacher = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          assignedClasses: {
            include: {
              academicYear: {
                select: {
                  id: true,
                  year: true,
                  isActive: true,
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

      classes = teacher?.assignedClasses || []
    } else if (session.user.role === "SECRETARY" || session.user.role === "ADMIN") {
      // Secretary and Admin can access all classes
      classes = await prisma.class.findMany({
        include: {
          academicYear: {
            select: {
              id: true,
              year: true,
              isCurrent: true,
            },
          },
          subjects: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          classTeacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })
    }

    return NextResponse.json({ classes })
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
