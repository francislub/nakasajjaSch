"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { User, GraduationCap, BookOpen, Calendar, Mail, Phone, MapPin } from "lucide-react"

interface Mark {
  id: string
  score: number
  totalMarks: number
  subject: {
    name: string
  }
  term: {
    name: string
  }
  academicYear: {
    year: string
  }
}

interface Child {
  id: string
  name: string
  email: string
  dateOfBirth: string
  address?: string
  phoneNumber?: string
  class: {
    name: string
    teacher: {
      name: string
      email: string
    }
    subjects: Array<{
      id: string
      name: string
    }>
  }
  marks: Mark[]
  attendance: Array<{
    id: string
    date: string
    status: string
  }>
}

export default function ChildInfoPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChildInfo()
  }, [selectedChild])

  const fetchChildInfo = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedChild) params.append("studentId", selectedChild)

      const response = await fetch(`/api/parent/child-info?${params}`)
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children)
        if (data.children.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching child info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedChildData = children.find((child) => child.id === selectedChild)

  const calculateAverageGrade = (marks: Mark[]) => {
    if (marks.length === 0) return 0
    const total = marks.reduce((sum, mark) => sum + (mark.score / mark.totalMarks) * 100, 0)
    return Math.round(total / marks.length)
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 70) return "text-blue-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Child Information</h1>
        <p className="text-gray-600 mt-2">Detailed information about your child</p>
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
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                    {selectedChildData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{selectedChildData.name}</CardTitle>
                  <CardDescription className="text-lg">Class {selectedChildData.class.name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedChildData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Born: {new Date(selectedChildData.dateOfBirth).toLocaleDateString()}</span>
                </div>
                {selectedChildData.phoneNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedChildData.phoneNumber}</span>
                  </div>
                )}
                {selectedChildData.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedChildData.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="academic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="academic">Academic Performance</TabsTrigger>
              <TabsTrigger value="class">Class Information</TabsTrigger>
              <TabsTrigger value="attendance">Recent Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="academic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Performance</CardTitle>
                  <CardDescription>Recent grades and performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Average</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={calculateAverageGrade(selectedChildData.marks)} className="w-24" />
                        <span
                          className={`font-semibold ${getGradeColor(calculateAverageGrade(selectedChildData.marks))}`}
                        >
                          {calculateAverageGrade(selectedChildData.marks)}%
                        </span>
                      </div>
                    </div>

                    {selectedChildData.marks.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium">Recent Marks</h4>
                        {selectedChildData.marks.slice(0, 5).map((mark) => {
                          const percentage = Math.round((mark.score / mark.totalMarks) * 100)
                          return (
                            <div key={mark.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{mark.subject.name}</p>
                                <p className="text-sm text-gray-500">
                                  {mark.term.name} - {mark.academicYear.year}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {mark.score}/{mark.totalMarks}
                                </p>
                                <Badge className={getGradeColor(percentage)}>{percentage}%</Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No academic records found.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="class" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                  <CardDescription>Details about your child's class and teacher</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Class Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          <span>Class {selectedChildData.class.name}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Class Teacher</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{selectedChildData.class.teacher.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{selectedChildData.class.teacher.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChildData.class.subjects.map((subject) => (
                        <Badge key={subject.id} variant="secondary">
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Latest attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedChildData.attendance.length > 0 ? (
                    <div className="space-y-3">
                      {selectedChildData.attendance.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                          <Badge
                            className={
                              record.status === "PRESENT"
                                ? "bg-green-100 text-green-800"
                                : record.status === "ABSENT"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {record.status}
                          </Badge>
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
        </div>
      )}
    </div>
  )
}
