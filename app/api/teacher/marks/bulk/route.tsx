import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { marks } = await req.json()

    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ error: "Invalid marks data" }, { status: 400 })
    }

    // Validate each mark entry
    for (const mark of marks) {
      if (!mark.studentId || !mark.subjectId || typeof mark.mark !== "number" || mark.mark < 0 || mark.mark > 100) {
        return NextResponse.json({ error: "Invalid mark entry" }, { status: 400 })
      }
    }

    // Bulk update or create marks
    const operations = marks.map((mark: any) => {
      return prisma.mark.upsert({
        where: {
          studentId_subjectId: {
            studentId: mark.studentId,
            subjectId: mark.subjectId,
          },
        },
        update: {
          mark: mark.mark,
        },
        create: {
          studentId: mark.studentId,
          subjectId: mark.subjectId,
          mark: mark.mark,
        },
      })
    })

    const results = await prisma.$transaction(operations)

    return NextResponse.json({ message: "Marks updated successfully", results }, { status: 200 })
  } catch (error) {
    console.error("Error updating marks:", error)
    return NextResponse.json({ error: "Failed to update marks" }, { status: 500 })
  }
}
