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
import { useToast } from "@/hooks/use-toast"
import { Search, Eye, Download, FileText, Users, CheckCircle, Clock, X, Check } from "lucide-react"

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
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
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [headteacherComment, setHeadteacherComment] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [selectedClass, searchTerm])

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass !== "all") params.append("classId", selectedClass)
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
        setClasses(data || [])
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
      setClasses([])
    }
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
        // Reject report card
        const response = await fetch(`/api/report-cards/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isApproved: false,
            headteacherComment: headteacherComment || "Report card rejected by headteacher",
          }),
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: "Report card rejected",
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
            {classes &&
              classes.length > 0 &&
              classes.map((cls) => (
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
          <CardDescription>Review and approve student report cards submitted by teachers</CardDescription>
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
                                  setIsApprovalDialogOpen(true)
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

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report Card</DialogTitle>
            <DialogDescription>Add your headteacher comment and approve or reject this report card</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleApproveReport(selectedReport.id, false)} variant="destructive">
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveReport(selectedReport.id, true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
