import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    // Get parent's children
    const parent = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        children: {
          include: {
            class: true,
            attendance: {
              where: {
                ...(month &&
                  year && {
                    date: {
                      gte: new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1),
                      lt: new Date(Number.parseInt(year), Number.parseInt(month), 1),
                    },
                  }),
                ...(studentId && { studentId }),
              },
              orderBy: { date: "desc" },
              take: 50,
            },
          },
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    return NextResponse.json({ children: parent.children })
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
