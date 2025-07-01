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

    const classes = await prisma.class.findMany({
      include: {
        academicYear: true,
        subjects: true,
        students: true,
      },
      orderBy: { name: "asc" },
    })

    // Get class teachers separately since the relationship is from User to Class
    const classesWithTeachers = await Promise.all(
      classes.map(async (classItem) => {
        const teacher = await prisma.user.findFirst({
          where: {
            classId: classItem.id,
            role: "CLASS_TEACHER",
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })

        return {
          ...classItem,
          classTeacher: teacher,
        }
      }),
    )

    return NextResponse.json(classesWithTeachers)
  } catch (error) {
    console.error("Error fetching classes:", error)
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
    const { name, academicYearId } = body

    const classData = await prisma.class.create({
      data: {
        name,
        academicYearId,
      },
      include: {
        academicYear: true,
      },
    })

    return NextResponse.json(classData, { status: 201 })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
