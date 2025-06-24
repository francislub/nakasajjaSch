import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { marks } = await request.json()

    if (!Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ error: "Invalid marks data" }, { status: 400 })
    }

    // Process marks in batches to avoid database overload
    const results = []
    for (const mark of marks) {
      const { studentId, subjectId, termId, assessment1, assessment2, assessment3, bot, eot, total, grade } = mark

      // Check if mark already exists
      const existingMark = await prisma.mark.findFirst({
        where: {
          studentId,
          subjectId,
          ...(termId && { termId }),
        },
      })

      if (existingMark) {
        // Update existing mark
        const updatedMark = await prisma.mark.update({
          where: { id: existingMark.id },
          data: {
            assessment1,
            assessment2,
            assessment3,
            bot,
            eot,
            total,
            grade,
            updatedAt: new Date(),
          },
        })
        results.push(updatedMark)
      } else {
        // Create new mark
        const newMark = await prisma.mark.create({
          data: {
            studentId,
            subjectId,
            termId,
            assessment1,
            assessment2,
            assessment3,
            bot,
            eot,
            total,
            grade,
            createdById: session.user.id,
          },
        })
        results.push(newMark)
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${results.length} marks`,
      results,
    })
  } catch (error) {
    console.error("Error saving bulk marks:", error)
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 })
  }
}
