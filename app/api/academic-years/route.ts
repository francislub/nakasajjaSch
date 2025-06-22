import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const academicYears = await prisma.academicYear.findMany({
      orderBy: { year: "desc" },
      include: {
        terms: true,
        classes: true,
        students: true,
      },
    })

    return NextResponse.json(academicYears)
  } catch (error) {
    console.error("Error fetching academic years:", error)
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
    const { year, startDate, endDate, isActive } = body

    // If setting as active, deactivate all other academic years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
      },
    })

    return NextResponse.json(academicYear, { status: 201 })
  } catch (error) {
    console.error("Error creating academic year:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
