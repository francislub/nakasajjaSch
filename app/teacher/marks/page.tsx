"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Plus, Edit, Save, Calculator, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Mark {
  id: string
  studentId: string
  subjectId: string
  assessment1: number
  assessment2: number
  assessment3: number
  bot: number
  eot: number
  total: number
  grade: string
  comment: string
  student: {
    name: string
  }
  subject: {
    name: string
    code: string
  }
}

export default function TeacherMarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    assessment1: 0,
    assessment2: 0,
    assessment3: 0,
    bot: 0,
    eot: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsResponse, subjectsResponse, marksResponse] = await Promise.all([
        fetch("/api/teacher/students"),
        fetch("/api/subjects"),
        fetch("/api/teacher/marks"),
      ])

      const [studentsData, subjectsData, marksData] = await Promise.all([
        studentsResponse.json(),
        subjectsResponse.json(),
        marksResponse.json(),
      ])

      setStudents(studentsData)
      setSubjects(subjectsData)
      setMarks(marksData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent || !selectedSubject) {
      toast({
        title: "Error",
        description: "Please select student and subject",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/teacher/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          subjectId: selectedSubject,
          marksData: [formData],
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Marks entered successfully",
        })
        setIsDialogOpen(false)
        setFormData({ assessment1: 0, assessment2: 0, assessment3: 0, bot: 0, eot: 0 })
        setSelectedStudent("")
        setSelectedSubject("")
        fetchData()
      } else {
        throw new Error("Failed to enter marks")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enter marks",
        variant: "destructive",
      })
    }
  }

  const calculateTotal = () => {
    const { assessment1, assessment2, assessment3, bot, eot } = formData
    return Math.round((assessment1 + assessment2 + assessment3 + bot + eot) / 5)
  }

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "C":
        return "bg-yellow-100 text-yellow-800"
      case "D":
        return "bg-orange-100 text-orange-800"
      case "F":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Group marks by student
  const marksByStudent = marks.reduce(
    (acc, mark) => {
      const studentName = mark.student.name
      if (!acc[studentName]) {
        acc[studentName] = []
      }
      acc[studentName].push(mark)
      return acc
    },
    {} as Record<string, Mark[]>,
  )

  // Group marks by subject
  const marksBySubject = marks.reduce(
    (acc, mark) => {
      const subjectName = mark.subject.name
      if (!acc[subjectName]) {
        acc[subjectName] = []
      }
      acc[subjectName].push(mark)
      return acc
    },
    {} as Record<string, Mark[]>,
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Marks Management</h1>
          <p className="text-gray-600 mt-1">Enter and manage student marks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Enter Marks
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Student Marks</DialogTitle>
              <DialogDescription>Enter marks for all assessments</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="student">Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assessment1">Assessment 1</Label>
                  <Input
                    id="assessment1"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.assessment1}
                    onChange={(e) => setFormData({ ...formData, assessment1: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="assessment2">Assessment 2</Label>
                  <Input
                    id="assessment2"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.assessment2}
                    onChange={(e) => setFormData({ ...formData, assessment2: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="assessment3">Assessment 3</Label>
                  <Input
                    id="assessment3"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.assessment3}
                    onChange={(e) => setFormData({ ...formData, assessment3: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="bot">BOT</Label>
                  <Input
                    id="bot"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.bot}
                    onChange={(e) => setFormData({ ...formData, bot: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="eot">EOT</Label>
                  <Input
                    id="eot"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.eot}
                    onChange={(e) => setFormData({ ...formData, eot: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Calculated Total:</span>
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{calculateTotal()}%</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Marks
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="by-student" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-student">View by Student</TabsTrigger>
          <TabsTrigger value="by-subject">View by Subject</TabsTrigger>
        </TabsList>

        <TabsContent value="by-student" className="space-y-4">
          {Object.entries(marksByStudent).map(([studentName, studentMarks]) => (
            <Card key={studentName} className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{studentName}</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      Average:{" "}
                      {Math.round(studentMarks.reduce((sum, mark) => sum + mark.total, 0) / studentMarks.length)}%
                    </span>
                  </div>
                </CardTitle>
                <CardDescription>{studentMarks.length} subjects assessed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Ass 1</TableHead>
                      <TableHead>Ass 2</TableHead>
                      <TableHead>Ass 3</TableHead>
                      <TableHead>BOT</TableHead>
                      <TableHead>EOT</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentMarks.map((mark) => (
                      <TableRow key={mark.id}>
                        <TableCell className="font-medium">{mark.subject.name}</TableCell>
                        <TableCell>{mark.assessment1}</TableCell>
                        <TableCell>{mark.assessment2}</TableCell>
                        <TableCell>{mark.assessment3}</TableCell>
                        <TableCell>{mark.bot}</TableCell>
                        <TableCell>{mark.eot}</TableCell>
                        <TableCell className="font-semibold">{mark.total}%</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="by-subject" className="space-y-4">
          {Object.entries(marksBySubject).map(([subjectName, subjectMarks]) => (
            <Card key={subjectName} className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <span>{subjectName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      Class Average:{" "}
                      {Math.round(subjectMarks.reduce((sum, mark) => sum + mark.total, 0) / subjectMarks.length)}%
                    </span>
                  </div>
                </CardTitle>
                <CardDescription>{subjectMarks.length} students assessed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Ass 1</TableHead>
                      <TableHead>Ass 2</TableHead>
                      <TableHead>Ass 3</TableHead>
                      <TableHead>BOT</TableHead>
                      <TableHead>EOT</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectMarks.map((mark) => (
                      <TableRow key={mark.id}>
                        <TableCell className="font-medium">{mark.student.name}</TableCell>
                        <TableCell>{mark.assessment1}</TableCell>
                        <TableCell>{mark.assessment2}</TableCell>
                        <TableCell>{mark.assessment3}</TableCell>
                        <TableCell>{mark.bot}</TableCell>
                        <TableCell>{mark.eot}</TableCell>
                        <TableCell className="font-semibold">{mark.total}%</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {marks.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Marks Entered</h3>
            <p className="text-gray-600 mb-4">Start by entering marks for your students</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Enter First Marks
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
