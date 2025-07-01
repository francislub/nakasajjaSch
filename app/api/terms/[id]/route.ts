import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const term = await prisma.term.findUnique({
      where: { id: params.id },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...term,
      studentCount: term._count.students,
    })
  } catch (error) {
    console.error("Error fetching term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, startDate, endDate, academicYearId } = await request.json()

    if (!name || !startDate || !endDate || !academicYearId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if term exists
    const existingTerm = await prisma.term.findUnique({
      where: { id: params.id },
    })

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    })

    if (!academicYear) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 })
    }

    // Check for overlapping terms in the same academic year (excluding current term)
    const overlappingTerm = await prisma.term.findFirst({
      where: {
        academicYearId,
        id: { not: params.id },
        OR: [
          {
            AND: [{ startDate: { lte: new Date(startDate) } }, { endDate: { gte: new Date(startDate) } }],
          },
          {
            AND: [{ startDate: { lte: new Date(endDate) } }, { endDate: { gte: new Date(endDate) } }],
          },
          {
            AND: [{ startDate: { gte: new Date(startDate) } }, { endDate: { lte: new Date(endDate) } }],
          },
        ],
      },
    })

    if (overlappingTerm) {
      return NextResponse.json({ error: "Term dates overlap with existing term" }, { status: 400 })
    }

    const term = await prisma.term.update({
      where: { id: params.id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYearId,
      },
      include: {
        academicYear: {
          select: {
            id: true,
            year: true,
          },
        },
        students: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...term,
      studentCount: term._count.students,
    })
  } catch (error) {
    console.error("Error updating term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if term exists
    const existingTerm = await prisma.term.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
            reportCards: true,
          },
        },
      },
    })

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 })
    }

    // Check if term has associated data
    if (existingTerm._count.students > 0 || existingTerm._count.reportCards > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete term with associated students or report cards",
        },
        { status: 400 },
      )
    }

    await prisma.term.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Term deleted successfully" })
  } catch (error) {
    console.error("Error deleting term:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
