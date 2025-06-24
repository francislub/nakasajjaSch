"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Eye, Download, FileText, Users, CheckCircle, Clock } from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  class: {
    id: string
    name: string
  }
  parent?: {
    name: string
    email: string
  }
  reportCards: ReportCard[]
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

export default function AdminStudentReportsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  const [reportForm, setReportForm] = useState({
    studentId: "",
    discipline: "",
    cleanliness: "",
    classWorkPresentation: "",
    adherenceToSchool: "",
    coCurricularActivities: "",
    considerationToOthers: "",
    speakingEnglish: "",
    classTeacherComment: "",
    headteacherComment: "",
  })

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [selectedClass, searchTerm])

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.append("classId", selectedClass)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/admin/students/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/report-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportForm),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report card created successfully",
        })
        setIsCreateDialogOpen(false)
        setReportForm({
          studentId: "",
          discipline: "",
          cleanliness: "",
          classWorkPresentation: "",
          adherenceToSchool: "",
          coCurricularActivities: "",
          considerationToOthers: "",
          speakingEnglish: "",
          classTeacherComment: "",
          headteacherComment: "",
        })
        fetchStudents()
      } else {
        throw new Error("Failed to create report card")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create report card",
        variant: "destructive",
      })
    }
  }

  const handleApproveReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/report-cards/${reportId}/approve`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report card approved successfully",
        })
        fetchStudents()
      } else {
        throw new Error("Failed to approve report card")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve report card",
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

  const getGradeOptions = () => [
    { value: "A", label: "A - Very Good" },
    { value: "B", label: "B - Good" },
    { value: "C", label: "C - Fair" },
    { value: "D", label: "D - Needs Improvement" },
  ]

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
          <h1 className="text-3xl font-bold text-gray-900">Student Reports</h1>
          <p className="text-gray-600 mt-2">Manage student report cards and assessments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Report Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Report Card</DialogTitle>
              <DialogDescription>Create a comprehensive report card for a student</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select
                  value={reportForm.studentId}
                  onValueChange={(value) => setReportForm({ ...reportForm, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.class.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discipline">Discipline</Label>
                  <Select
                    value={reportForm.discipline}
                    onValueChange={(value) => setReportForm({ ...reportForm, discipline: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cleanliness">Cleanliness</Label>
                  <Select
                    value={reportForm.cleanliness}
                    onValueChange={(value) => setReportForm({ ...reportForm, cleanliness: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classWorkPresentation">Class Work Presentation</Label>
                  <Select
                    value={reportForm.classWorkPresentation}
                    onValueChange={(value) => setReportForm({ ...reportForm, classWorkPresentation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adherenceToSchool">Adherence to School</Label>
                  <Select
                    value={reportForm.adherenceToSchool}
                    onValueChange={(value) => setReportForm({ ...reportForm, adherenceToSchool: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coCurricularActivities">Co-curricular Activities</Label>
                  <Select
                    value={reportForm.coCurricularActivities}
                    onValueChange={(value) => setReportForm({ ...reportForm, coCurricularActivities: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="considerationToOthers">Consideration to Others</Label>
                  <Select
                    value={reportForm.considerationToOthers}
                    onValueChange={(value) => setReportForm({ ...reportForm, considerationToOthers: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="speakingEnglish">Speaking English</Label>
                <Select
                  value={reportForm.speakingEnglish}
                  onValueChange={(value) => setReportForm({ ...reportForm, speakingEnglish: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {getGradeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="classTeacherComment">Class Teacher Comment</Label>
                <Textarea
                  id="classTeacherComment"
                  value={reportForm.classTeacherComment}
                  onChange={(e) => setReportForm({ ...reportForm, classTeacherComment: e.target.value })}
                  placeholder="Enter class teacher's comment..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="headteacherComment">Headteacher Comment</Label>
                <Textarea
                  id="headteacherComment"
                  value={reportForm.headteacherComment}
                  onChange={(e) => setReportForm({ ...reportForm, headteacherComment: e.target.value })}
                  placeholder="Enter headteacher's comment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Report Card
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
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
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.reduce(
                (acc, student) => acc + student.reportCards.filter((report) => report.isApproved).length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {students.reduce(
                (acc, student) => acc + student.reportCards.filter((report) => !report.isApproved).length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
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
      </div>

      {/* Students Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Student Report Cards</CardTitle>
          <CardDescription>Manage and view student report cards</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
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
                            {report.isApproved ? "Approved" : "Pending"}
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveReport(report.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
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

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                  {selectedStudent.parent && (
                    <p className="text-sm text-gray-500">
                      Parent: {selectedStudent.parent.name} ({selectedStudent.parent.email})
                    </p>
                  )}
                </div>
              </div>

              {selectedStudent.reportCards.map((report, index) => (
                <Card key={report.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Report Card #{index + 1}</span>
                      <Badge
                        className={report.isApproved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {report.isApproved ? "Approved" : "Pending Approval"}
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
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{report.headteacherComment}</p>
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
