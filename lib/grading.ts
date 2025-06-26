// Utility function for consistent grading across the application
export function getGradeFromSystem(score: number, gradingSystem: any[]): string {
  if (!gradingSystem || !Array.isArray(gradingSystem) || gradingSystem.length === 0) {
    // Fallback grading if no system found
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
  }

  // Sort grades by minMark in descending order to find the highest applicable grade
  const sortedGrades = [...gradingSystem].sort((a, b) => b.minMark - a.minMark)

  // Find the appropriate grade
  for (const grade of sortedGrades) {
    if (score >= grade.minMark && score <= grade.maxMark) {
      return grade.grade
    }
  }

  // If no exact match, find the closest grade
  for (const grade of sortedGrades) {
    if (score >= grade.minMark) {
      return grade.grade
    }
  }

  // Return the lowest grade if no match found
  return sortedGrades[sortedGrades.length - 1]?.grade || "F"
}

// Get grade color for UI display
export function getGradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case "A":
      return "bg-green-100 text-green-800 border-green-200"
    case "B":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "C":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "D":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "F":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

// Calculate grade from percentage score
export function calculateGrade(score: number, gradingSystem?: any[]): string {
  return getGradeFromSystem(score, gradingSystem || [])
}

// Get all available grades from grading system
export function getAvailableGrades(
  gradingSystem: any[],
): Array<{ value: string; label: string; minScore: number; maxScore: number }> {
  if (!gradingSystem || !Array.isArray(gradingSystem) || gradingSystem.length === 0) {
    return [
      { value: "A", label: "A - Excellent", minScore: 80, maxScore: 100 },
      { value: "B", label: "B - Good", minScore: 70, maxScore: 79 },
      { value: "C", label: "C - Fair", minScore: 60, maxScore: 69 },
      { value: "D", label: "D - Pass", minScore: 50, maxScore: 59 },
      { value: "F", label: "F - Fail", minScore: 0, maxScore: 49 },
    ]
  }

  return gradingSystem
    .map((grade) => ({
      value: grade.grade,
      label: `${grade.grade} - ${grade.comment}`,
      minScore: grade.minMark,
      maxScore: grade.maxMark,
    }))
    .sort((a, b) => b.minScore - a.minScore)
}

// Validate if a grade is valid according to the grading system
export function isValidGrade(grade: string, gradingSystem?: any[]): boolean {
  const availableGrades = getAvailableGrades(gradingSystem || [])
  return availableGrades.some((g) => g.value === grade.toUpperCase())
}

// Get grade description
export function getGradeDescription(grade: string, gradingSystem?: any[]): string {
  const availableGrades = getAvailableGrades(gradingSystem || [])
  const gradeInfo = availableGrades.find((g) => g.value === grade.toUpperCase())
  return gradeInfo?.label || grade
}

// Get grade comment from grading system
export function getGradeComment(grade: string, gradingSystem?: any[]): string {
  if (!gradingSystem || !Array.isArray(gradingSystem)) {
    return grade
  }

  const gradeEntry = gradingSystem.find((g) => g.grade === grade.toUpperCase())
  return gradeEntry?.comment || grade
}

// Validate grading system completeness
export function validateGradingSystem(gradingSystem: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!gradingSystem || gradingSystem.length === 0) {
    errors.push("Grading system is empty")
    return { isValid: false, errors }
  }

  // Sort by minMark
  const sorted = [...gradingSystem].sort((a, b) => a.minMark - b.minMark)

  // Check for gaps and overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    if (current.maxMark >= next.minMark) {
      errors.push(`Overlap between grades ${current.grade} and ${next.grade}`)
    }

    if (current.maxMark + 1 < next.minMark) {
      errors.push(`Gap between grades ${current.grade} (${current.maxMark}) and ${next.grade} (${next.minMark})`)
    }
  }

  // Check if system covers 0-100 range
  const lowestMin = Math.min(...gradingSystem.map((g) => g.minMark))
  const highestMax = Math.max(...gradingSystem.map((g) => g.maxMark))

  if (lowestMin > 0) {
    errors.push(`Grading system doesn't cover scores below ${lowestMin}`)
  }

  if (highestMax < 100) {
    errors.push(`Grading system doesn't cover scores above ${highestMax}`)
  }

  return { isValid: errors.length === 0, errors }
}

// Fetch grading system from API
export async function fetchGradingSystem(): Promise<any[]> {
  try {
    const response = await fetch("/api/grading-system")
    if (!response.ok) {
      throw new Error("Failed to fetch grading system")
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching grading system:", error)
    return []
  }
}
