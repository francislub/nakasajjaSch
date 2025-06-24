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

    // Get classes assigned to this teacher as class teacher
    const classes = await prisma.class.findMany({
      where: {
        classTeacherId: session.user.id,
      },
      include: {
        students: {
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
                  },
                },
              },
            },
            attendance: {
              select: {
                status: true,
                date: true,
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
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error("Error fetching teacher classes:", error)
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
  }
}
