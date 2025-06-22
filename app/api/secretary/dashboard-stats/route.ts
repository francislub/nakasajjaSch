import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "SECRETARY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active academic year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 404 })
    }

    // Get statistics
    const [totalStudents, totalClasses, totalSubjects, recentRegistrations, studentsPerClass, marksEntered] =
      await Promise.all([
        prisma.student.count({
          where: { academicYearId: activeAcademicYear.id },
        }),
        prisma.class.count({
          where: { academicYearId: activeAcademicYear.id },
        }),
        prisma.subject.count(),
        prisma.student.findMany({
          where: { academicYearId: activeAcademicYear.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            class: true,
            parent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.class.findMany({
          where: { academicYearId: activeAcademicYear.id },
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        }),
        prisma.mark.count(),
      ])

    return NextResponse.json({
      totalStudents,
      totalClasses,
      totalSubjects,
      marksEntered,
      recentRegistrations,
      studentsPerClass: studentsPerClass.map((cls) => ({
        className: cls.name,
        studentCount: cls._count.students,
      })),
      academicYear: activeAcademicYear.year,
    })
  } catch (error) {
    console.error("Error fetching secretary dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
