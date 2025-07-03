"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Eye,
  Download,
  FileText,
  Users,
  CheckCircle,
  Clock,
  X,
  Check,
  Calendar,
  BookOpen,
  Filter,
  GraduationCap,
} from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
  class: {
    id: string
    name: string
  }
  term: {
    id: string
    name: string
  }
  academicYear: {
    id: string
    year: string
  }
  parent?: {
    name: string
    email: string
  }
  reportCards: ReportCard[]
  marks: Mark[]
}

interface Mark {
  id: string
  value: number
  examType: string
  subject: {
    id: string
    name: string
    code: string
  }
}

interface ReportCard {
  id: string
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
  approvedAt?: string
  createdAt: string
}

interface Class {
  id: string
  name: string
}

interface Term {
  id: string
  name: string
}

interface AcademicYear {
  id: string
  year: string
  isActive: boolean
}

export default function AdminStudentReportsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("active")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const [headteacherComment, setHeadteacherComment] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [selectedClass, selectedTerm, selectedAcademicYear, searchTerm])

  const fetchInitialData = async () => {
    try {
      const [classesResponse, termsResponse, academicYearsResponse] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/terms"),
        fetch("/api/academic-years"),
      ])

      const [classesData, termsData, academicYearsData] = await Promise.all([
        classesResponse.json(),
        termsResponse.json(),
        academicYearsResponse.json(),
      ])

      setClasses(classesData || [])
      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])

      // Set active academic year as default
      const activeYear = academicYearsData.find((year: AcademicYear) => year.isActive)
      if (activeYear) {
        setSelectedAcademicYear(activeYear.id)
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm !== "all") params.append("termId", selectedTerm)
      if (selectedAcademicYear !== "all") params.append("academicYearId", selectedAcademicYear)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/admin/students/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmAction = () => {
    if (confirmAction && selectedReport) {
      if (confirmAction === "approve") {
        handleApproveReport(selectedReport.id, true)
      } else if (confirmAction === "reject") {
        handleApproveReport(selectedReport.id, false)
      }
    }
    setIsConfirmDialogOpen(false)
    setConfirmAction(null)
  }

  const handleApproveReport = async (reportId: string, approve: boolean) => {
    try {
      if (approve) {
        // Update report with headteacher comment and approve
        const response = await fetch(`/api/report-cards/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headteacherComment,
            isApproved: true,
            approvedAt: new Date().toISOString(),
          }),
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: "Report card approved successfully",
          })
        } else {
          throw new Error("Failed to approve report card")
        }
      } else {
        // Reject report card - delete it completely
        const response = await fetch(`/api/report-cards/${reportId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: "Report card rejected and deleted successfully",
          })
        } else {
          throw new Error("Failed to reject report card")
        }
      }

      setIsApprovalDialogOpen(false)
      setHeadteacherComment("")
      setSelectedReport(null)
      fetchStudents()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process report card",
        variant: "destructive",
      })
    }
  }

  const handleDownloadReport = async (studentId: string, reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/download?studentId=${studentId}&reportId=${reportId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-card-${studentId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report card",
        variant: "destructive",
      })
    }
  }

  const getMarksByExamType = (marks: Mark[]) => {
    const examTypes = [...new Set(marks.map((m) => m.examType))]
    const subjects = [...new Set(marks.map((m) => m.subject.name))]

    return {
      examTypes,
      subjects,
      marksBySubjectAndExam: subjects.map((subject) => ({
        subject,
        marks: examTypes.map((examType) => {
          const mark = marks.find((m) => m.subject.name === subject && m.examType === examType)
          return { examType, value: mark?.value || 0 }
        }),
        total: marks.filter((m) => m.subject.name === subject).reduce((sum, m) => sum + m.value, 0),
      })),
    }
  }

  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))

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
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Card Management</h1>
          <p className="text-gray-600 mt-2">Review and approve student report cards</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Report Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce((acc, student) => acc + student.reportCards.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce(
                (acc, student) => acc + student.reportCards.filter((report) => report.isApproved).length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce(
                (acc, student) => acc + student.reportCards.filter((report) => !report.isApproved).length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    <div className="flex items-center space-x-2">
                      <span>{year.year}</span>
                      {year.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{filteredStudents.length} students found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Student Report Cards</CardTitle>
          <CardDescription>Review and approve student report cards submitted by teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Report Cards</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.class.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">{student.academicYear.year}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3 text-gray-500" />
                      <span className="text-sm">{student.term.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.parent ? (
                      <div>
                        <div className="font-medium">{student.parent.name}</div>
                        <div className="text-sm text-gray-500">{student.parent.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No parent assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {student.reportCards.length} report{student.reportCards.length !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.reportCards.length > 0 ? (
                      <div className="flex flex-col space-y-1">
                        {student.reportCards.map((report) => (
                          <Badge
                            key={report.id}
                            className={
                              report.isApproved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                            }
                          >
                            {report.isApproved ? "Approved" : "Pending Review"}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">No reports</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {student.reportCards.map((report) => (
                        <div key={report.id} className="flex space-x-1">
                          {!report.isApproved && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report)
                                  setConfirmAction("approve")
                                  setIsApprovalDialogOpen(true)
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report)
                                  setConfirmAction("reject")
                                  setIsConfirmDialogOpen(true)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(student.id, report.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve" ? "Approve Report Card" : "Reject Report Card"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "approve"
                ? "Are you sure you want to approve this report card? This action will mark it as approved and notify the relevant parties."
                : "Are you sure you want to reject this report card? This action will permanently delete the report card and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsConfirmDialogOpen(false)
                setConfirmAction(null)
                setSelectedReport(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              {confirmAction === "approve" ? "Yes, Approve" : "Yes, Reject & Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Report Card</DialogTitle>
            <DialogDescription>
              Review marks and add your headteacher comment to approve this report card
            </DialogDescription>
          </DialogHeader>
          {selectedReport && selectedStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} alt={selectedStudent.name} />
                  <AvatarFallback className="text-lg">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.class.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.academicYear.year} - {selectedStudent.term.name}
                  </p>
                </div>
              </div>

              {/* Marks Table */}
              {selectedStudent.marks && selectedStudent.marks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>Academic Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const { examTypes, subjects, marksBySubjectAndExam } = getMarksByExamType(selectedStudent.marks)
                      return (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-bold">Subject</TableHead>
                                {examTypes.map((examType) => (
                                  <TableHead key={examType} className="text-center font-bold">
                                    {examType}
                                  </TableHead>
                                ))}
                                <TableHead className="text-center font-bold">Total</TableHead>
                                <TableHead className="text-center font-bold">Grade</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {marksBySubjectAndExam.map((subjectData) => (
                                <TableRow key={subjectData.subject}>
                                  <TableCell className="font-medium">{subjectData.subject}</TableCell>
                                  {subjectData.marks.map((mark) => (
                                    <TableCell key={mark.examType} className="text-center">
                                      {mark.value > 0 ? mark.value : "-"}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-center font-bold">{subjectData.total}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant={
                                        subjectData.total >= 70
                                          ? "default"
                                          : subjectData.total >= 50
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {subjectData.total >= 80
                                        ? "A"
                                        : subjectData.total >= 70
                                          ? "B"
                                          : subjectData.total >= 60
                                            ? "C"
                                            : subjectData.total >= 50
                                              ? "D"
                                              : subjectData.total >= 40
                                                ? "E"
                                                : "F"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-gray-50">
                                <TableCell className="font-bold">TOTAL MARKS</TableCell>
                                {examTypes.map((examType) => (
                                  <TableCell key={examType} className="text-center font-bold">
                                    {selectedStudent.marks
                                      .filter((m) => m.examType === examType)
                                      .reduce((sum, m) => sum + m.value, 0)}
                                  </TableCell>
                                ))}
                                <TableCell className="text-center font-bold text-lg">
                                  {selectedStudent.marks.reduce((sum, m) => sum + m.value, 0)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="font-bold">
                                    {(() => {
                                      const total = selectedStudent.marks.reduce((sum, m) => sum + m.value, 0)
                                      const subjects = [...new Set(selectedStudent.marks.map((m) => m.subject.name))]
                                        .length
                                      const average = subjects > 0 ? total / subjects : 0
                                      return average >= 70 ? "I" : average >= 60 ? "II" : average >= 50 ? "III" : "IV"
                                    })()}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Personal Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Discipline</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.discipline}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cleanliness</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.cleanliness}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Class Work</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.classWorkPresentation}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">School Adherence</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.adherenceToSchool}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Co-curricular</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.coCurricularActivities}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Consideration</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.considerationToOthers}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Speaking English</Label>
                      <Badge variant="outline" className="mt-1">
                        {selectedReport.speakingEnglish}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedReport.classTeacherComment && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Class Teacher Comment</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{selectedReport.classTeacherComment}</p>
                </div>
              )}

              <div>
                <Label htmlFor="headteacherComment">Headteacher Comment</Label>
                <Textarea
                  id="headteacherComment"
                  value={headteacherComment}
                  onChange={(e) => setHeadteacherComment(e.target.value)}
                  placeholder="Enter your comment as headteacher..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsApprovalDialogOpen(false)
                    setHeadteacherComment("")
                    setSelectedReport(null)
                    setConfirmAction(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsApprovalDialogOpen(false)
                    setIsConfirmDialogOpen(true)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve Report Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Report Details</DialogTitle>
            <DialogDescription>View detailed report information for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} alt={selectedStudent.name} />
                  <AvatarFallback className="text-lg">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.class.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.academicYear.year} - {selectedStudent.term.name}
                  </p>
                  {selectedStudent.parent && (
                    <p className="text-sm text-gray-500">
                      Parent: {selectedStudent.parent.name} ({selectedStudent.parent.email})
                    </p>
                  )}
                </div>
              </div>

              {/* Marks Display */}
              {selectedStudent.marks && selectedStudent.marks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>Academic Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const { examTypes, subjects, marksBySubjectAndExam } = getMarksByExamType(selectedStudent.marks)
                      return (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-bold">Subject</TableHead>
                                {examTypes.map((examType) => (
                                  <TableHead key={examType} className="text-center font-bold">
                                    {examType}
                                  </TableHead>
                                ))}
                                <TableHead className="text-center font-bold">Total</TableHead>
                                <TableHead className="text-center font-bold">Grade</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {marksBySubjectAndExam.map((subjectData) => (
                                <TableRow key={subjectData.subject}>
                                  <TableCell className="font-medium">{subjectData.subject}</TableCell>
                                  {subjectData.marks.map((mark) => (
                                    <TableCell key={mark.examType} className="text-center">
                                      {mark.value > 0 ? mark.value : "-"}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-center font-bold">{subjectData.total}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant={
                                        subjectData.total >= 70
                                          ? "default"
                                          : subjectData.total >= 50
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {subjectData.total >= 80
                                        ? "A"
                                        : subjectData.total >= 70
                                          ? "B"
                                          : subjectData.total >= 60
                                            ? "C"
                                            : subjectData.total >= 50
                                              ? "D"
                                              : subjectData.total >= 40
                                                ? "E"
                                                : "F"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {selectedStudent.reportCards.map((report, index) => (
                <Card key={report.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Report Card #{index + 1}</span>
                      <Badge
                        className={report.isApproved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {report.isApproved ? "Approved" : "Pending Review"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                      {report.approvedAt && (
                        <span> | Approved: {new Date(report.approvedAt).toLocaleDateString()}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Discipline</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.discipline}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Cleanliness</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.cleanliness}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Class Work</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.classWorkPresentation}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">School Adherence</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.adherenceToSchool}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Co-curricular</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.coCurricularActivities}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Consideration</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.considerationToOthers}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Speaking English</Label>
                        <Badge variant="outline" className="mt-1">
                          {report.speakingEnglish}
                        </Badge>
                      </div>
                    </div>

                    {report.classTeacherComment && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-600">Class Teacher Comment</Label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{report.classTeacherComment}</p>
                      </div>
                    )}

                    {report.headteacherComment && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Headteacher Comment</Label>
                        <p className="mt-1 p-3 bg-blue-50 rounded-lg text-sm">{report.headteacherComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
