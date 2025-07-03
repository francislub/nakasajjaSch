"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Calendar, Eye, Printer } from "lucide-react"
import { generateReportCardHTML } from "@/lib/report-card-generator"
import { useToast } from "@/hooks/use-toast"

interface Mark {
  subject: {
    name: string
    code: string
    category: string
  }
  score: number
  totalMarks: number
  grade: string
  homework: number
  bot: number
  midterm: number
  eot: number
  remarks?: string
}

interface ReportCard {
  id: string
  term: {
    id: string
    name: string
  }
  academicYear: {
    id: string
    year: string
  }
  totalMarks: number
  averageScore: number
  overallGrade: string
  position: number
  totalStudents: number
  teacherComment: string
  headteacherComment: string
  status: string
  createdAt: string
  marks: Mark[]
  discipline: string
  cleanliness: string
  classWorkPresentation: string
  adherenceToSchool: string
  coCurricularActivities: string
  considerationToOthers: string
  speakingEnglish: string
  classTeacherComment?: string
  headteacherComment?: string
  isApproved: boolean
  parentAccessEnabled: boolean
  gradingSystem?: Array<{
    id: string
    grade: string
    minMark: number
    maxMark: number
    comment?: string
  }>
}

interface Child {
  id: string
  name: string
  dateOfBirth?: string
  photo?: string
  class: {
    id: string
    name: string
  }
  reportCards: ReportCard[]
}

export default function ParentReportsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [gradingSystem, setGradingSystem] = useState<
    Array<{
      id: string
      grade: string
      minMark: number
      maxMark: number
      comment?: string
    }>
  >([])
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
    fetchGradingSystem()
  }, [selectedChild])

  const fetchGradingSystem = async () => {
    try {
      const response = await fetch("/api/grading-system")
      if (response.ok) {
        const data = await response.json()
        setGradingSystem(data || [])
      }
    } catch (error) {
      console.error("Error fetching grading system:", error)
    }
  }

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedChild) params.append("studentId", selectedChild)

      const response = await fetch(`/api/parent/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children)
        if (data.children.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReportCard = (reportCard: ReportCard, child: Child) => {
    try {
      // Transform marks data to match the expected format
      const allSubjectsData = reportCard.marks.map((mark) => ({
        name: mark.subject.name,
        code: mark.subject.code,
        category: mark.subject.category,
        bot: mark.bot || 0,
        botGrade: calculateGrade(mark.bot || 0),
        midterm: mark.midterm || 0,
        midtermGrade: calculateGrade(mark.midterm || 0),
        eot: mark.eot || 0,
        eotGrade: calculateGrade(mark.eot || 0),
        total: mark.score || 0,
        grade: mark.grade,
        remarks: mark.remarks || "",
        teacherInitials: "", // This would come from the teacher data
      }))

      // Calculate totals
      const totals = {
        botAggregates: allSubjectsData.reduce((sum, subject) => {
          const grade = getGradePoints(subject.botGrade)
          return sum + grade
        }, 0),
        midtermAggregates: allSubjectsData.reduce((sum, subject) => {
          const grade = getGradePoints(subject.midtermGrade)
          return sum + grade
        }, 0),
        eotAggregates: allSubjectsData.reduce((sum, subject) => {
          const grade = getGradePoints(subject.eotGrade)
          return sum + grade
        }, 0),
      }

      // Calculate division based on aggregates
      const division = calculateDivision(totals.eotAggregates, allSubjectsData.length)

      const htmlContent = generateReportCardHTML({
        reportCard,
        student: {
          ...child,
          term: reportCard.term,
          academicYear: reportCard.academicYear,
          marks: reportCard.marks,
        },
        gradingSystem,
        division,
        aggregate: totals.eotAggregates,
        generalSubjectsData: allSubjectsData,
        allSubjectsData,
        totals,
        term: reportCard.term,
        academicYear: reportCard.academicYear,
      })

      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
      }
    } catch (error) {
      console.error("Error generating report card:", error)
      toast({
        title: "Error",
        description: "Failed to generate report card. Please try again.",
        variant: "destructive",
      })
    }
  }

  const calculateGrade = (score: number): string => {
    if (!gradingSystem.length) return ""

    for (const grade of gradingSystem) {
      if (score >= grade.minMark && score <= grade.maxMark) {
        return grade.grade
      }
    }
    return "F9"
  }

  const getGradePoints = (grade: string): number => {
    const gradePoints: { [key: string]: number } = {
      D1: 1,
      D2: 2,
      C3: 3,
      C4: 4,
      C5: 5,
      C6: 6,
      P7: 7,
      P8: 8,
      F9: 9,
    }
    return gradePoints[grade] || 9
  }

  const calculateDivision = (aggregates: number, subjectCount: number): string => {
    if (subjectCount === 0) return "INCOMPLETE"

    const average = aggregates / subjectCount

    if (average <= 1.5) return "DIVISION I"
    if (average <= 2.5) return "DIVISION II"
    if (average <= 3.5) return "DIVISION III"
    if (average <= 4.0) return "DIVISION IV"
    return "INCOMPLETE"
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "C":
        return "bg-yellow-100 text-yellow-800"
      case "D":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-red-100 text-red-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const selectedChildData = children.find((child) => child.id === selectedChild)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-600 mt-2">View your child's academic report cards</p>
      </div>

      {/* Child Selection */}
      <Select value={selectedChild} onValueChange={setSelectedChild}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id}>
              {child.name} - {child.class.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedChildData && (
        <div className="space-y-6">
          {selectedChildData.reportCards.length > 0 ? (
            <div className="grid gap-6">
              {selectedChildData.reportCards
                .filter((reportCard) => reportCard.parentAccessEnabled)
                .map((reportCard) => (
                  <Card key={reportCard.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5" />
                            <span>{reportCard.term.name} Report Card</span>
                          </CardTitle>
                          <CardDescription className="flex items-center space-x-4 mt-2">
                            <span>Academic Year: {reportCard.academicYear.year}</span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(reportCard.createdAt).toLocaleDateString()}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(reportCard.status)}>
                            {reportCard.isApproved ? "APPROVED" : "PENDING"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReportCard(reportCard, selectedChildData)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReportCard(reportCard, selectedChildData)}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{reportCard.averageScore}%</div>
                          <div className="text-sm text-gray-600">Average Score</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">
                            <Badge className={getGradeColor(reportCard.overallGrade)}>{reportCard.overallGrade}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">Overall Grade</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{reportCard.position}</div>
                          <div className="text-sm text-gray-600">Position</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600">{reportCard.totalStudents}</div>
                          <div className="text-sm text-gray-600">Total Students</div>
                        </div>
                      </div>

                      {/* Subject Marks */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">Subject Performance</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-center">B.O.T</TableHead>
                              <TableHead className="text-center">Mid Term</TableHead>
                              <TableHead className="text-center">E.O.T</TableHead>
                              <TableHead className="text-center">Grade</TableHead>
                              <TableHead>Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportCard.marks.map((mark, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{mark.subject.name}</TableCell>
                                <TableCell className="text-center">{mark.bot || "-"}</TableCell>
                                <TableCell className="text-center">{mark.midterm || "-"}</TableCell>
                                <TableCell className="text-center">{mark.eot || "-"}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                                </TableCell>
                                <TableCell>{mark.remarks || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Personal Assessment */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">Personal Assessment</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex justify-between">
                            <span>Discipline:</span>
                            <Badge className={getGradeColor(reportCard.discipline)}>{reportCard.discipline}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Cleanliness:</span>
                            <Badge className={getGradeColor(reportCard.cleanliness)}>{reportCard.cleanliness}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Class Work:</span>
                            <Badge className={getGradeColor(reportCard.classWorkPresentation)}>
                              {reportCard.classWorkPresentation}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Adherence:</span>
                            <Badge className={getGradeColor(reportCard.adherenceToSchool)}>
                              {reportCard.adherenceToSchool}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Co-curricular:</span>
                            <Badge className={getGradeColor(reportCard.coCurricularActivities)}>
                              {reportCard.coCurricularActivities}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Speaking English:</span>
                            <Badge className={getGradeColor(reportCard.speakingEnglish)}>
                              {reportCard.speakingEnglish}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportCard.classTeacherComment && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-semibold text-blue-800 mb-2">Class Teacher's Comment</h5>
                            <p className="text-sm text-blue-700">{reportCard.classTeacherComment}</p>
                          </div>
                        )}
                        {reportCard.headteacherComment && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h5 className="font-semibold text-green-800 mb-2">Head Teacher's Comment</h5>
                            <p className="text-sm text-green-700">{reportCard.headteacherComment}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {selectedChildData.reportCards.filter((rc) => rc.parentAccessEnabled).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Report Cards Available</h3>
                    <p className="text-gray-500">
                      Report cards will appear here once they are approved and released by the school administration.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Report Cards Available</h3>
                <p className="text-gray-500">
                  Report cards will appear here once they are generated and approved by the school.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
