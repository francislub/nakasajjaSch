import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getGradeFromSystem, getGradeComment } from "@/lib/grading"
import { generateReportCardHTML } from "@/lib/report-card-generator"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const reportId = searchParams.get("reportId")

    if (!studentId || !reportId) {
      return NextResponse.json({ error: "Student ID and Report ID are required" }, { status: 400 })
    }

    // Get term and academic year from query parameters
    const termId = searchParams.get("termId")
    let academicYearId = searchParams.get("academicYearId")

    if (!termId) {
      return NextResponse.json({ error: "Term ID is required" }, { status: 400 })
    }

    // If no academic year provided, get the active one
    if (!academicYearId) {
      const activeAcademicYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })
      if (activeAcademicYear) {
        academicYearId = activeAcademicYear.id
      }
    }

    // Verify the report card exists
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportId },
    })

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 })
    }

    // Generate report data using the term and academic year from parameters
    const reportData = await generateStudentReportData(studentId, termId, academicYearId, reportCard)

    const htmlContent = generateReportCardHTML(reportData)

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="report-card-${studentId}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating report card:", error)
    return NextResponse.json({ error: "Failed to generate report card" }, { status: 500 })
  }
}

async function generateStudentReportData(
  studentId: string,
  termId: string,
  academicYearId: string | null,
  reportCard: any,
) {
  console.log("=== GENERATING STUDENT REPORT DATA ===")
  console.log("Student ID:", studentId)
  console.log("Term ID:", termId)
  console.log("Academic Year ID:", academicYearId)

  // Get grading system
  const gradingSystem = await prisma.gradingSystem.findMany({
    orderBy: { minMark: "desc" },
  })

  // Get next term schedule
  const nextTermSchedule = await prisma.nextTermSchedule.findFirst({
    where: {
      academicYearId: academicYearId || undefined,
      termId: termId,
    },
  })

  // Debug: Check if marks exist for this student at all
  const allMarksForStudent = await prisma.mark.findMany({
    where: { studentId: studentId },
    select: {
      id: true,
      termId: true,
      academicYearId: true,
      subject: { select: { name: true, category: true } },
      homework: true,
      bot: true,
      midterm: true,
      eot: true,
      total: true,
      grade: true,
    },
  })

  console.log("=== DEBUG: ALL MARKS FOR STUDENT ===")
  console.log("Total marks found for student:", allMarksForStudent.length)
  allMarksForStudent.forEach((mark, index) => {
    console.log(`Mark ${index + 1}:`, {
      id: mark.id,
      subject: mark.subject?.name,
      category: mark.subject?.category,
      termId: mark.termId,
      academicYearId: mark.academicYearId,
      homework: mark.homework,
      bot: mark.bot,
      midterm: mark.midterm,
      eot: mark.eot,
      total: mark.total,
      grade: mark.grade,
    })
  })

  // Debug: Check if the term and academic year exist
  const term = await prisma.term.findUnique({ where: { id: termId } })
  const academicYear = academicYearId ? await prisma.academicYear.findUnique({ where: { id: academicYearId } }) : null

  console.log("=== DEBUG: TERM AND ACADEMIC YEAR ===")
  console.log("Term found:", term ? { id: term.id, name: term.name } : "NOT FOUND")
  console.log(
    "Academic Year found:",
    academicYear ? { id: academicYear.id, name: academicYear.name } : "NOT FOUND OR NULL",
  )

  // Simplified marks query - just use termId for now
  const marksWhereCondition: any = {
    studentId: studentId,
    termId: termId,
  }

  console.log("=== DEBUG: MARKS WHERE CONDITION ===")
  console.log("Marks where condition:", JSON.stringify(marksWhereCondition, null, 2))

  // Get student with all related data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          subjects: {
            include: {
              subjectTeachers: {
                include: {
                  teacher: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
      parent: true,
      marks: {
        where: marksWhereCondition,
        include: {
          subject: {
            include: {
              subjectTeachers: {
                include: {
                  teacher: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          term: true,
          academicYear: true,
          createdBy: {
            select: { name: true },
          },
        },
      },
    },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  console.log("Student found:", student.name)
  console.log("Class:", student.class?.name)
  console.log("Marks found for specific term:", student.marks.length)
  console.log("Class subjects:", student.class?.subjects.length)

  // Debug: Log the specific marks query results
  console.log("=== DEBUG: MARKS FOR SPECIFIC TERM ===")
  student.marks.forEach((mark, index) => {
    console.log(`Filtered Mark ${index + 1}:`, {
      id: mark.id,
      subject: mark.subject?.name,
      category: mark.subject?.category,
      termId: mark.termId,
      academicYearId: mark.academicYearId,
      homework: mark.homework,
      bot: mark.bot,
      midterm: mark.midterm,
      eot: mark.eot,
      total: mark.total,
      grade: mark.grade,
    })
  })

  // Process marks by subject
  const subjectMarksMap = new Map()

  student.marks.forEach((mark) => {
    const subjectName = mark.subject?.name
    if (subjectName && !subjectMarksMap.has(subjectName)) {
      // Get teacher initials
      let teacherInitials = ""
      const subjectTeacher = mark.subject?.subjectTeachers?.find((st) => st.classId === student.classId)
      if (subjectTeacher?.teacher?.name) {
        teacherInitials = subjectTeacher.teacher.name
          .split(" ")
          .map((n) => n.charAt(0))
          .join("")
      } else if (mark.createdBy?.name) {
        teacherInitials = mark.createdBy.name
          .split(" ")
          .map((n) => n.charAt(0))
          .join("")
      }

      // Convert marks to numbers, handling both string and number types
      const homework = mark.homework
        ? typeof mark.homework === "string"
          ? Number.parseFloat(mark.homework)
          : Number(mark.homework)
        : 0
      const bot = mark.bot ? (typeof mark.bot === "string" ? Number.parseFloat(mark.bot) : Number(mark.bot)) : 0
      const midterm = mark.midterm
        ? typeof mark.midterm === "string"
          ? Number.parseFloat(mark.midterm)
          : Number(mark.midterm)
        : 0
      const eot = mark.eot ? (typeof mark.eot === "string" ? Number.parseFloat(mark.eot) : Number(mark.eot)) : 0
      const total = mark.total
        ? typeof mark.total === "string"
          ? Number.parseFloat(mark.total)
          : Number(mark.total)
        : eot || homework + bot + midterm + eot

      // Calculate grades
      const botGrade = bot > 0 ? getGradeFromSystem(bot, gradingSystem) : ""
      const midtermGrade = midterm > 0 ? getGradeFromSystem(midterm, gradingSystem) : ""
      const eotGrade = eot > 0 ? getGradeFromSystem(eot, gradingSystem) : ""
      const overallGrade = mark.grade || (total > 0 ? getGradeFromSystem(total, gradingSystem) : "")

      // Get remarks based on E.O.T (End of Term) marks - PRIORITY TO E.O.T
      let remarks = ""
      if (eot > 0 && eotGrade) {
        // Use E.O.T grade for remarks
        remarks = getGradeComment(eotGrade, gradingSystem) || ""
      } else if (total > 0 && overallGrade) {
        // Fallback to overall grade
        remarks = getGradeComment(overallGrade, gradingSystem) || ""
      }

      console.log(`Processing subject ${subjectName}:`, {
        homework,
        bot,
        midterm,
        eot,
        total,
        botGrade,
        midtermGrade,
        eotGrade,
        overallGrade,
        teacherInitials,
        remarks,
        category: mark.subject?.category,
      })

      subjectMarksMap.set(subjectName, {
        name: subjectName,
        homework: homework > 0 ? homework : "",
        bot: bot > 0 ? bot : "",
        botGrade,
        midterm: midterm > 0 ? midterm : "",
        midtermGrade,
        eot: eot > 0 ? eot : "",
        eotGrade,
        total: total > 0 ? total : "",
        grade: overallGrade,
        teacherInitials,
        remarks,
        category: mark.subject?.category || "GENERAL",
        isGeneral: mark.subject?.category === "GENERAL",
      })
    }
  })

  // Process all class subjects (including those without marks)
  const allSubjectsData = []
  const generalSubjectsData = []

  if (student.class?.subjects) {
    student.class.subjects.forEach((subject) => {
      const subjectData = subjectMarksMap.get(subject.name) || {
        name: subject.name,
        homework: "",
        bot: "",
        botGrade: "",
        midterm: "",
        midtermGrade: "",
        eot: "",
        eotGrade: "",
        total: "",
        grade: "",
        teacherInitials: "",
        remarks: "",
        category: subject.category || "GENERAL",
        isGeneral: subject.category === "GENERAL",
      }

      allSubjectsData.push(subjectData)

      if (subject.category === "GENERAL") {
        generalSubjectsData.push(subjectData)
      }
    })
  }

  console.log("All subjects processed:", allSubjectsData.length)
  console.log("General subjects:", generalSubjectsData.length)

  // Calculate aggregates and division (using only E.O.T marks from general subjects)
  const getAggregatePoints = (grade: string) => {
    if (!grade) return 9
    const gradeUpper = grade.toUpperCase()
    if (gradeUpper.includes("D1")) return 1
    if (gradeUpper.includes("D2")) return 2
    if (gradeUpper.includes("C3")) return 3
    if (gradeUpper.includes("C4")) return 4
    if (gradeUpper.includes("C5")) return 5
    if (gradeUpper.includes("C6")) return 6
    if (gradeUpper.includes("P7")) return 7
    if (gradeUpper.includes("P8")) return 8
    if (gradeUpper.includes("F9")) return 9
    return 9 // Default to worst grade
  }

  let totalBotAggregates = 0
  let totalMidtermAggregates = 0
  let totalEotAggregates = 0
  let validGeneralSubjectsBot = 0
  let validGeneralSubjectsMidterm = 0
  let validGeneralSubjectsEot = 0

  // Count only general subjects with actual marks for each assessment type
  generalSubjectsData.forEach((subject) => {
    if (subject.botGrade && subject.bot) {
      totalBotAggregates += getAggregatePoints(subject.botGrade)
      validGeneralSubjectsBot++
    }
    if (subject.midtermGrade && subject.midterm) {
      totalMidtermAggregates += getAggregatePoints(subject.midtermGrade)
      validGeneralSubjectsMidterm++
    }
    if (subject.eotGrade && subject.eot) {
      totalEotAggregates += getAggregatePoints(subject.eotGrade)
      validGeneralSubjectsEot++
    }
  })

  console.log("=== AGGREGATE CALCULATION ===")
  console.log("Valid general subjects for BOT:", validGeneralSubjectsBot)
  console.log("Valid general subjects for Midterm:", validGeneralSubjectsMidterm)
  console.log("Valid general subjects for EOT:", validGeneralSubjectsEot)
  console.log("Total BOT aggregates:", totalBotAggregates)
  console.log("Total Midterm aggregates:", totalMidtermAggregates)
  console.log("Total EOT aggregates:", totalEotAggregates)

  // Calculate division based on EOT aggregates only (must have at least 4 general subjects)
  const aggregate = totalEotAggregates
  let division = ""

  if (validGeneralSubjectsEot < 4) {
    division = "INCOMPLETE"
  } else if (aggregate <= 12) {
    division = "DIVISION I"
  } else if (aggregate <= 24) {
    division = "DIVISION II"
  } else if (aggregate <= 32) {
    division = "DIVISION III"
  } else if (aggregate <= 35) {
    division = "DIVISION IV"
  } else if (aggregate <= 36) {
    division = "UNGRADED"
  } else {
    division = "FAIL"
  }

  const totals = {
    botAggregates: validGeneralSubjectsBot >= 4 ? totalBotAggregates : 0,
    midtermAggregates: validGeneralSubjectsMidterm >= 4 ? totalMidtermAggregates : 0,
    eotAggregates: validGeneralSubjectsEot >= 4 ? totalEotAggregates : 0,
  }

  console.log("Division calculated:", division)
  console.log("Aggregate:", aggregate)
  console.log("Final totals:", totals)
  console.log("Next term schedule:", nextTermSchedule)

  // If no marks found, let's create a warning message
  if (student.marks.length === 0) {
    console.log("⚠️  WARNING: No marks found for this student in the specified term")
    console.log(
      "Available terms for this student:",
      allMarksForStudent.map((m) => m.termId).filter((v, i, a) => a.indexOf(v) === i),
    )
    console.log(
      "Available academic years for this student:",
      allMarksForStudent.map((m) => m.academicYearId).filter((v, i, a) => a.indexOf(v) === i),
    )
  }

  return {
    student: {
      ...student,
      term,
      academicYear,
    },
    reportCard,
    gradingSystem,
    division,
    aggregate,
    generalSubjectsData,
    allSubjectsData,
    totals,
    term,
    academicYear,
    nextTermSchedule,
  }
}
