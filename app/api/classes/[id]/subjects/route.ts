import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classId } = await params

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // First, verify the class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Based on the schema, subjects have a classId field (direct relationship)
    // Get subjects that belong to this class
    const subjects = await prisma.subject.findMany({
      where: {
        classId: classId,
      },
      orderBy: {
        name: "asc",
      },
    })

    // If no subjects are directly assigned to the class,
    // get subjects that have marks for students in this class
    if (subjects.length === 0) {
      const subjectsWithMarks = await prisma.subject.findMany({
        where: {
          marks: {
            some: {
              student: {
                classId: classId,
              },
            },
          },
        },
        distinct: ["id"],
        orderBy: {
          name: "asc",
        },
      })

      return NextResponse.json({
        subjects: subjectsWithMarks,
        count: subjectsWithMarks.length,
      })
    }

    return NextResponse.json({
      subjects,
      count: subjects.length,
    })
  } catch (error) {
    console.error("Error fetching class subjects:", error)
    return NextResponse.json({ error: "Failed to fetch subjects for class" }, { status: 500 })
  }
}
