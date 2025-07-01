import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { exportType, subjectId, termId, examType, studentId, format = "csv", includeStats = true } = body

    // Get teacher's class
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        class: {
          include: {
            students: {
              orderBy: { name: "asc" },
            },
          },
        },
      },
    })

    if (!teacher?.class) {
      return NextResponse.json({ error: "No class assigned" }, { status: 400 })
    }

    const teacherClass = teacher.class

    // Build where clause based on export type
    const whereClause: any = {
      student: {
        classId: teacherClass.id,
      },
    }

    if (subjectId && subjectId !== "all") whereClause.subjectId = subjectId
    if (termId && termId !== "all") whereClause.termId = termId
    if (studentId && studentId !== "all") whereClause.studentId = studentId

    // Fetch marks with relations
    const marks = await prisma.mark.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ student: { name: "asc" } }, { subject: { name: "asc" } }, { term: { name: "asc" } }],
    })

    // Get additional data for context
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    })

    const terms = await prisma.term.findMany({
      orderBy: { name: "asc" },
    })

    // Get grading system from database
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: { minMark: "desc" },
    })

    // Process data based on export type
    let exportData: any[] = []
    const metadata: any = {
      className: teacherClass.name,
      teacherName: teacher.name,
      exportDate: new Date().toISOString(),
      exportType,
      totalRecords: marks.length,
    }

    switch (exportType) {
      case "subject_examtype":
        exportData = processSubjectExamTypeExport(marks, examType)
        metadata.subjectName = subjects.find((s) => s.id === subjectId)?.name
        metadata.examType = examType
        break

      case "subject_all_exams":
        exportData = processSubjectAllExamsExport(marks)
        metadata.subjectName = subjects.find((s) => s.id === subjectId)?.name
        break

      case "all_subjects_all_exams":
        exportData = processAllSubjectsAllExamsExport(marks)
        break

      case "student_report":
        exportData = processStudentReportExport(marks, studentId)
        metadata.studentName = marks[0]?.student?.name
        break

      case "class_summary":
        exportData = processClassSummaryExport(marks, teacherClass.students, gradingSystem)
        break

      case "performance_analysis":
        exportData = processPerformanceAnalysisExport(marks)
        break

      case "grade_distribution":
        exportData = processGradeDistributionExport(marks)
        break

      default:
        exportData = processDefaultExport(marks)
    }

    // Add statistics if requested
    if (includeStats) {
      metadata.statistics = calculateStatistics(marks)
    }

    return NextResponse.json({
      data: exportData,
      metadata,
      format,
    })
  } catch (error) {
    console.error("Error exporting marks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Export processing functions
function processSubjectExamTypeExport(marks: any[], examType: string) {
  return marks
    .map((mark) => {
      let examMark = null
      switch (examType) {
        case "BOT":
          examMark = mark.bot
          break
        case "MOT":
          examMark = mark.midterm
          break
        case "EOT":
          examMark = mark.eot
          break
      }

      return {
        studentName: mark.student.name,
        studentId: mark.student.id,
        subjectName: mark.subject.name,
        subjectCode: mark.subject.code,
        termName: mark.term.name,
        examType,
        mark: examMark || 0,
        grade: mark.grade,
        total: mark.total,
        createdBy: mark.createdBy?.name,
        lastUpdated: mark.updatedAt,
      }
    })
    .filter((item) => item.mark > 0)
}

function processSubjectAllExamsExport(marks: any[]) {
  const groupedByStudent = marks.reduce((acc: any, mark) => {
    const key = `${mark.student.id}_${mark.subject.id}_${mark.term.id}`
    if (!acc[key]) {
      acc[key] = {
        studentName: mark.student.name,
        studentId: mark.student.id,
        subjectName: mark.subject.name,
        subjectCode: mark.subject.code,
        termName: mark.term.name,
        bot: mark.bot || 0,
        mot: mark.midterm || 0,
        eot: mark.eot || 0,
        total: mark.total || 0,
        grade: mark.grade,
        lastUpdated: mark.updatedAt,
      }
    }
    return acc
  }, {})

  return Object.values(groupedByStudent)
}

function processAllSubjectsAllExamsExport(marks: any[]) {
  const groupedByStudent = marks.reduce((acc: any, mark) => {
    const studentKey = mark.student.id
    if (!acc[studentKey]) {
      acc[studentKey] = {
        studentName: mark.student.name,
        studentId: mark.student.id,
        subjects: {},
        overallAverage: 0,
        totalSubjects: 0,
      }
    }

    const subjectKey = `${mark.subject.id}_${mark.term.id}`
    acc[studentKey].subjects[subjectKey] = {
      subjectName: mark.subject.name,
      subjectCode: mark.subject.code,
      termName: mark.term.name,
      bot: mark.bot || 0,
      mot: mark.midterm || 0,
      eot: mark.eot || 0,
      total: mark.total || 0,
      grade: mark.grade,
    }

    return acc
  }, {})

  // Calculate overall averages
  Object.values(groupedByStudent).forEach((student: any) => {
    const subjects = Object.values(student.subjects) as any[]
    const validTotals = subjects.filter((s) => s.total > 0)
    if (validTotals.length > 0) {
      student.overallAverage = Math.round(validTotals.reduce((sum, s) => sum + s.total, 0) / validTotals.length)
      student.totalSubjects = validTotals.length
    }
  })

  return Object.values(groupedByStudent)
}

function processStudentReportExport(marks: any[], studentId: string) {
  const studentMarks = marks.filter((mark) => mark.student.id === studentId)

  const groupedBySubject = studentMarks.reduce((acc: any, mark) => {
    const key = `${mark.subject.id}_${mark.term.id}`
    acc[key] = {
      subjectName: mark.subject.name,
      subjectCode: mark.subject.code,
      termName: mark.term.name,
      bot: mark.bot || 0,
      mot: mark.midterm || 0,
      eot: mark.eot || 0,
      total: mark.total || 0,
      grade: mark.grade,
      strengths:
        mark.total >= 80 ? "Excellent" : mark.total >= 70 ? "Good" : mark.total >= 60 ? "Average" : "Needs Improvement",
      lastUpdated: mark.updatedAt,
    }
    return acc
  }, {})

  return {
    studentInfo: studentMarks[0]?.student,
    subjects: Object.values(groupedBySubject),
    summary: {
      totalSubjects: Object.keys(groupedBySubject).length,
      averageScore: calculateStudentAverage(Object.values(groupedBySubject)),
      highestScore: Math.max(...Object.values(groupedBySubject).map((s: any) => s.total)),
      lowestScore: Math.min(...Object.values(groupedBySubject).map((s: any) => s.total)),
    },
  }
}

function processClassSummaryExport(marks: any[], students: any[], gradingSystem: any[]) {
  const calculateGradeFromDatabase = (average: number) => {
    for (const grade of gradingSystem) {
      if (average >= (grade.minMark || 0) && average <= (grade.maxMark || 100)) {
        return grade.grade
      }
    }
    return "F"
  }

  const summary = students.map((student) => {
    const studentMarks = marks.filter((mark) => mark.student.id === student.id)
    const validMarks = studentMarks.filter((mark) => mark.total > 0)

    const average =
      validMarks.length > 0 ? Math.round(validMarks.reduce((sum, mark) => sum + mark.total, 0) / validMarks.length) : 0

    return {
      studentName: student.name,
      studentId: student.id,
      totalSubjects: validMarks.length,
      averageScore: average,
      highestScore: validMarks.length > 0 ? Math.max(...validMarks.map((m) => m.total)) : 0,
      lowestScore: validMarks.length > 0 ? Math.min(...validMarks.map((m) => m.total)) : 0,
      grade: calculateGradeFromDatabase(average),
      status: average >= 50 ? "Pass" : "Fail",
    }
  })

  return summary.sort((a, b) => b.averageScore - a.averageScore)
}

function processPerformanceAnalysisExport(marks: any[]) {
  const analysis = {
    bySubject: {},
    byExamType: {
      BOT: { total: 0, count: 0, average: 0 },
      MOT: { total: 0, count: 0, average: 0 },
      EOT: { total: 0, count: 0, average: 0 },
    },
    gradeDistribution: {},
    trends: [],
  }

  // Analyze by subject
  marks.forEach((mark) => {
    const subjectName = mark.subject.name
    if (!analysis.bySubject[subjectName]) {
      analysis.bySubject[subjectName] = {
        total: 0,
        count: 0,
        average: 0,
        highest: 0,
        lowest: 100,
      }
    }

    if (mark.total > 0) {
      analysis.bySubject[subjectName].total += mark.total
      analysis.bySubject[subjectName].count += 1
      analysis.bySubject[subjectName].highest = Math.max(analysis.bySubject[subjectName].highest, mark.total)
      analysis.bySubject[subjectName].lowest = Math.min(analysis.bySubject[subjectName].lowest, mark.total)
    }

    // Analyze by exam type
    if (mark.bot > 0) {
      analysis.byExamType.BOT.total += mark.bot
      analysis.byExamType.BOT.count += 1
    }
    if (mark.midterm > 0) {
      analysis.byExamType.MOT.total += mark.midterm
      analysis.byExamType.MOT.count += 1
    }
    if (mark.eot > 0) {
      analysis.byExamType.EOT.total += mark.eot
      analysis.byExamType.EOT.count += 1
    }

    // Grade distribution
    if (mark.grade) {
      analysis.gradeDistribution[mark.grade] = (analysis.gradeDistribution[mark.grade] || 0) + 1
    }
  })

  // Calculate averages
  Object.keys(analysis.bySubject).forEach((subject) => {
    const subjectData = analysis.bySubject[subject]
    subjectData.average = subjectData.count > 0 ? Math.round(subjectData.total / subjectData.count) : 0
  })

  Object.keys(analysis.byExamType).forEach((examType) => {
    const examData = analysis.byExamType[examType]
    examData.average = examData.count > 0 ? Math.round(examData.total / examData.count) : 0
  })

  return analysis
}

function processGradeDistributionExport(marks: any[]) {
  const distribution = {}
  const gradeStats = {}

  marks.forEach((mark) => {
    if (mark.grade) {
      distribution[mark.grade] = (distribution[mark.grade] || 0) + 1

      if (!gradeStats[mark.grade]) {
        gradeStats[mark.grade] = {
          count: 0,
          totalMarks: 0,
          averageMark: 0,
          students: [],
        }
      }

      gradeStats[mark.grade].count += 1
      gradeStats[mark.grade].totalMarks += mark.total || 0
      gradeStats[mark.grade].students.push({
        name: mark.student.name,
        subject: mark.subject.name,
        mark: mark.total,
      })
    }
  })

  // Calculate averages
  Object.keys(gradeStats).forEach((grade) => {
    const stats = gradeStats[grade]
    stats.averageMark = stats.count > 0 ? Math.round(stats.totalMarks / stats.count) : 0
  })

  return {
    distribution,
    statistics: gradeStats,
    totalAssessments: marks.length,
  }
}

function processDefaultExport(marks: any[]) {
  return marks.map((mark) => ({
    studentName: mark.student.name,
    studentId: mark.student.id,
    subjectName: mark.subject.name,
    subjectCode: mark.subject.code,
    termName: mark.term.name,
    bot: mark.bot || 0,
    mot: mark.midterm || 0,
    eot: mark.eot || 0,
    total: mark.total || 0,
    grade: mark.grade,
    lastUpdated: mark.updatedAt,
  }))
}

// Helper functions
function calculateStatistics(marks: any[]) {
  const validMarks = marks.filter((mark) => mark.total > 0)

  if (validMarks.length === 0) {
    return {
      totalAssessments: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
    }
  }

  const scores = validMarks.map((mark) => mark.total)
  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  const passCount = scores.filter((score) => score >= 50).length

  return {
    totalAssessments: validMarks.length,
    averageScore: average,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    passRate: Math.round((passCount / validMarks.length) * 100),
  }
}

function calculateStudentAverage(subjects: any[]) {
  const validSubjects = subjects.filter((s) => s.total > 0)
  return validSubjects.length > 0
    ? Math.round(validSubjects.reduce((sum, s) => sum + s.total, 0) / validSubjects.length)
    : 0
}
