import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "HEADTEACHER", "SECRETARY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")
    const search = searchParams.get("search")

    const where: any = {}

    if (classId && classId !== "all") {
      where.classId = classId
    }

    if (termId && termId !== "all") {
      where.termId = termId
    }

    if (academicYearId && academicYearId !== "all") {
      where.academicYearId = academicYearId
    } else if (academicYearId === "active") {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })
      if (activeYear) {
        where.academicYearId = activeYear.id
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { parent: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
        term: true,
        academicYear: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Create CSV content
    const csvHeaders = [
      "Name",
      "Email",
      "Gender",
      "Date of Birth",
      "Class",
      "Academic Year",
      "Term",
      "Parent Name",
      "Parent Email",
      "Phone",
      "Address",
      "Emergency Contact",
      "Registration Date",
    ]

    const csvRows = students.map((student) => [
      student.name,
      student.email || "",
      student.gender,
      new Date(student.dateOfBirth).toLocaleDateString(),
      student.class.name,
      student.academicYear.year,
      student.term.name,
      student.parent?.name || "",
      student.parent?.email || "",
      student.phone || "",
      student.address || "",
      student.emergencyContact || "",
      new Date(student.createdAt).toLocaleDateString(),
    ])

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.map((field) => `"${field}"`).join(","))].join(
      "\n",
    )

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="students-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting students:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
