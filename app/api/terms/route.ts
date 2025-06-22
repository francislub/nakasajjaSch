import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const terms = await prisma.term.findMany({
      include: {
        academicYear: true,
        students: true,
      },
      orderBy: { startDate: "asc" },
    })

    return NextResponse.json(terms)
  } catch (error) {
    console.error("Error fetching terms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, startDate, endDate, academicYearId } = body

    const term = await prisma.term.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYearId,
      },
      include: {
        academicYear: true,
      },
    })

    return NextResponse.json(term, { status: 201 })
  } catch (error) {
    console.error("Error creating term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
