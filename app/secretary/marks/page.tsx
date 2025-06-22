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
import { BookOpen, Plus, Save, Calculator, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  class: {
    name: string
  }
}

interface Subject {
  id: string
  name: string
  code: string
  class: {
    name: string
  }
}

interface Class {
  id: string
  name: string
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
  student: {
    name: string
  }
  subject: {
    name: string
    code: string
  }
}

export default function SecretaryMarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState("")
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

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass()
      fetchSubjectsByClass()
    }
  }, [selectedClass])

  const fetchData = async () => {
    try {
      const [classesResponse, marksResponse] = await Promise.all([fetch("/api/classes"), fetch("/api/marks")])

      const [classesData, marksData] = await Promise.all([classesResponse.json(), marksResponse.json()])

      setClasses(classesData)
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

  const fetchStudentsByClass = async () => {
    try {
      const response = await fetch(`/api/students?classId=${selectedClass}`)
      const data = await response.json()
      setStudents(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    }
  }

  const fetchSubjectsByClass = async () => {
    try {
      const response = await fetch(`/api/subjects?classId=${selectedClass}`)
      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subjects",
        variant: "destructive",
      })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-gray-600 mt-1">Enter student marks for assessments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700" disabled={!selectedClass}>
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
                  <Calculator className="w-4 h-4 text-orange-600" />
                  <span className="text-lg font-bold text-orange-600">{calculateTotal()}%</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Marks
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Filter */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-orange-600" />
            <span>Filter by Class</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="classFilter">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {selectedClass && (
                  <>
                    <p>Students: {students.length}</p>
                    <p>Subjects: {subjects.length}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Table */}
      {selectedClass && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Marks Overview</CardTitle>
            <CardDescription>All marks entered for the selected class</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Ass 1</TableHead>
                  <TableHead>Ass 2</TableHead>
                  <TableHead>Ass 3</TableHead>
                  <TableHead>BOT</TableHead>
                  <TableHead>EOT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks
                  .filter(
                    (mark) =>
                      students.some((s) => s.id === mark.studentId) &&
                      subjects.some((sub) => sub.id === mark.subjectId),
                  )
                  .map((mark) => (
                    <TableRow key={mark.id}>
                      <TableCell className="font-medium">{mark.student.name}</TableCell>
                      <TableCell>{mark.subject.name}</TableCell>
                      <TableCell>{mark.assessment1}</TableCell>
                      <TableCell>{mark.assessment2}</TableCell>
                      <TableCell>{mark.assessment3}</TableCell>
                      <TableCell>{mark.bot}</TableCell>
                      <TableCell>{mark.eot}</TableCell>
                      <TableCell className="font-semibold">{mark.total}%</TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {marks.filter(
              (mark) =>
                students.some((s) => s.id === mark.studentId) && subjects.some((sub) => sub.id === mark.subjectId),
            ).length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No marks entered for this class yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedClass && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class to view and enter marks for students</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
