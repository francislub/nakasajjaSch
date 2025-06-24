import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classId } = await params

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Get students for the specific class
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      students,
      count: students.length,
    })
  } catch (error) {
    console.error("Error fetching class students:", error)
    return NextResponse.json({ error: "Failed to fetch students for class" }, { status: 500 })
  }
}
