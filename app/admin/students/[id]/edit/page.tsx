"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Upload, User, Heart, GraduationCap } from "lucide-react"

interface Student {
  id: string
  name: string
  email?: string
  photo?: string
  gender: string
  age: number
  dateOfBirth: string
  address?: string
  phone?: string
  emergencyContact?: string
  medicalInfo?: string
  classId: string
  termId: string
  academicYearId: string
  parentId?: string
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
  parent?: {
    id: string
    name: string
    email: string
  }
}

interface Class {
  id: string
  name: string
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

interface Parent {
  id: string
  name: string
  email: string
}

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()

  const [student, setStudent] = useState<Student | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    age: "",
    dateOfBirth: "",
    address: "",
    phone: "",
    emergencyContact: "",
    medicalInfo: "",
    classId: "",
    termId: "",
    academicYearId: "",
    parentId: "",
    photo: "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [params.id])

  const fetchInitialData = async () => {
    try {
      const [studentResponse, classesResponse, termsResponse, academicYearsResponse, parentsResponse] =
        await Promise.all([
          fetch(`/api/students/${params.id}`),
          fetch("/api/classes"),
          fetch("/api/terms"),
          fetch("/api/academic-years"),
          fetch("/api/users/parents"),
        ])

      if (!studentResponse.ok) {
        throw new Error("Student not found")
      }

      const [studentData, classesData, termsData, academicYearsData, parentsData] = await Promise.all([
        studentResponse.json(),
        classesResponse.json(),
        termsResponse.json(),
        academicYearsResponse.json(),
        parentsResponse.json(),
      ])

      setStudent(studentData)
      setClasses(classesData || [])
      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])
      setParents(parentsData || [])

      // Populate form data
      setFormData({
        name: studentData.name || "",
        email: studentData.email || "",
        gender: studentData.gender || "",
        age: studentData.age?.toString() || "",
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString().split("T")[0] : "",
        address: studentData.address || "",
        phone: studentData.phone || "",
        emergencyContact: studentData.emergencyContact || "",
        medicalInfo: studentData.medicalInfo || "",
        classId: studentData.classId || "",
        termId: studentData.termId || "",
        academicYearId: studentData.academicYearId || "",
        parentId: studentData.parentId || "",
        photo: studentData.photo || "",
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      })
      router.push("/admin/students")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        handleInputChange("photo", data.url)
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/students/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          age: Number.parseInt(formData.age) || 0,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student updated successfully",
        })
        router.push("/admin/students")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update student",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Not Found</h1>
          <p className="text-gray-600 mt-2">The student you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/students")} className="mt-4">
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/admin/students")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-600 mt-1">Update student information and details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Profile Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={formData.photo || "/placeholder.svg"} alt={formData.name} />
                <AvatarFallback className="text-xl">
                  {formData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? "Uploading..." : "Upload Photo"}</span>
                  </div>
                </Label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500 mt-2">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>Student's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter student's full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter age"
                  min="1"
                  max="25"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+256 700 000 000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Home Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete home address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <span>Academic Information</span>
            </CardTitle>
            <CardDescription>Class, term, and academic year details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => handleInputChange("academicYearId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        <div className="flex items-center space-x-2">
                          <span>{year.year}</span>
                          {year.isActive && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="term">Term *</Label>
                <Select value={formData.termId} onValueChange={(value) => handleInputChange("termId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.classId} onValueChange={(value) => handleInputChange("classId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
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
            </div>
          </CardContent>
        </Card>

        {/* Parent Information */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600" />
              <span>Parent/Guardian Information</span>
            </CardTitle>
            <CardDescription>Assign a parent or guardian to this student</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="parent">Parent/Guardian</Label>
              <Select value={formData.parentId} onValueChange={(value) => handleInputChange("parentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent/guardian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent assigned</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      <div>
                        <div className="font-medium">{parent.name}</div>
                        <div className="text-sm text-gray-500">{parent.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Emergency & Medical Information */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>Emergency & Medical Information</span>
            </CardTitle>
            <CardDescription>Important contact and health information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                placeholder="Emergency contact person and phone number"
              />
            </div>
            <div>
              <Label htmlFor="medicalInfo">Medical Information</Label>
              <Textarea
                id="medicalInfo"
                value={formData.medicalInfo}
                onChange={(e) => handleInputChange("medicalInfo", e.target.value)}
                placeholder="Any medical conditions, allergies, or special requirements"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/students")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
