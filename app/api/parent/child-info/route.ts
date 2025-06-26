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

    // Get parent's children with basic information only (no performance data)
    const parent = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        children: {
          include: {
            class: {
              include: {
                classTeacher: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                subjects: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
                academicYear: {
                  select: {
                    id: true,
                    year: true,
                    isActive: true,
                  },
                },
              },
            },
            attendance: {
              orderBy: { date: "desc" },
              take: 30,
              select: {
                id: true,
                date: true,
                status: true,
              },
            },
          },
          ...(studentId && { where: { id: studentId } }),
        },
      },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedChildren = parent.children.map((child) => ({
      id: child.id,
      name: child.name,
      email: child.email || "",
      dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString() : new Date().toISOString(),
      address: child.address || "",
      phoneNumber: child.phoneNumber || "",
      registrationNumber: child.registrationNumber || "",
      photo: child.photo || null,
      gender: child.gender || "",
      class: {
        id: child.class?.id || "",
        name: child.class?.name || "Not Assigned",
        teacher: {
          name: child.class?.classTeacher?.name || "Not Assigned",
          email: child.class?.classTeacher?.email || "",
        },
        subjects: child.class?.subjects || [],
        academicYear: child.class?.academicYear?.year || "Current Year",
      },
      attendance: child.attendance.map((record) => ({
        id: record.id,
        date: record.date ? record.date.toISOString() : new Date().toISOString(),
        status: record.status || "ABSENT",
      })),
    }))

    return NextResponse.json({ children: transformedChildren })
  } catch (error) {
    console.error("Error fetching child info:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
