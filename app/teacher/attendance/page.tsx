"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Save, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  photo?: string
  attendance: Array<{
    id: string
    status: string
    date: string
  }>
}

interface AttendanceRecord {
  studentId: string
  status: "PRESENT" | "ABSENT" | "LATE"
}

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
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
        setStudents(data)

        // Initialize attendance data
        const initialAttendance = data.map((student: Student) => ({
          studentId: student.id,
          status: student.attendance.length > 0 ? student.attendance[0].status : "PRESENT",
        }))
        setAttendanceData(initialAttendance)
      } else {
        throw new Error("Failed to fetch attendance")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendanceData((prev) => prev.map((record) => (record.studentId === studentId ? { ...record, status } : record)))
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ABSENT":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "LATE":
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case "LATE":
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
    }
  }

  const getAttendanceStats = () => {
    const present = attendanceData.filter((record) => record.status === "PRESENT").length
    const absent = attendanceData.filter((record) => record.status === "ABSENT").length
    const late = attendanceData.filter((record) => record.status === "LATE").length
    const total = attendanceData.length
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    return { present, absent, late, total, rate }
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Attendance</h1>
          <p className="text-gray-600 mt-1">Mark attendance for your students</p>
        </div>
        <Button onClick={handleSaveAttendance} disabled={saving} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>

      {/* Date Selection and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 focus:border-green-500"
            />
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.present}</div>
            <p className="text-xs text-gray-500 mt-1">Students present</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.absent}</div>
            <p className="text-xs text-gray-500 mt-1">Students absent</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Late</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.late}</div>
            <p className="text-xs text-gray-500 mt-1">Students late</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rate</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.rate}%</div>
            <p className="text-xs text-gray-500 mt-1">Attendance rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Mark Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const currentRecord = attendanceData.find((record) => record.studentId === student.id)
                const currentStatus = currentRecord?.status || "PRESENT"

                return (
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
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(currentStatus)}
                        {getStatusBadge(currentStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentStatus}
                        onValueChange={(value: "PRESENT" | "ABSENT" | "LATE") =>
                          handleAttendanceChange(student.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Present</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="LATE">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {students.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">No students assigned to your class</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
