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
                subjects: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
            academicYear: {
              select: {
                id: true,
                year: true,
                isActive: true,
              },
            },
            term: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
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

    // Get class teachers separately for each class
    const classIds = parent.children.map((child) => child.class?.id).filter(Boolean)
    const classTeachers = await prisma.class.findMany({
      where: {
        id: { in: classIds },
      },
      select: {
        id: true,
        classTeachers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create a map of class teachers for easy lookup
    const classTeacherMap = new Map()
    classTeachers.forEach((cls) => {
      classTeacherMap.set(cls.id, cls.classTeachers[0] || null)
    })

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
          name: classTeacherMap.get(child.class?.id)?.name || "Not Assigned",
          email: classTeacherMap.get(child.class?.id)?.email || "",
        },
        subjects: child.class?.subjects || [],
        academicYear: child.academicYear?.year || "Current Year",
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
