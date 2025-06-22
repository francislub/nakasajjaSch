"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, BookOpen, Users, UserCheck, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Class {
  id: string
  name: string
  academicYear: {
    id: string
    year: string
  }
  classTeacher?: {
    id: string
    name: string
    email: string
  }
  subjects: any[]
  students: any[]
}

interface AcademicYear {
  id: string
  year: string
}

interface Teacher {
  id: string
  name: string
  email: string
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    academicYearId: "",
  })

  const [assignTeacherData, setAssignTeacherData] = useState({
    teacherId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [classesResponse, academicYearsResponse, teachersResponse] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/academic-years"),
        fetch("/api/users?role=CLASS_TEACHER"),
      ])

      const [classesData, academicYearsData, teachersData] = await Promise.all([
        classesResponse.json(),
        academicYearsResponse.json(),
        teachersResponse.json(),
      ])

      setClasses(classesData)
      setAcademicYears(academicYearsData)
      setTeachers(teachersData)
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

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Class created successfully",
        })
        setIsDialogOpen(false)
        setFormData({ name: "", academicYearId: "" })
        fetchData()
      } else {
        throw new Error("Failed to create class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      })
    }
  }

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClass) return

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}/assign-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignTeacherData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher assigned successfully",
        })
        setIsAssignTeacherOpen(false)
        setSelectedClass(null)
        setAssignTeacherData({ teacherId: "" })
        fetchData()
      } else {
        throw new Error("Failed to assign teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign teacher",
        variant: "destructive",
      })
    }
  }

  const openAssignTeacher = (classData: Class) => {
    setSelectedClass(classData)
    setAssignTeacherData({ teacherId: classData.classTeacher?.id || "" })
    setIsAssignTeacherOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage classes and assign teachers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Class</DialogTitle>
              <DialogDescription>Create a new class for an academic year.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Primary 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignTeacherOpen} onOpenChange={setIsAssignTeacherOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Class Teacher</DialogTitle>
            <DialogDescription>Assign a teacher to {selectedClass?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div>
              <Label htmlFor="teacherId">Select Teacher</Label>
              <Select
                value={assignTeacherData.teacherId}
                onValueChange={(value) => setAssignTeacherData({ teacherId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAssignTeacherOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Assign Teacher
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classData) => (
          <Card key={classData.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{classData.name}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAssignTeacher(classData)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Assign
                </Button>
              </div>
              <CardDescription className="text-blue-600 font-medium">{classData.academicYear.year}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {classData.classTeacher ? (
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{classData.classTeacher.name}</p>
                    <p className="text-xs text-gray-600">{classData.classTeacher.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-600">
                  <UserCheck className="w-4 h-4" />
                  <p className="text-sm">No teacher assigned</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Subjects</p>
                  <p className="font-semibold text-gray-900">{classData.subjects.length}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-1">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="font-semibold text-gray-900">{classData.students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first class.</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
