import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const studentId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")

    console.log("Fetching report details for:", { studentId, termId, academicYearId })

    // Get student basic info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            subjects: true,
          },
        },
        term: true,
        academicYear: true,
        parent: true,
        reportCards: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    console.log("Found student:", student.name)

    // Build marks query conditions - try multiple approaches to find marks
    const marksWhere: any = {
      studentId,
    }

    // Add term filter if provided
    if (termId && termId !== "all") {
      marksWhere.termId = termId
    }

    // Add academic year filter if provided
    if (academicYearId && academicYearId !== "all") {
      marksWhere.academicYearId = academicYearId
    }

    console.log("Primary marks query conditions:", marksWhere)

    // First, try to get marks with the specified filters
    let marks = await prisma.mark.findMany({
      where: marksWhere,
      include: {
        subject: true,
        term: true,
        academicYear: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ subject: { name: "asc" } }, { createdAt: "desc" }],
    })

    console.log(`Found ${marks.length} marks with primary query`)

    // If no marks found with filters, try broader searches
    if (marks.length === 0) {
      console.log("No marks found with filters, trying broader search...")

      // Try without academic year filter
      if (academicYearId && academicYearId !== "all") {
        const broaderWhere = { studentId }
        if (termId && termId !== "all") {
          broaderWhere.termId = termId
        }

        marks = await prisma.mark.findMany({
          where: broaderWhere,
          include: {
            subject: true,
            term: true,
            academicYear: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: [{ subject: { name: "asc" } }, { createdAt: "desc" }],
        })

        console.log(`Found ${marks.length} marks without academic year filter`)
      }

      // If still no marks, try with just student ID
      if (marks.length === 0) {
        marks = await prisma.mark.findMany({
          where: { studentId },
          include: {
            subject: true,
            term: true,
            academicYear: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: [{ subject: { name: "asc" } }, { createdAt: "desc" }],
        })

        console.log(`Found ${marks.length} marks with student ID only`)
      }
    }

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    console.log(`Found ${gradingSystem.length} grading system entries`)

    // Process marks by subject - group by subject and get latest marks for each assessment type
    const subjectsMap = new Map()

    // Initialize with class subjects
    student.class.subjects.forEach((subject) => {
      subjectsMap.set(subject.id, {
        id: subject.id,
        name: subject.name,
        category: subject.category,
        homework: 0,
        bot: 0,
        midterm: 0,
        eot: 0,
        total: 0,
        grade: "F",
        teacherInitials: "",
        hasMarks: false,
      })
    })

    // Process marks and update subject data
    if (marks.length > 0) {
      console.log("Processing marks data...")

      // Group marks by subject to get the most recent marks for each assessment type
      const marksBySubject = new Map()

      marks.forEach((mark) => {
        const subjectId = mark.subject?.id
        if (!subjectId) return

        if (!marksBySubject.has(subjectId)) {
          marksBySubject.set(subjectId, [])
        }
        marksBySubject.get(subjectId).push(mark)
      })

      // Process each subject's marks
      marksBySubject.forEach((subjectMarks, subjectId) => {
        const subject = subjectsMap.get(subjectId)
        if (!subject) return

        // Sort marks by creation date (most recent first)
        subjectMarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        // Get the most recent marks for each assessment type
        let homework = 0,
          bot = 0,
          midterm = 0,
          eot = 0,
          total = 0
        let grade = "F"
        let teacherInitials = ""
        let hasAnyMarks = false

        // Look through marks to find the most recent non-null values for each assessment type
        for (const mark of subjectMarks) {
          if (mark.homework !== null && mark.homework !== undefined && homework === 0) {
            homework = Number(mark.homework) || 0
            hasAnyMarks = true
          }
          if (mark.bot !== null && mark.bot !== undefined && bot === 0) {
            bot = Number(mark.bot) || 0
            hasAnyMarks = true
          }
          if (mark.midterm !== null && mark.midterm !== undefined && midterm === 0) {
            midterm = Number(mark.midterm) || 0
            hasAnyMarks = true
          }
          if (mark.eot !== null && mark.eot !== undefined && eot === 0) {
            eot = Number(mark.eot) || 0
            hasAnyMarks = true
          }
          if (mark.total !== null && mark.total !== undefined && total === 0) {
            total = Number(mark.total) || 0
            hasAnyMarks = true
          }
          if (mark.grade && grade === "F") {
            grade = mark.grade
          }
          if (mark.createdBy?.name && !teacherInitials) {
            teacherInitials = mark.createdBy.name
              .split(" ")
              .map((n) => n[0])
              .join("")
          }
        }

        // If no total was recorded, calculate it
        if (total === 0 && hasAnyMarks) {
          total = homework + bot + midterm + eot
        }

        // Calculate grade if not provided and we have a total
        if (grade === "F" && total > 0 && gradingSystem.length > 0) {
          grade = calculateGrade(total, gradingSystem)
        }

        // Update subject data
        subject.homework = homework
        subject.bot = bot
        subject.midterm = midterm
        subject.eot = eot
        subject.total = total
        subject.grade = grade
        subject.teacherInitials = teacherInitials
        subject.hasMarks = hasAnyMarks

        console.log(
          `Subject ${subject.name}: homework=${homework}, bot=${bot}, midterm=${midterm}, eot=${eot}, total=${total}, grade=${grade}`,
        )
      })
    }

    const subjects = Array.from(subjectsMap.values())
    console.log(`Processed ${subjects.length} subjects`)

    // Calculate divisions for each exam type
    const divisions = {
      BOT: calculateDivisionForExamType(subjects, "bot", gradingSystem),
      MID: calculateDivisionForExamType(subjects, "midterm", gradingSystem),
      END: calculateDivisionForExamType(subjects, "eot", gradingSystem),
    }

    console.log("Calculated divisions:", divisions)

    // Calculate assessment totals
    const assessmentTotals = {
      homework: subjects.reduce((sum, subject) => sum + subject.homework, 0),
      bot: subjects.reduce((sum, subject) => sum + subject.bot, 0),
      midterm: subjects.reduce((sum, subject) => sum + subject.midterm, 0),
      eot: subjects.reduce((sum, subject) => sum + subject.eot, 0),
      total: subjects.reduce((sum, subject) => sum + subject.total, 0),
    }

    // Calculate overall division based on total marks
    const generalSubjects = subjects.filter((s) => s.category === "GENERAL")
    const validGeneralSubjects = generalSubjects.filter((s) => s.total > 0).length

    let overallDivision = "FAIL"
    let overallAggregate = 0

    if (validGeneralSubjects >= 4 && gradingSystem.length > 0) {
      const gradeValues: { [key: string]: number } = {
        D1: 1,
        D2: 2,
        C3: 3,
        C4: 4,
        C5: 5,
        C6: 6,
        P7: 7,
        P8: 8,
        F: 9,
      }

      const best4GeneralSubjects = generalSubjects
        .filter((subject) => subject.total > 0)
        .sort((a, b) => (gradeValues[a.grade] || 9) - (gradeValues[b.grade] || 9))
        .slice(0, 4)

      overallAggregate = best4GeneralSubjects.reduce((sum, subject) => sum + (gradeValues[subject.grade] || 9), 0)

      if (overallAggregate >= 4 && overallAggregate <= 12) {
        overallDivision = "DIVISION_1"
      } else if (overallAggregate >= 13 && overallAggregate <= 24) {
        overallDivision = "DIVISION_2"
      } else if (overallAggregate >= 25 && overallAggregate <= 32) {
        overallDivision = "DIVISION_3"
      } else if (overallAggregate >= 33 && overallAggregate <= 35) {
        overallDivision = "DIVISION_4"
      } else if (overallAggregate === 36) {
        overallDivision = "UNGRADED"
      }
    }

    const response = {
      student: {
        id: student.id,
        name: student.name,
        photo: student.photo,
        gender: student.gender,
        class: student.class,
        term: student.term,
        academicYear: student.academicYear,
        parent: student.parent,
        reportCards: student.reportCards,
        divisions, // Add divisions for each exam type
      },
      subjects,
      assessmentTypes: ["homework", "bot", "midterm", "eot"],
      division: overallDivision,
      overallAggregate,
      validGeneralSubjects,
      assessmentTotals,
      grandTotal: assessmentTotals.total,
      gradingSystem,
      marksFound: marks.length,
      subjectsWithMarks: subjects.filter((s) => s.hasMarks).length,
    }

    console.log(
      `Returning response with ${subjects.length} subjects, ${marks.length} marks found, ${subjects.filter((s) => s.hasMarks).length} subjects with marks`,
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching student report details:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch student report details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function calculateGrade(marks: number, gradingSystem: any[]): string {
  if (!gradingSystem || gradingSystem.length === 0) {
    // Default grading if no system is defined
    if (marks >= 80) return "D1"
    if (marks >= 70) return "D2"
    if (marks >= 60) return "C3"
    if (marks >= 50) return "C4"
    if (marks >= 40) return "C5"
    if (marks >= 30) return "C6"
    if (marks >= 20) return "P7"
    if (marks >= 10) return "P8"
    return "F"
  }

  for (const grade of gradingSystem) {
    if (marks >= (grade.minMark || 0) && marks <= (grade.maxMark || 100)) {
      return grade.grade
    }
  }
  return "F"
}

function calculateDivisionForExamType(
  subjects: any[],
  examType: "homework" | "bot" | "midterm" | "eot",
  gradingSystem: any[],
) {
  console.log(`Calculating division for exam type: ${examType}`)

  // Filter only GENERAL subjects for division calculation
  const generalSubjects = subjects.filter((subject) => subject.category === "GENERAL")
  console.log(`Found ${generalSubjects.length} general subjects`)

  if (generalSubjects.length < 4) {
    console.log(`Not enough general subjects (${generalSubjects.length}/4 required)`)
    return null
  }

  // Get scores for the specific exam type and calculate grades
  const subjectScores = generalSubjects
    .map((subject) => {
      const score = subject[examType] || 0
      const grade = score > 0 ? calculateGrade(score, gradingSystem) : "F"

      // Convert grade to numeric value
      const gradeValues: { [key: string]: number } = {
        D1: 1,
        D2: 2,
        C3: 3,
        C4: 4,
        C5: 5,
        C6: 6,
        P7: 7,
        P8: 8,
        F: 9,
      }

      console.log(`Subject ${subject.name}: score=${score}, grade=${grade}`)

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        score,
        grade,
        gradeValue: gradeValues[grade] || 9,
      }
    })
    .filter((subject) => subject.score > 0) // Only include subjects with scores

  console.log(`Found ${subjectScores.length} subjects with scores for ${examType}`)

  if (subjectScores.length < 4) {
    console.log(`Not enough subjects with scores (${subjectScores.length}/4 required)`)
    return null
  }

  // Sort by grade value (best grades first) and take exactly 4 general subjects
  const best4GeneralSubjects = subjectScores.sort((a, b) => a.gradeValue - b.gradeValue).slice(0, 4)
  console.log(
    `Best 4 subjects for ${examType}:`,
    best4GeneralSubjects.map((s) => `${s.subjectName}: ${s.grade}`),
  )

  // Calculate aggregate (sum of grade values for best 4 general subjects)
  const aggregate = best4GeneralSubjects.reduce((sum, subject) => sum + subject.gradeValue, 0)
  console.log(`Aggregate for ${examType}: ${aggregate}`)

  // Determine division based on aggregate
  let division = "FAIL"
  let label = "FAIL"
  let color = "bg-red-100 text-red-800 border-red-200"

  if (aggregate >= 4 && aggregate <= 12) {
    division = "DIVISION_1"
    label = "Division I"
    color = "bg-emerald-100 text-emerald-800 border-emerald-200"
  } else if (aggregate >= 13 && aggregate <= 24) {
    division = "DIVISION_2"
    label = "Division II"
    color = "bg-blue-100 text-blue-800 border-blue-200"
  } else if (aggregate >= 25 && aggregate <= 32) {
    division = "DIVISION_3"
    label = "Division III"
    color = "bg-amber-100 text-amber-800 border-amber-200"
  } else if (aggregate >= 33 && aggregate <= 35) {
    division = "DIVISION_4"
    label = "Division IV"
    color = "bg-orange-100 text-orange-800 border-orange-200"
  } else if (aggregate === 36) {
    division = "UNGRADED"
    label = "U"
    color = "bg-purple-100 text-purple-800 border-purple-200"
  }

  console.log(`Final division for ${examType}: ${division} (${label})`)

  return {
    division,
    aggregate,
    label,
    color,
    subjects: best4GeneralSubjects,
  }
}
