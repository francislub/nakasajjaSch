import { prisma } from "@/lib/prisma"

// Division ranges based on aggregate scores
export const DIVISION_RANGES = {
  DIVISION_1: { min: 4, max: 12, label: "Division I" },
  DIVISION_2: { min: 13, max: 24, label: "Division II" },
  DIVISION_3: { min: 25, max: 32, label: "Division III" },
  DIVISION_4: { min: 33, max: 35, label: "Division IV" },
  UNGRADED: { min: 36, max: 36, label: "U" },
  FAIL: { min: 37, max: Number.POSITIVE_INFINITY, label: "X" },
} as const

export type DivisionType = "DIVISION_1" | "DIVISION_2" | "DIVISION_3" | "DIVISION_4" | "UNGRADED" | "FAIL"

export interface GradeValue {
  grade: string
  value: number
  minScore: number
  maxScore: number
}

export interface DivisionResult {
  division: DivisionType
  aggregate: number
  label: string
  color: string
  subjects: {
    subjectId: string
    subjectName: string
    grade: string
    gradeValue: number
  }[]
}

/**
 * Get grade values from the database grading system
 */
export async function getGradeValues(): Promise<GradeValue[]> {
  try {
    const gradingSystem = await prisma.gradingSystem.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })

    if (!gradingSystem || !gradingSystem.grades) {
      // Fallback to default grading system
      return [
        { grade: "A", value: 1, minScore: 80, maxScore: 100 },
        { grade: "B", value: 2, minScore: 70, maxScore: 79 },
        { grade: "C", value: 3, minScore: 60, maxScore: 69 },
        { grade: "D", value: 4, minScore: 50, maxScore: 59 },
        { grade: "E", value: 5, minScore: 40, maxScore: 49 },
        { grade: "F", value: 9, minScore: 0, maxScore: 39 },
      ]
    }

    const grades = typeof gradingSystem.grades === "string" ? JSON.parse(gradingSystem.grades) : gradingSystem.grades

    return grades.map((grade: any, index: number) => ({
      grade: grade.grade,
      value: grade.value || index + 1,
      minScore: grade.minScore || 0,
      maxScore: grade.maxScore || 100,
    }))
  } catch (error) {
    console.error("Error fetching grade values:", error)
    // Return default values on error
    return [
      { grade: "A", value: 1, minScore: 80, maxScore: 100 },
      // { grade: "B", value: 2, minScore: 70, maxScore: 79 },
      // { grade: "C", value: 3, minScore: 60, maxScore: 69 },
      // { grade: "D", value: 4, minScore: 50, maxScore: 59 },
      // { grade: "E", value: 5, minScore: 40, maxScore: 49 },
      // { grade: "F", value: 9, minScore: 0, maxScore: 39 },
    ]
  }
}

/**
 * Convert a percentage score to a grade using the grading system
 */
export function getGradeFromScore(score: number, gradeValues: GradeValue[]): string {
  for (const gradeValue of gradeValues) {
    if (score >= gradeValue.minScore && score <= gradeValue.maxScore) {
      return gradeValue.grade
    }
  }
  return "F" // Default to F if no grade matches
}

/**
 * Get the numeric value for a grade
 */
export function getGradeValue(grade: string, gradeValues: GradeValue[]): number {
  const gradeValue = gradeValues.find((gv) => gv.grade === grade)
  return gradeValue?.value || 9 // Default to 9 (F equivalent) if grade not found
}

/**
 * Calculate division based on aggregate score
 */
export function calculateDivision(aggregate: number): DivisionType {
  if (aggregate >= DIVISION_RANGES.DIVISION_1.min && aggregate <= DIVISION_RANGES.DIVISION_1.max) {
    return "DIVISION_1"
  }
  if (aggregate >= DIVISION_RANGES.DIVISION_2.min && aggregate <= DIVISION_RANGES.DIVISION_2.max) {
    return "DIVISION_2"
  }
  if (aggregate >= DIVISION_RANGES.DIVISION_3.min && aggregate <= DIVISION_RANGES.DIVISION_3.max) {
    return "DIVISION_3"
  }
  if (aggregate >= DIVISION_RANGES.DIVISION_4.min && aggregate <= DIVISION_RANGES.DIVISION_4.max) {
    return "DIVISION_4"
  }
  if (aggregate === DIVISION_RANGES.UNGRADED.min) {
    return "UNGRADED"
  }
  return "FAIL"
}

/**
 * Get division color for UI display
 */
export function getDivisionColor(division: DivisionType): string {
  switch (division) {
    case "DIVISION_1":
      return "bg-green-100 text-green-800 border-green-200"
    case "DIVISION_2":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "DIVISION_3":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "DIVISION_4":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "UNGRADED":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "FAIL":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

/**
 * Calculate student division for a specific exam type
 * Only considers the top 4 GENERAL subjects with the best grades
 */
export async function calculateStudentDivision(
  studentId: string,
  classId: string,
  termId: string,
  examType: "BOT" | "MID" | "END",
  academicYearId?: string,
): Promise<DivisionResult | null> {
  try {
    const gradeValues = await getGradeValues()

    // Get current academic year if not provided
    let currentAcademicYearId = academicYearId
    if (!currentAcademicYearId) {
      const currentAcademicYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true },
      })
      currentAcademicYearId = currentAcademicYear?.id
    }

    // Get student's marks for the specified exam type, term, and academic year
    // Only include GENERAL subjects for division calculation
    const marks = await prisma.mark.findMany({
      where: {
        studentId,
        termId,
        examType,
        academicYearId: currentAcademicYearId,
        subject: {
          classId: classId,
          category: "GENERAL", // Only consider GENERAL subjects
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
      },
      orderBy: {
        score: "desc", // Order by score to get best marks first
      },
    })

    if (marks.length === 0) {
      return null
    }

    // Group marks by subject and calculate average for each subject
    const subjectMarks = marks.reduce(
      (acc, mark) => {
        const subjectId = mark.subject.id
        if (!acc[subjectId]) {
          acc[subjectId] = {
            subject: mark.subject,
            scores: [],
            totalScore: 0,
            count: 0,
          }
        }
        acc[subjectId].scores.push(mark.score || 0)
        acc[subjectId].totalScore += mark.score || 0
        acc[subjectId].count += 1
        return acc
      },
      {} as Record<
        string,
        {
          subject: { id: string; name: string; code: string | null; category: string }
          scores: number[]
          totalScore: number
          count: number
        }
      >,
    )

    // Calculate average score for each subject and convert to grades
    const subjectGrades = Object.values(subjectMarks).map((subjectData) => {
      const averageScore = subjectData.totalScore / subjectData.count
      const grade = getGradeFromScore(averageScore, gradeValues)
      const gradeValue = getGradeValue(grade, gradeValues)

      return {
        subjectId: subjectData.subject.id,
        subjectName: subjectData.subject.name,
        averageScore,
        grade,
        gradeValue,
      }
    })

    // Sort by grade value (best grades first) and take top 4 subjects
    const top4Subjects = subjectGrades.sort((a, b) => a.gradeValue - b.gradeValue).slice(0, 4)

    // If we don't have 4 GENERAL subjects, we can't calculate division
    if (top4Subjects.length < 4) {
      return null
    }

    // Calculate aggregate (sum of grade values for top 4 GENERAL subjects)
    const aggregate = top4Subjects.reduce((sum, subject) => sum + subject.gradeValue, 0)

    // Determine division
    const division = calculateDivision(aggregate)

    return {
      division,
      aggregate,
      label: DIVISION_RANGES[division].label,
      color: getDivisionColor(division),
      subjects: top4Subjects.map((subject) => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        grade: subject.grade,
        gradeValue: subject.gradeValue,
      })),
    }
  } catch (error) {
    console.error("Error calculating student division:", error)
    return null
  }
}

/**
 * Calculate divisions for multiple students
 */
export async function calculateClassDivisions(
  classId: string,
  termId: string,
  examType: "BOT" | "MID" | "END",
  academicYearId?: string,
): Promise<Record<string, DivisionResult | null>> {
  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: { id: true },
    })

    const divisions: Record<string, DivisionResult | null> = {}

    // Calculate division for each student
    for (const student of students) {
      divisions[student.id] = await calculateStudentDivision(student.id, classId, termId, examType, academicYearId)
    }

    return divisions
  } catch (error) {
    console.error("Error calculating class divisions:", error)
    return {}
  }
}

/**
 * Get division statistics for a class
 */
export async function getDivisionStatistics(
  classId: string,
  termId: string,
  examType: "BOT" | "MID" | "END",
  academicYearId?: string,
): Promise<{
  totalStudents: number
  divisions: Record<DivisionType, number>
  passRate: number
}> {
  try {
    const classDivisions = await calculateClassDivisions(classId, termId, examType, academicYearId)
    const divisionCounts: Record<DivisionType, number> = {
      DIVISION_1: 0,
      DIVISION_2: 0,
      DIVISION_3: 0,
      DIVISION_4: 0,
      UNGRADED: 0,
      FAIL: 0,
    }

    let totalStudents = 0
    let passedStudents = 0

    Object.values(classDivisions).forEach((division) => {
      if (division) {
        totalStudents++
        divisionCounts[division.division]++
        if (division.division !== "FAIL") {
          passedStudents++
        }
      }
    })

    const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0

    return {
      totalStudents,
      divisions: divisionCounts,
      passRate: Math.round(passRate * 100) / 100,
    }
  } catch (error) {
    console.error("Error getting division statistics:", error)
    return {
      totalStudents: 0,
      divisions: {
        DIVISION_1: 0,
        DIVISION_2: 0,
        DIVISION_3: 0,
        DIVISION_4: 0,
        UNGRADED: 0,
        FAIL: 0,
      },
      passRate: 0,
    }
  }
}
