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
    const reportId = searchParams.get("reportId")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportId },
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
    })

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 })
    }

    return NextResponse.json({ reportCard })
  } catch (error) {
    console.error("Error fetching report card preview:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
