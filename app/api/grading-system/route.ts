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

    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    return NextResponse.json(gradingSystem)
  } catch (error) {
    console.error("Error fetching grading system:", error)
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
    const { grade, minMark, maxMark, comment } = body

    const gradingEntry = await prisma.gradingSystem.create({
      data: {
        grade,
        minMark: Number.parseFloat(minMark),
        maxMark: Number.parseFloat(maxMark),
        comment,
      },
    })

    return NextResponse.json(gradingEntry, { status: 201 })
  } catch (error) {
    console.error("Error creating grading entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
