import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getGradeFromSystem, getGradeComment } from "@/lib/grading"
import { generateReportCardHTML, generateBulkReportCardsHTML } from "@/lib/report-card-generator"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER", "TEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const classId = searchParams.get("classId")
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")
    const format = searchParams.get("format") || "html" // html or json

    console.log("=== REPORT CARD GENERATION REQUEST ===")
    console.log("Student ID:", studentId)
    console.log("Class ID:", classId)
    console.log("Term ID:", termId)
    console.log("Academic Year ID:", academicYearId)
    console.log("Format:", format)

    // Get active academic year if not provided
    let activeAcademicYear
    if (academicYearId) {
      activeAcademicYear = await prisma.academicYear.findUnique({
        where: { id: academicYearId },
      })
    } else {
      activeAcademicYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      })
    }

    if (!activeAcademicYear) {
      return NextResponse.json({ error: "No active academic year found" }, { status: 400 })
    }

    // Get current term if not provided
    let currentTerm
    if (termId) {
      currentTerm = await prisma.term.findUnique({
        where: { id: termId },
      })
    } else {
      currentTerm = await prisma.term.findFirst({
        where: {
          academicYearId: activeAcademicYear.id,
          isCurrent: true,
        },
      })
    }

    if (!currentTerm) {
      return NextResponse.json({ error: "No current term found" }, { status: 400 })
    }

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    if (gradingSystem.length === 0) {
      return NextResponse.json({ error: "No grading system configured" }, { status: 400 })
    }

    console.log("Active Academic Year:", activeAcademicYear.year)
    console.log("Current Term:", currentTerm.name)
    console.log("Grading System:", gradingSystem.length, "grades")

    // Generate for single student
    if (studentId) {
      const reportData = await generateStudentReportData(
        studentId,
        currentTerm.id,
        activeAcademicYear.id,
        gradingSystem,
      )

      if (format === "json") {
        return NextResponse.json(reportData)
      }

      const htmlContent = generateReportCardHTML(reportData)
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="report-card-${studentId}.html"`,
        },
      })
    }

    // Generate for entire class
    if (classId) {
      const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            where: {
              academicYearId: activeAcademicYear.id,
              status: "ACTIVE",
            },
          },
        },
      })

      if (!classData || classData.students.length === 0) {
        return NextResponse.json({ error: "No students found in class" }, { status: 400 })
      }

      console.log("Generating reports for class:", classData.name)
      console.log("Students count:", classData.students.length)

      const reportCardsData = []
      for (const student of classData.students) {
        try {
          const reportData = await generateStudentReportData(
            student.id,
            currentTerm.id,
            activeAcademicYear.id,
            gradingSystem,
          )
          reportCardsData.push(reportData)
        } catch (error) {
          console.error(`Error generating report for student ${student.id}:`, error)
          // Continue with other students
        }
      }

      if (format === "json") {
        return NextResponse.json(reportCardsData)
      }

      const htmlContent = generateBulkReportCardsHTML(reportCardsData)
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="class-reports-${classId}.html"`,
        },
      })
    }

    return NextResponse.json({ error: "Either studentId or classId is required" }, { status: 400 })
  } catch (error) {
    console.error("Error generating report card:", error)
    return NextResponse.json(
      {
        error: "Failed to generate report card",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function generateStudentReportData(
  studentId: string,
  termId: string,
  academicYearId: string,
  gradingSystem: any[],
) {
  console.log("=== GENERATING STUDENT REPORT DATA ===")
  console.log("Student ID:", studentId)
  console.log("Term ID:", termId)
  console.log("Academic Year ID:", academicYearId)

  // Get student with all related data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          subjects: {
            include: {
              subjectTeachers: {
                where: { classId: { not: null } },
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
        where: {
          termId: termId,
          academicYearId: academicYearId,
        },
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

  // Get term and academic year data
  const term = await prisma.term.findUnique({ where: { id: termId } })
  const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } })

  // Get or create report card
  let reportCard = await prisma.reportCard.findFirst({
    where: {
      studentId: studentId,
      termId: termId,
      academicYearId: academicYearId,
    },
  })

  if (!reportCard) {
    // Create empty report card if it doesn't exist
    reportCard = {
      id: "",
      studentId: studentId,
      termId: termId,
      academicYearId: academicYearId,
      discipline: "",
      cleanliness: "",
      classWorkPresentation: "",
      adherenceToSchool: "",
      coCurricularActivities: "",
      considerationToOthers: "",
      speakingEnglish: "",
      classTeacherComment: "",
      headteacherComment: "",
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  console.log("Student found:", student.name)
  console.log("Class:", student.class?.name)
  console.log("Marks found:", student.marks.length)
  console.log("Class subjects:", student.class?.subjects.length)

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

      // Convert marks to numbers
      const homework = mark.homework ? Number(mark.homework) : 0
      const bot = mark.bot ? Number(mark.bot) : 0
      const midterm = mark.midterm ? Number(mark.midterm) : 0
      const eot = mark.eot ? Number(mark.eot) : 0
      const total = mark.total ? Number(mark.total) : homework + bot + midterm + eot

      // Calculate grades
      const botGrade = bot > 0 ? getGradeFromSystem(bot, gradingSystem) : ""
      const midtermGrade = midterm > 0 ? getGradeFromSystem(midterm, gradingSystem) : ""
      const eotGrade = eot > 0 ? getGradeFromSystem(eot, gradingSystem) : ""
      const overallGrade = mark.grade || (total > 0 ? getGradeFromSystem(total, gradingSystem) : "")

      // Get remarks
      let remarks = mark.remarks || ""
      if (!remarks && eot > 0) {
        remarks = getGradeComment(eotGrade, gradingSystem) || ""
      } else if (!remarks && total > 0) {
        remarks = getGradeComment(overallGrade, gradingSystem) || ""
      }

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

  // Calculate aggregates and division (using only general subjects)
  const getAggregatePoints = (grade: string) => {
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
  let validGeneralSubjects = 0

  generalSubjectsData.forEach((subject) => {
    if (subject.eotGrade) {
      totalBotAggregates += getAggregatePoints(subject.botGrade || "F9")
      totalMidtermAggregates += getAggregatePoints(subject.midtermGrade || "F9")
      totalEotAggregates += getAggregatePoints(subject.eotGrade || "F9")
      validGeneralSubjects++
    }
  })

  // Calculate division based on EOT aggregates (best 4 subjects)
  const aggregate = Math.min(totalEotAggregates, validGeneralSubjects * 9)
  let division = ""

  if (validGeneralSubjects === 0) {
    division = "NO GRADES"
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
    botAggregates: totalBotAggregates,
    midtermAggregates: totalMidtermAggregates,
    eotAggregates: totalEotAggregates,
  }

  console.log("Division calculated:", division)
  console.log("Aggregate:", aggregate)
  console.log("Valid general subjects:", validGeneralSubjects)

  return {
    student,
    reportCard,
    gradingSystem,
    division,
    aggregate,
    generalSubjectsData,
    allSubjectsData,
    totals,
    term,
    academicYear,
  }
}
