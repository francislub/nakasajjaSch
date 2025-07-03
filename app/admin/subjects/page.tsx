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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, BookOpen, Trash2, User, GraduationCap, Search, Filter, X, Edit, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface Subject {
  id: string
  name: string
  code: string
  category: "GENERAL" | "SUBSIDIARY"
  createdAt: string
  class?: {
    id: string
    name: string
  }
  academicYear?: {
    id: string
    year: string
    isActive: boolean
  }
  subjectTeachers: {
    id: string
    teacher: {
      id: string
      name: string
      email: string
    }
    class: {
      id: string
      name: string
    }
    term: {
      id: string
      name: string
    }
    academicYear: {
      id: string
      year: string
      isActive: boolean
    }
  }[]
}

interface Class {
  id: string
  name: string
}

interface Teacher {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  qualification: string | null
  experience: number | null
  isActive: boolean
  subjectAssignments: {
    id: string
    subject: {
      id: string
      name: string
      code: string
    }
    class: {
      id: string
      name: string
    }
    term: {
      id: string
      name: string
    }
    academicYear: {
      id: string
      year: string
    }
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

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "GENERAL" as "GENERAL" | "SUBSIDIARY",
    classId: "",
    academicYearId: "",
  })

  const [assignmentData, setAssignmentData] = useState({
    teacherId: "",
    classId: "",
    termId: "",
    academicYearId: "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [selectedAcademicYear, selectedCategory, selectedClass, selectedTerm, activeTab])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [classesRes, teachersRes, termsRes, academicYearsRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/teachers"), // Changed from "/api/users/teachers" to "/api/teachers"
        fetch("/api/terms"),
        fetch("/api/academic-years"),
      ])

      const [classesData, teachersData, termsData, academicYearsData] = await Promise.all([
        classesRes.json(),
        teachersRes.json(),
        termsRes.json(),
        academicYearsRes.json(),
      ])

      setClasses(classesData || [])
      setTeachers(teachersData || [])
      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])

      // Set default academic year to active year
      const activeYear = academicYearsData?.find((year: AcademicYear) => year.isActive)
      if (activeYear) {
        setSelectedAcademicYear(activeYear.id)
        setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }))
        setAssignmentData((prev) => ({ ...prev, academicYearId: activeYear.id }))
      }

      await fetchSubjects()
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch initial data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear)
      if (selectedCategory) params.append("category", selectedCategory)
      if (selectedClass) params.append("classId", selectedClass)
      if (selectedTerm) params.append("termId", selectedTerm)
      if (activeTab !== "all") params.append("tab", activeTab)

      const response = await fetch(`/api/subjects?${params.toString()}`)
      const data = await response.json()

      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch subjects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchSubjects()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchSubjects()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subject",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject) return

    try {
      const response = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchSubjects()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update subject",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })
        fetchSubjects()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete subject")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive",
      })
    }
  }

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject) return

    try {
      const response = await fetch("/api/subject-teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignmentData,
          subjectId: selectedSubject.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher assigned successfully",
        })
        setIsAssignDialogOpen(false)
        resetAssignmentForm()
        fetchSubjects()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign teacher",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/subject-teachers/${assignmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher assignment removed successfully",
        })

        // Refresh the selected subject data
        if (selectedSubject) {
          const updatedSubject = {
            ...selectedSubject,
            subjectTeachers: selectedSubject.subjectTeachers.filter((st) => st.id !== assignmentId),
          }
          setSelectedSubject(updatedSubject)
        }

        fetchSubjects()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove teacher assignment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove teacher assignment",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    const activeYear = academicYears.find((year) => year.isActive)
    setFormData({
      name: "",
      code: "",
      category: "GENERAL",
      classId: "",
      academicYearId: activeYear?.id || "",
    })
    setSelectedSubject(null)
  }

  const resetAssignmentForm = () => {
    const activeYear = academicYears.find((year) => year.isActive)
    const activeTerm = terms.find((term) => term.name.toLowerCase().includes("first") || terms[0]) // Get first term or default
    const defaultClass = classes[0] // Get first class or could be made more intelligent

    setAssignmentData({
      teacherId: "",
      classId: defaultClass?.id || "",
      termId: activeTerm?.id || terms[0]?.id || "",
      academicYearId: activeYear?.id || "",
    })
  }

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      classId: subject.class?.id || "",
      academicYearId: subject.academicYear?.id || "",
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsViewDialogOpen(true)
  }

  const openAssignDialog = (subject: Subject) => {
    setSelectedSubject(subject)

    const activeYear = academicYears.find((year) => year.isActive)
    const activeTerm = terms.find((term) => term.name.toLowerCase().includes("first")) || terms[0]
    const defaultClass = subject.class || classes[0] // Use subject's class if available, otherwise first class

    setAssignmentData({
      teacherId: "",
      classId: defaultClass?.id || "",
      termId: activeTerm?.id || "",
      academicYearId: activeYear?.id || "",
    })

    setIsAssignDialogOpen(true)
  }

  const getCategoryColor = (category: string) => {
    return category === "GENERAL" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
  }

  const clearFilters = () => {
    const activeYear = academicYears.find((year) => year.isActive)
    setSelectedAcademicYear(activeYear?.id || "")
    setSelectedCategory("")
    setSelectedClass("")
    setSelectedTerm("")
    setSearchTerm("")
    setActiveTab("all")
  }

  if (loading && subjects.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-600 mt-1">Manage subjects, categories, and teacher assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>Create a new subject with category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mathematics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., MATH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "GENERAL" | "SUBSIDIARY") => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General (Used for Division)</SelectItem>
                    <SelectItem value="SUBSIDIARY">Subsidiary (Not for Division)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="classId">Assign to Class (Optional)</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific class</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="all">All Academic Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year} {year.isActive && "(Active)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="all">All Subjects</TabsTrigger>
          <TabsTrigger value="assigned">Assigned Subjects</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                <X className="w-3 h-3 mr-1" />
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Search by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="outline" className="px-2 bg-transparent">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Academic Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year} {year.isActive && "(Active)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="SUBSIDIARY">Subsidiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
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

              {activeTab === "assigned" && (
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
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
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Subject Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input
                id="edit-code"
                placeholder="e.g., MATH"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: "GENERAL" | "SUBSIDIARY") => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General (Used for Division)</SelectItem>
                  <SelectItem value="SUBSIDIARY">Subsidiary (Not for Division)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-classId">Assign to Class</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific class</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-academicYearId">Academic Year</Label>
              <Select
                value={formData.academicYearId}
                onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} {year.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Subject
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subject Details</DialogTitle>
            <DialogDescription>View subject information and teacher assignments.</DialogDescription>
          </DialogHeader>
          {selectedSubject && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Subject Name</Label>
                  <p className="text-sm font-semibold">{selectedSubject.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Subject Code</Label>
                  <p className="text-sm">{selectedSubject.code || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <Badge className={getCategoryColor(selectedSubject.category)}>{selectedSubject.category}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Class</Label>
                  <p className="text-sm">{selectedSubject.class?.name || "All classes"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Academic Year</Label>
                  <p className="text-sm">
                    {selectedSubject.academicYear?.year || "Not set"}
                    {selectedSubject.academicYear?.isActive && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-500">Teacher Assignments</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      setTimeout(() => {
                        openAssignDialog(selectedSubject)
                      }, 100)
                    }}
                  >
                    <User className="w-3 h-3 mr-1" />
                    Assign Teacher
                  </Button>
                </div>

                <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
                  {selectedSubject.subjectTeachers.length > 0 ? (
                    selectedSubject.subjectTeachers.map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{assignment.teacher.name}</p>
                            <div className="flex items-center text-xs text-gray-600 mt-1 space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {assignment.class.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {assignment.term.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {assignment.academicYear.year}
                                {assignment.academicYear.isActive && " (Active)"}
                              </Badge>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Teacher Assignment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {assignment.teacher.name} from teaching{" "}
                                  {selectedSubject.name} for {assignment.class.name} in {assignment.term.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No teacher assignments</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 bg-transparent"
                        onClick={() => {
                          setIsViewDialogOpen(false)
                          setTimeout(() => {
                            openAssignDialog(selectedSubject)
                          }, 100)
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Assign Teacher
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Subject Teacher Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subject Teacher</DialogTitle>
            <DialogDescription>Assign a teacher to teach {selectedSubject?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div>
              <Label htmlFor="teacherId">Select Teacher *</Label>
              <Select
                value={assignmentData.teacherId}
                onValueChange={(value) => setAssignmentData({ ...assignmentData, teacherId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher to assign" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{teacher.name}</span>
                        <span className="text-xs text-gray-500">{teacher.email || "No email"}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hidden fields with default values */}
            <input type="hidden" value={assignmentData.classId} />
            <input type="hidden" value={assignmentData.termId} />
            <input type="hidden" value={assignmentData.academicYearId} />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Assign Teacher
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Subjects</span>
            {selectedAcademicYear && academicYears.find((y) => y.id === selectedAcademicYear)?.isActive && (
              <Badge variant="outline" className="ml-2">
                Active Academic Year
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Manage subjects, categories, and teacher assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.code || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(subject.category)}>{subject.category}</Badge>
                    </TableCell>
                    <TableCell>{subject.class?.name || "All classes"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span>{subject.academicYear?.year || "Not set"}</span>
                        {subject.academicYear?.isActive && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{subject.subjectTeachers.length}</span>
                        <span className="text-sm text-gray-600">assigned</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openViewDialog(subject)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(subject)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAssignDialog(subject)}>
                          <User className="w-3 h-3 mr-1" />
                          Assign
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the subject "{subject.name}"
                                and all associated teacher assignments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(subject.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {loading ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects Found</h3>
                        <p className="text-gray-600 mb-4">
                          {selectedAcademicYear || selectedCategory || selectedClass || selectedTerm || searchTerm
                            ? "No subjects match your current filters."
                            : "Get started by adding your first subject."}
                        </p>
                        {selectedAcademicYear || selectedCategory || selectedClass || selectedTerm || searchTerm ? (
                          <Button variant="outline" onClick={clearFilters}>
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                          </Button>
                        ) : (
                          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Subject
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
