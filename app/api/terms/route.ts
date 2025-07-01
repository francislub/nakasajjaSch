import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get("academicYearId")

    const where: any = {}

    if (academicYearId && academicYearId !== "all") {
      where.academicYearId = academicYearId
    }

    const terms = await prisma.term.findMany({
      where,
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
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

    if (!name || !academicYearId) {
      return NextResponse.json({ error: "Name and academic year are required" }, { status: 400 })
    }

    const term = await prisma.term.create({
      data: {
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        academicYearId,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(term, { status: 201 })
  } catch (error) {
    console.error("Error creating term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
