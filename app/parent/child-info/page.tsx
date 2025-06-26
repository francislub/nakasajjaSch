"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  School,
} from "lucide-react"

interface Child {
  id: string
  name: string
  email: string
  dateOfBirth: string
  address?: string
  phoneNumber?: string
  registrationNumber?: string
  photo?: string
  gender?: string
  class: {
    id: string
    name: string
    teacher: {
      name: string
      email: string
    }
    subjects: Array<{
      id: string
      name: string
      code: string
    }>
    academicYear: string
  }
  attendance: Array<{
    id: string
    date: string
    status: string
  }>
}

export default function ChildInfoPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchChildInfo()
  }, [])

  const fetchChildInfo = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/parent/child-info")
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children || [])
        if (data.children && data.children.length > 0 && selectedChild === "all") {
          // Keep "all" selected to show all children by default
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch child info:", errorData)
      }
    } catch (error) {
      console.error("Error fetching child info:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const calculateAttendanceStats = (attendance: Child["attendance"]) => {
    if (attendance.length === 0) return { present: 0, absent: 0, late: 0, percentage: 0 }

    const present = attendance.filter((a) => a.status === "PRESENT").length
    const absent = attendance.filter((a) => a.status === "ABSENT").length
    const late = attendance.filter((a) => a.status === "LATE").length
    const percentage = Math.round((present / attendance.length) * 100)

    return { present, absent, late, percentage }
  }

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ABSENT":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "LATE":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800"
      case "ABSENT":
        return "bg-red-100 text-red-800"
      case "LATE":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredChildren = selectedChild === "all" ? children : children.filter((child) => child.id === selectedChild)

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

  if (children.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Children Found</h2>
          <p className="text-gray-600 mb-4">No student records are associated with your account.</p>
          <Button onClick={fetchChildInfo} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Children Information</h1>
          <p className="text-gray-600 mt-2">
            {children.length === 1
              ? "Information about your child"
              : `Information about your ${children.length} children`}
          </p>
        </div>
        <Button onClick={fetchChildInfo} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Child Selection - Only show if more than one child */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Child</CardTitle>
            <CardDescription>Choose a specific child or view all children</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - {child.class.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Children Information */}
      <div className="space-y-6">
        {filteredChildren.map((child) => {
          const attendanceStats = calculateAttendanceStats(child.attendance)
          const age = calculateAge(child.dateOfBirth)

          return (
            <Card key={child.id} className="overflow-hidden">
              {/* Profile Header */}
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                    <AvatarImage src={child.photo || "/placeholder.svg"} alt={child.name} />
                    <AvatarFallback className="text-2xl font-semibold bg-blue-100 text-blue-600">
                      {child.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-gray-900">{child.name}</CardTitle>
                    <CardDescription className="text-lg text-gray-700">
                      Class {child.class.name} • {child.registrationNumber || "No registration number"}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Age {age}
                      </Badge>
                      {child.gender && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {child.gender}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {attendanceStats.percentage}% Attendance
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <Tabs defaultValue="personal" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Personal Details</TabsTrigger>
                    <TabsTrigger value="class">Class Information</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  </TabsList>

                  {/* Personal Details Tab */}
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{child.email || "Not provided"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600">Date of Birth</p>
                              <p className="font-medium">
                                {new Date(child.dateOfBirth).toLocaleDateString()} ({age} years old)
                              </p>
                            </div>
                          </div>
                          {child.phoneNumber && (
                            <div className="flex items-center space-x-3">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">{child.phoneNumber}</p>
                              </div>
                            </div>
                          )}
                          {child.address && (
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-600">Address</p>
                                <p className="font-medium">{child.address}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <School className="w-5 h-5 text-green-600" />
                            Academic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Registration Number</p>
                            <p className="font-medium">{child.registrationNumber || "Not assigned"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Current Class</p>
                            <p className="font-medium">{child.class.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Academic Year</p>
                            <p className="font-medium">{child.class.academicYear}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Subjects</p>
                            <p className="font-medium">{child.class.subjects.length} subjects</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Class Information Tab */}
                  <TabsContent value="class" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            Class Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Class</p>
                            <p className="font-medium text-lg">{child.class.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Academic Year</p>
                            <p className="font-medium">{child.class.academicYear}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" />
                            Class Teacher
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Teacher Name</p>
                            <p className="font-medium">{child.class.teacher.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <a
                              href={`mailto:${child.class.teacher.email}`}
                              className="font-medium text-blue-600 hover:text-blue-800 underline"
                            >
                              {child.class.teacher.email}
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                          Subjects ({child.class.subjects.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {child.class.subjects.map((subject) => (
                            <div key={subject.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <p className="font-medium">{subject.name}</p>
                              <p className="text-sm text-gray-600">{subject.code}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Attendance Tab */}
                  <TabsContent value="attendance" className="space-y-4">
                    {/* Attendance Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                          <p className="text-sm text-gray-600">Present</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <XCircle className="w-6 h-6 text-red-600" />
                          </div>
                          <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                          <p className="text-sm text-gray-600">Absent</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Clock className="w-6 h-6 text-yellow-600" />
                          </div>
                          <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                          <p className="text-sm text-gray-600">Late</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{attendanceStats.percentage}%</p>
                          <p className="text-sm text-gray-600">Attendance</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Attendance Records */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Attendance Records</CardTitle>
                        <CardDescription>Last {Math.min(child.attendance.length, 15)} records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {child.attendance.length > 0 ? (
                          <div className="space-y-2">
                            {child.attendance.slice(0, 15).map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  {getAttendanceStatusIcon(record.status)}
                                  <span className="font-medium">
                                    {new Date(record.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <Badge className={getAttendanceStatusColor(record.status)}>{record.status}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No attendance records found.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
