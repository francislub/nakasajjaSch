import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["CLASS_TEACHER", "SECRETARY", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { marks } = body

    if (!marks || !Array.isArray(marks)) {
      return NextResponse.json({ error: "Invalid marks data" }, { status: 400 })
    }

    const results = []

    for (const markData of marks) {
      const { studentId, subjectId, termId, mark, grade } = markData

      if (!studentId || !subjectId || !termId || mark === undefined) {
        continue // Skip invalid entries
      }

      const savedMark = await prisma.mark.upsert({
        where: {
          studentId_subjectId_termId: {
            studentId,
            subjectId,
            termId,
          },
        },
        update: {
          mark: Number(mark),
          grade,
          updatedAt: new Date(),
        },
        create: {
          studentId,
          subjectId,
          termId,
          mark: Number(mark),
          grade,
          createdById: session.user.id,
        },
        include: {
          student: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
          term: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      })

      results.push(savedMark)
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error("Error saving term marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
