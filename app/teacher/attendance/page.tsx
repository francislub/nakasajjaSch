"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Save,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Student {
  id: string
  name: string
  photo?: string
  registrationNumber?: string
  attendance: Array<{
    id: string
    status: string
    date: string
    remarks?: string
  }>
}

interface AttendanceRecord {
  studentId: string
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
  remarks?: string
}

interface AttendanceStats {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
}

const ATTENDANCE_STATUS = [
  { value: "PRESENT", label: "Present", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "ABSENT", label: "Absent", color: "bg-red-100 text-red-800", icon: XCircle },
  { value: "LATE", label: "Late", color: "bg-orange-100 text-orange-800", icon: Clock },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-100 text-blue-800", icon: AlertTriangle },
]

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [activeTab, setActiveTab] = useState("mark")
  const [filterDate, setFilterDate] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const { toast } = useToast()

  useEffect(() => {
    fetchAttendance()
  }, [selectedDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/attendance?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(Array.isArray(data) ? data : [])

        // Initialize attendance data
        const initialAttendance = data.map((student: Student) => ({
          studentId: student.id,
          status: student.attendance.length > 0 ? student.attendance[0].status : "PRESENT",
          remarks: student.attendance.length > 0 ? student.attendance[0].remarks : "",
        }))
        setAttendanceData(initialAttendance)
      } else {
        throw new Error("Failed to fetch attendance")
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      setStudents([])
      setAttendanceData([])
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (
    studentId: string,
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
    remarks?: string,
  ) => {
    setAttendanceData((prev) =>
      prev.map((record) =>
        record.studentId === studentId ? { ...record, status, remarks: remarks || record.remarks } : record,
      ),
    )
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData((prev) =>
      prev.map((record) => (record.studentId === studentId ? { ...record, remarks } : record)),
    )
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceData,
          date: selectedDate,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Attendance saved successfully",
        })
        fetchAttendance() // Refresh data
      } else {
        throw new Error("Failed to save attendance")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = (status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    setAttendanceData((prev) => prev.map((record) => ({ ...record, status })))
  }

  const exportAttendance = async () => {
    try {
      const response = await fetch("/api/teacher/attendance/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
        }),
      })

      if (response.ok) {
        const { data, metadata } = await response.json()

        // Create CSV content
        const headers = [
          "Student Name",
          "Registration Number",
          "Total Days",
          "Present",
          "Absent",
          "Late",
          "Excused",
          "Attendance Rate",
        ]
        const csvContent = [
          headers.join(","),
          ...data.map((student: any) =>
            [
              student.name,
              student.registrationNumber || "",
              student.stats.totalDays,
              student.stats.presentDays,
              student.stats.absentDays,
              student.stats.lateDays,
              student.stats.excusedDays,
              `${student.stats.attendanceRate}%`,
            ].join(","),
          ),
        ].join("\n")

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `attendance_${metadata.className}_${dateRange.from}_to_${dateRange.to}.csv`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Success",
          description: "Attendance exported successfully",
        })
      } else {
        throw new Error("Failed to export attendance")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export attendance",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    const statusConfig = ATTENDANCE_STATUS.find((s) => s.value === status)
    if (!statusConfig) return <CheckCircle className="w-4 h-4 text-green-600" />
    const Icon = statusConfig.icon
    return <Icon className="w-4 h-4" />
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = ATTENDANCE_STATUS.find((s) => s.value === status)
    if (!statusConfig) return <Badge className="bg-green-100 text-green-800">Present</Badge>
    return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
  }

  const getAttendanceStats = (): AttendanceStats => {
    const present = attendanceData.filter((record) => record.status === "PRESENT").length
    const absent = attendanceData.filter((record) => record.status === "ABSENT").length
    const late = attendanceData.filter((record) => record.status === "LATE").length
    const excused = attendanceData.filter((record) => record.status === "EXCUSED").length
    const total = attendanceData.length
    const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0

    return {
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      excusedDays: excused,
      attendanceRate: rate,
    }
  }

  const calculateStudentStats = (student: Student): AttendanceStats => {
    const attendance = student.attendance || []
    const present = attendance.filter((a) => a.status === "PRESENT").length
    const absent = attendance.filter((a) => a.status === "ABSENT").length
    const late = attendance.filter((a) => a.status === "LATE").length
    const excused = attendance.filter((a) => a.status === "EXCUSED").length
    const total = attendance.length
    const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0

    return {
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      excusedDays: excused,
      attendanceRate: rate,
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(students.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentStudents = students.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const stats = getAttendanceStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Advanced Attendance Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Comprehensive attendance tracking • {students.length} students • Multiple status options
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {/* <Button variant="outline" onClick={exportAttendance} className="w-full sm:w-auto bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button> */}
          <Button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="mark" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Calendar className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Mark Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="view" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Eye className="w-4 h-4" />
            <span className="text-xs sm:text-sm">View Records</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="space-y-4 sm:space-y-6">
          {/* Date Selection and Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
            <Card className="bg-white shadow-lg border-0 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span>Date</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-gray-300 focus:border-green-500 text-sm"
                />
              </CardContent>
            </Card>

            {ATTENDANCE_STATUS.map((status) => {
              const count = attendanceData.filter((record) => record.status === status.value).length
              const Icon = status.icon
              return (
                <Card key={status.value} className="bg-white shadow-lg border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{status.label}</CardTitle>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{count}</div>
                    <p className="text-xs text-gray-500 mt-1">Students</p>
                  </CardContent>
                </Card>
              )
            })}

            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Rate</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.attendanceRate}%</div>
                <p className="text-xs text-gray-500 mt-1">Attendance rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Apply status to all students at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {ATTENDANCE_STATUS.map((status) => (
                  <Button
                    key={status.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction(status.value as any)}
                    className="flex items-center justify-center space-x-1 text-xs sm:text-sm p-2 sm:p-3"
                  >
                    {getStatusIcon(status.value)}
                    <span className="hidden sm:inline">Mark All {status.label}</span>
                    <span className="sm:hidden">{status.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Student Attendance</CardTitle>
              <CardDescription className="text-sm">
                Mark attendance for{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48 sm:w-64">Student</TableHead>
                      <TableHead className="w-32 hidden sm:table-cell">Current Status</TableHead>
                      <TableHead className="w-40 sm:w-48">Mark Attendance</TableHead>
                      <TableHead className="w-48 sm:w-64 hidden md:table-cell">Remarks</TableHead>
                      <TableHead className="w-24 sm:w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStudents.map((student) => {
                      const currentRecord = attendanceData.find((record) => record.studentId === student.id)
                      const currentStatus = currentRecord?.status || "PRESENT"

                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                                <AvatarFallback className="bg-green-100 text-green-700 text-xs sm:text-sm">
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 text-sm sm:text-base">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.registrationNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(currentStatus)}
                              {getStatusBadge(currentStatus)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={currentStatus}
                              onValueChange={(value: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") =>
                                handleAttendanceChange(student.id, value)
                              }
                            >
                              <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ATTENDANCE_STATUS.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(status.value)}
                                      <span className="text-xs sm:text-sm">{status.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Input
                              placeholder="Add remarks..."
                              value={currentRecord?.remarks || ""}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              className="w-40 sm:w-48 text-xs sm:text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStudent(student)
                                setIsStatsDialogOpen(true)
                              }}
                              className="text-xs sm:text-sm p-1 sm:p-2"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Stats</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, students.length)} of {students.length} students
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-xs sm:text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className="w-8 h-8 p-0 text-xs sm:text-sm"
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Records Tab */}
        <TabsContent value="view" className="space-y-4 sm:space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span>Filter Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filterDate" className="text-sm">
                    Filter by Date
                  </Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border-gray-300 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="dateRange" className="text-sm">
                    Date Range
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="border-gray-300 focus:border-green-500 text-sm"
                    />
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="border-gray-300 focus:border-green-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Attendance History */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {students.map((student) => {
              const studentStats = calculateStudentStats(student)
              return (
                <Card key={student.id} className="bg-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                          <AvatarImage src={student.photo || "/placeholder.svg"} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-base sm:text-lg">{student.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Attendance Rate</p>
                          <p className="text-lg font-bold text-green-600">{studentStats.attendanceRate}%</p>
                        </div>
                        <Progress value={studentStats.attendanceRate} className="w-16 sm:w-20" />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {studentStats.totalDays} days recorded • {studentStats.presentDays} present •{" "}
                      {studentStats.absentDays} absent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {ATTENDANCE_STATUS.map((status) => {
                        let count = 0
                        if (status.value === "PRESENT") count = studentStats.presentDays
                        if (status.value === "ABSENT") count = studentStats.absentDays
                        if (status.value === "LATE") count = studentStats.lateDays
                        if (status.value === "EXCUSED") count = studentStats.excusedDays

                        return (
                          <div key={status.value} className="text-center">
                            <Badge className={status.color} variant="outline">
                              {status.label}
                            </Badge>
                            <p className="text-xl sm:text-2xl font-bold mt-1">{count}</p>
                          </div>
                        )
                      })}
                    </div>

                    {student.attendance && student.attendance.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm sm:text-base">Recent Attendance</h4>
                        <div className="max-h-32 overflow-y-auto">
                          {student.attendance.slice(0, 10).map((record, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-1 border-b border-gray-100"
                            >
                              <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                              {getStatusBadge(record.status)}
                              {record.remarks && (
                                <span className="text-xs text-gray-500 max-w-24 sm:max-w-32 truncate">
                                  {record.remarks}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-green-800 text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Total Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{students.length}</p>
                <p className="text-xs sm:text-sm text-green-600">Active students</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-blue-800 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Present Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.presentDays}</p>
                <p className="text-xs sm:text-sm text-blue-600">Students present</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-red-800 text-sm sm:text-base">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Absent Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-red-900">{stats.absentDays}</p>
                <p className="text-xs sm:text-sm text-red-600">Students absent</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-purple-800 text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Attendance Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.attendanceRate}%</p>
                <p className="text-xs sm:text-sm text-purple-600">Overall rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Trends */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Attendance Status Distribution</CardTitle>
              <CardDescription className="text-sm">Overview of attendance patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ATTENDANCE_STATUS.map((status) => {
                  let count = 0
                  if (status.value === "PRESENT") count = stats.presentDays
                  if (status.value === "ABSENT") count = stats.absentDays
                  if (status.value === "LATE") count = stats.lateDays
                  if (status.value === "EXCUSED") count = stats.excusedDays

                  const percentage = stats.totalDays > 0 ? Math.round((count / stats.totalDays) * 100) : 0

                  return (
                    <div key={status.value} className="flex items-center space-x-4">
                      <Badge className={status.color} variant="outline">
                        {status.label}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{status.label}</span>
                          <span className="text-sm text-gray-600">
                            {count} students ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 sm:space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Generate Reports</CardTitle>
              <CardDescription className="text-sm">
                Create detailed attendance reports for different periods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportFrom" className="text-sm">
                    From Date
                  </Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="border-gray-300 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="reportTo" className="text-sm">
                    To Date
                  </Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="border-gray-300 focus:border-green-500 text-sm"
                  />
                </div>
              </div>
              {/* <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button onClick={exportAttendance} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Export Detailed Report
                </Button>
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Summary Report
                </Button>
              </div> */}
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Class Summary</CardTitle>
              <CardDescription className="text-sm">
                Overall attendance statistics for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{students.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
                  <p className="text-xs sm:text-sm text-gray-600">Average Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.absentDays}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Absences</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.lateDays}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Late Arrivals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Student Attendance Statistics</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedStudent ? `Detailed attendance record for ${selectedStudent.name}` : "Student statistics"}
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm sm:text-base">{selectedStudent.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedStudent.registrationNumber}</p>
                </div>
              </div>

              {(() => {
                const studentStats = calculateStudentStats(selectedStudent)
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{studentStats.presentDays}</p>
                        <p className="text-xs text-green-700">Present</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-xl sm:text-2xl font-bold text-red-600">{studentStats.absentDays}</p>
                        <p className="text-xs text-red-700">Absent</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">{studentStats.lateDays}</p>
                        <p className="text-xs text-orange-700">Late</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{studentStats.excusedDays}</p>
                        <p className="text-xs text-blue-700">Excused</p>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{studentStats.attendanceRate}%</p>
                      <p className="text-xs sm:text-sm text-gray-600">Overall Attendance Rate</p>
                      <Progress value={studentStats.attendanceRate} className="mt-2" />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Total Days Recorded: {studentStats.totalDays}</p>
                      {studentStats.attendanceRate < 75 && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <p className="text-sm text-red-700">Low attendance - requires attention</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {students.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-8 sm:py-12">
            <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-sm sm:text-base text-gray-600">No students assigned to your class</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
