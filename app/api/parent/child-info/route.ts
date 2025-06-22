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

    // Get parent's children with detailed information
    const parent = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        children: {
          include: {
            class: {
              include: {
                teacher: true,
                subjects: true,
              },
            },
            marks: {
              include: {
                subject: true,
                term: true,
                academicYear: true,
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            attendance: {
              orderBy: { date: "desc" },
              take: 10,
            },
          },
          ...(studentId && { where: { id: studentId } }),
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    return NextResponse.json({ children: parent.children })
  } catch (error) {
    console.error("Error fetching child info:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
