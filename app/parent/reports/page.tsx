"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Calendar } from "lucide-react"

interface Mark {
  subject: {
    name: string
  }
  score: number
  totalMarks: number
  grade: string
}

interface ReportCard {
  id: string
  term: {
    name: string
  }
  academicYear: {
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
}

interface Child {
  id: string
  name: string
  class: {
    name: string
  }
  reportCards: ReportCard[]
}

export default function ParentReportsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [selectedChild])

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
              {selectedChildData.reportCards.map((reportCard) => (
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
                        <Badge className={getStatusColor(reportCard.status)}>{reportCard.status}</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
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
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Percentage</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportCard.marks.map((mark, index) => {
                            const percentage = Math.round((mark.score / mark.totalMarks) * 100)
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{mark.subject.name}</TableCell>
                                <TableCell className="text-center">{mark.score}</TableCell>
                                <TableCell className="text-center">{mark.totalMarks}</TableCell>
                                <TableCell className="text-center">{percentage}%</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Comments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportCard.teacherComment && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-2">Class Teacher's Comment</h5>
                          <p className="text-sm text-blue-700">{reportCard.teacherComment}</p>
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
