import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher's assigned class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assignedClasses: {
          include: {
            subjects: true,
            students: {
              where: {
                academicYear: {
                  isActive: true,
                },
              },
              include: {
                parent: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                name: "asc",
              },
            },
          },
        },
      },
    })

    if (!teacher?.assignedClasses || teacher.assignedClasses.length === 0) {
      return NextResponse.json({ error: "No class assigned to teacher" }, { status: 404 })
    }

    const teacherClass = teacher.assignedClasses[0]

    // Get active academic year and terms
    const [activeAcademicYear, terms, gradingSystem] = await Promise.all([
      prisma.academicYear.findFirst({
        where: { isActive: true },
      }),
      prisma.term.findMany({
        where: {
          academicYearId: {
            in: await prisma.academicYear
              .findFirst({ where: { isActive: true } })
              .then((year) => (year ? [year.id] : [])),
          },
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.gradingSystem.findMany({
        orderBy: { minMark: "desc" },
      }),
    ])

    return NextResponse.json({
      class: teacherClass,
      students: teacherClass.students,
      subjects: teacherClass.subjects,
      terms,
      gradingSystem,
      activeAcademicYear,
    })
  } catch (error) {
    console.error("Error fetching class data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
