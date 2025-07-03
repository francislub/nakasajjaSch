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
import { ScrollArea } from "@/components/ui/scroll-area"
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
  TrendingUp,
  Award,
  Target,
  Star,
  Trophy,
  BarChart3,
  Edit,
  Plus,
} from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
  registrationNumber?: string
  class: {
    id: string
    name: string
    subjects: {
      id: string
      name: string
      code: string
      category: "GENERAL" | "SUBSIDIARY"
    }[]
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
    id: string
    name: string
    email: string
  }
  reportCards: ReportCard[]
  marks: Mark[]
  divisions: {
    BOT: DivisionResult | null
    MID: DivisionResult | null
    END: DivisionResult | null
  }
}

interface Mark {
  id: string
  bot?: number
  midterm?: number
  eot?: number
  total?: number
  grade?: string
  subject: {
    id: string
    name: string
    code?: string
    category: "GENERAL" | "SUBSIDIARY"
  }
  term: {
    id: string
    name: string
  }
  student: {
    id: string
    name: string
    photo?: string
    registrationNumber?: string
    class: {
      id: string
      name: string
    }
  }
  createdBy?: {
    id: string
    name: string
    role: string
  }
}

interface DivisionResult {
  division: "DIVISION_1" | "DIVISION_2" | "DIVISION_3" | "DIVISION_4" | "UNGRADED" | "FAIL"
  aggregate: number
  label: string
  color: string
  subjects: {
    subjectId: string
    subjectName: string
    grade: string
    gradeValue: number
    score?: number
  }[]
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
  subjects: {
    id: string
    name: string
    code: string
    category: "GENERAL" | "SUBSIDIARY"
  }[]
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

interface SubjectData {
  name: string
  category: string
  homework: number
  bot: number
  midterm: number
  eot: number
  total: number
  grade: string
  teacherInitials: string
}

interface StudentReportDetails {
  student: Student
  subjects: SubjectData[]
  assessmentTypes: string[]
  division: string
  overallAggregate: number
  validGeneralSubjects: number
  assessmentTotals: { [assessmentType: string]: number }
  grandTotal: number
  gradingSystem: any[]
  divisions: {
    BOT: DivisionResult | null
    MID: DivisionResult | null
    END: DivisionResult | null
  }
}

// Behavioral Assessment Grades
const BEHAVIORAL_GRADES = [
  { value: "A", label: "A - Very Good", description: "Very Good" },
  { value: "B", label: "B - Good", description: "Good" },
  { value: "C", label: "C - Fair", description: "Fair" },
  { value: "D", label: "D - Needs Improvement", description: "Needs Improvement" },
]

const getDivisionColor = (division: string): string => {
  switch (division) {
    case "DIVISION_1":
    case "DIVISION I":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "DIVISION_2":
    case "DIVISION II":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "DIVISION_3":
    case "DIVISION III":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "DIVISION_4":
    case "DIVISION IV":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "UNGRADED":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "FAIL":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getBehavioralGradeDisplay = (grade: string): string => {
  const gradeInfo = BEHAVIORAL_GRADES.find((g) => g.value === grade)
  return gradeInfo ? gradeInfo.description : grade || "Not Set"
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
  const [studentReportDetails, setStudentReportDetails] = useState<StudentReportDetails | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const [headteacherComment, setHeadteacherComment] = useState("")
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
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

  const fetchStudentReportDetails = async (studentId: string) => {
    setIsLoadingDetails(true)
    try {
      const params = new URLSearchParams()
      if (selectedTerm !== "all") params.append("termId", selectedTerm)
      if (selectedAcademicYear !== "all") params.append("academicYearId", selectedAcademicYear)

      const response = await fetch(`/api/admin/students/${studentId}/report-details?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudentReportDetails(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch student report details")
      }
    } catch (error) {
      console.error("Error fetching student report details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch student report details",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student)
    setIsViewDialogOpen(true)
    await fetchStudentReportDetails(student.id)
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

  const getGradeBadgeVariant = (grade: string) => {
    const gradeUpper = grade.toUpperCase()
    if (gradeUpper.includes("D1") || gradeUpper.includes("D2")) return "default"
    if (
      gradeUpper.includes("C3") ||
      gradeUpper.includes("C4") ||
      gradeUpper.includes("C5") ||
      gradeUpper.includes("C6")
    )
      return "secondary"
    if (gradeUpper.includes("P7") || gradeUpper.includes("P8")) return "outline"
    return "destructive"
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
                      <Button variant="outline" size="sm" onClick={() => handleViewStudent(student)}>
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
          {selectedReport && selectedStudent && studentReportDetails && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
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
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.class.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.academicYear.year} - {selectedStudent.term.name}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDivisionColor(studentReportDetails.division)}`}
                  >
                    <Award className="w-4 h-4 mr-1" />
                    {studentReportDetails.division}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Aggregate: {studentReportDetails.overallAggregate}</p>
                </div>
              </div>

              {/* Academic Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-green-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Total Marks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-800">{studentReportDetails.grandTotal}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-blue-700">
                      <Target className="w-4 h-4 mr-2" />
                      Subjects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-800">{studentReportDetails.subjects.length}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-purple-700">
                      <Award className="w-4 h-4 mr-2" />
                      Average
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-800">
                      {studentReportDetails.subjects.length > 0
                        ? Math.round(studentReportDetails.grandTotal / studentReportDetails.subjects.length)
                        : 0}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Debug Info */}
              {studentReportDetails.subjects.length === 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <p className="text-yellow-800">
                      No marks found for this student in the selected term and academic year. Please ensure marks have
                      been entered for this student.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Marks Table */}
              {studentReportDetails.subjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5" />
                      <span>Academic Performance Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-bold">Subject</TableHead>
                            {studentReportDetails.assessmentTypes.map((assessmentType) => (
                              <TableHead key={assessmentType} className="text-center font-bold">
                                {assessmentType.toUpperCase()}
                              </TableHead>
                            ))}
                            <TableHead className="text-center font-bold">Total</TableHead>
                            <TableHead className="text-center font-bold">Grade</TableHead>
                            <TableHead className="text-center font-bold">Teacher</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentReportDetails.subjects.map((subject) => (
                            <TableRow key={subject.name} className={subject.category === "GENERAL" ? "bg-blue-50" : ""}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <span>{subject.name}</span>
                                  {subject.category === "GENERAL" && (
                                    <Badge variant="secondary" className="text-xs">
                                      Core
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              {studentReportDetails.assessmentTypes.map((assessmentType) => (
                                <TableCell key={assessmentType} className="text-center">
                                  {subject[assessmentType as keyof SubjectData] > 0
                                    ? subject[assessmentType as keyof SubjectData]
                                    : "-"}
                                </TableCell>
                              ))}
                              <TableCell className="text-center font-bold">{subject.total}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={getGradeBadgeVariant(subject.grade)}>{subject.grade}</Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm text-gray-600">
                                {subject.teacherInitials}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Totals Row */}
                          <TableRow className="bg-gray-100 font-bold">
                            <TableCell className="font-bold">TOTALS</TableCell>
                            {studentReportDetails.assessmentTypes.map((assessmentType) => (
                              <TableCell key={assessmentType} className="text-center font-bold">
                                {studentReportDetails.assessmentTotals[assessmentType]}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-bold text-lg">
                              {studentReportDetails.grandTotal}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-bold">
                                {studentReportDetails.division}
                              </Badge>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
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
          {isLoadingDetails && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading report details...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span>Comprehensive Student Profile</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete academic performance and behavioral assessment overview
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh] pr-4">
            {selectedStudent && (
              <div className="space-y-8 py-4">
                {/* Student Header */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} alt={selectedStudent.name} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {selectedStudent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900">{selectedStudent.name}</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Class</Label>
                          <p className="text-lg font-semibold text-gray-900">{selectedStudent.class.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Gender</Label>
                          <p className="text-lg font-semibold text-gray-900">{selectedStudent.gender}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Student ID</Label>
                          <p className="text-lg font-semibold text-gray-900">ID: {selectedStudent.id.slice(-6)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Academic Year</Label>
                          <p className="text-lg font-semibold text-gray-900">
                            {academicYears.find((year) => year.id === selectedAcademicYear)?.year}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Performance - Divisions */}
                {studentReportDetails && studentReportDetails.divisions && (
                  <Card className="border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <Trophy className="w-6 h-6 text-blue-600" />
                        <span>Academic Performance Analysis</span>
                      </CardTitle>
                      <CardDescription>
                        Division-based performance across all exam types using top 4 general subjects only
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {["BOT", "MID", "END"].map((examType) => {
                          // Use actual division data from API response
                          const division =
                            studentReportDetails.divisions?.[examType as keyof typeof studentReportDetails.divisions] ||
                            null

                          return (
                            <Card key={examType} className="border border-gray-200 hover:shadow-lg transition-shadow">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                  <BarChart3 className="w-5 h-5 text-blue-600" />
                                  <span>{examType}</span>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  {examType === "BOT" && "Beginning of Term"}
                                  {examType === "MID" && "Mid Term"}
                                  {examType === "END" && "End of Term"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                {division ? (
                                  <div className="space-y-4">
                                    <div
                                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${division.color || getDivisionColor(division.label)}`}
                                    >
                                      <Award className="w-4 h-4 mr-2" />
                                      {division.label}
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-600">Aggregate Score</span>
                                        <span className="font-bold text-lg">{division.aggregate}</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">
                                          Top 4 General Subjects:
                                        </p>
                                        <div className="space-y-2">
                                          {division.subjects &&
                                            division.subjects.map((subject, idx) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                              >
                                                <span className="text-sm font-medium">{subject.subjectName}</span>
                                                <div className="flex items-center space-x-2">
                                                  <Badge
                                                    variant={getGradeBadgeVariant(subject.grade)}
                                                    className="text-xs"
                                                  >
                                                    {subject.grade}
                                                  </Badge>
                                                  <span className="text-xs text-gray-500">({subject.gradeValue})</span>
                                                  {subject.score && (
                                                    <span className="text-xs text-blue-600">{subject.score}%</span>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <Badge variant="outline" className="text-gray-500">
                                      No Data
                                    </Badge>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Marks Summary */}
                {studentReportDetails && studentReportDetails.subjects.length > 0 && (
                  <Card className="border-2 border-green-200">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <BookOpen className="w-6 h-6 text-green-600" />
                        <span>Subject Marks Summary</span>
                      </CardTitle>
                      <CardDescription>
                        Detailed marks breakdown for {terms.find((t) => t.id === selectedTerm)?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-bold">Subject</TableHead>
                              <TableHead className="font-bold">Category</TableHead>
                              <TableHead className="font-bold text-center">BOT</TableHead>
                              <TableHead className="font-bold text-center">MID</TableHead>
                              <TableHead className="font-bold text-center">END</TableHead>
                              <TableHead className="font-bold text-center">Total</TableHead>
                              <TableHead className="font-bold text-center">Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentReportDetails.subjects.map((subject, index) => (
                              <TableRow key={index} className={subject.category === "GENERAL" ? "bg-blue-50" : ""}>
                                <TableCell className="font-medium">{subject.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={subject.category === "GENERAL" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {subject.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">{subject.bot || "-"}</TableCell>
                                <TableCell className="text-center">{subject.midterm || "-"}</TableCell>
                                <TableCell className="text-center">{subject.eot || "-"}</TableCell>
                                <TableCell className="text-center font-bold">{subject.total || "-"}</TableCell>
                                <TableCell className="text-center">
                                  {subject.grade && (
                                    <Badge variant={getGradeBadgeVariant(subject.grade)} className="font-bold">
                                      {subject.grade}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Parent Information */}
                {selectedStudent.parent && (
                  <Card className="border-2 border-purple-200">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="flex items-center space-x-2 text-xl">
                        <Users className="w-6 h-6 text-purple-600" />
                        <span>Parent/Guardian Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Parent Name</Label>
                          <p className="text-lg font-semibold text-gray-900">{selectedStudent.parent.name}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                          <p className="text-lg font-semibold text-gray-900">{selectedStudent.parent.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Report Cards History */}
                <Card className="border-2 border-orange-200">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                      <FileText className="w-6 h-6 text-orange-600" />
                      <span>Behavioral Assessment Reports ({selectedStudent.reportCards.length})</span>
                    </CardTitle>
                    <CardDescription>Complete history of behavioral assessments and teacher comments</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {selectedStudent.reportCards.length > 0 ? (
                      <div className="space-y-6">
                        {selectedStudent.reportCards.map((report, index) => (
                          <Card key={report.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                  <Star className="w-5 h-5 text-yellow-500" />
                                  <span>Report #{report.id.slice(-8)}</span>
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    className={
                                      report.isApproved
                                        ? "bg-green-100 text-green-800"
                                        : "bg-orange-100 text-orange-800"
                                    }
                                  >
                                    {report.isApproved ? "Approved" : "Pending Approval"}
                                  </Badge>
                                  {report.approvedAt && (
                                    <span className="text-xs text-gray-500">
                                      Approved: {new Date(report.approvedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <CardDescription>
                                Created: {new Date(report.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {[
                                  { key: "discipline", label: "Discipline", value: report.discipline },
                                  { key: "cleanliness", label: "Cleanliness", value: report.cleanliness },
                                  {
                                    key: "classWorkPresentation",
                                    label: "Class Work",
                                    value: report.classWorkPresentation,
                                  },
                                  { key: "adherenceToSchool", label: "School Rules", value: report.adherenceToSchool },
                                  {
                                    key: "coCurricularActivities",
                                    label: "Co-Curricular",
                                    value: report.coCurricularActivities,
                                  },
                                  {
                                    key: "considerationToOthers",
                                    label: "Consideration",
                                    value: report.considerationToOthers,
                                  },
                                  { key: "speakingEnglish", label: "Speaking English", value: report.speakingEnglish },
                                ].map((field) => (
                                  <div key={field.key} className="space-y-1">
                                    <Label className="text-xs font-medium text-gray-600">{field.label}</Label>
                                    <Badge variant="outline" className="text-xs">
                                      {getBehavioralGradeDisplay(field.value || "")}
                                    </Badge>
                                  </div>
                                ))}
                              </div>

                              {report.classTeacherComment && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                  <Label className="text-sm font-medium text-blue-800">Class Teacher Comment:</Label>
                                  <p className="text-sm text-blue-700 mt-1">"{report.classTeacherComment}"</p>
                                </div>
                              )}

                              {report.headteacherComment && (
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <Label className="text-sm font-medium text-green-800">Head Teacher Comment:</Label>
                                  <p className="text-sm text-green-700 mt-1">"{report.headteacherComment}"</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">No behavioral assessment reports found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Create a report to track this student's behavioral progress
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            // Handle create report action
                            setIsViewDialogOpen(false)
                          }}
                          className="mt-4 bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Report
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      // Handle edit/create report action
                      setIsViewDialogOpen(false)
                    }}
                    className="w-full sm:w-auto hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {selectedStudent.reportCards.length > 0 ? "Edit Report" : "Create Report"}
                  </Button>
                  <Button
                    onClick={() => setIsViewDialogOpen(false)}
                    className="w-full sm:w-auto hover:bg-gray-50 transition-colors"
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
