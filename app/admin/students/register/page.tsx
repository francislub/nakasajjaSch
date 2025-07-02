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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, User, BookOpen, Camera, X, Plus, UserPlus } from "lucide-react"

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

export default function RegisterStudentPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParentDialogOpen, setIsParentDialogOpen] = useState(false)
  const [isCreatingParent, setIsCreatingParent] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    phone: "",
    parentId: "",
    classId: "",
    termId: "",
    academicYearId: "",
    emergencyContact: "",
    medicalInfo: "",
    age: "",
  })

  const [parentFormData, setParentFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [classesResponse, termsResponse, academicYearsResponse, parentsResponse] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/terms"),
        fetch("/api/academic-years"),
        fetch("/api/users/parents"),
      ])

      const [classesData, termsData, academicYearsData, parentsData] = await Promise.all([
        classesResponse.json(),
        termsResponse.json(),
        academicYearsResponse.json(),
        parentsResponse.json(),
      ])

      setClasses(classesData || [])
      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])
      setParents(parentsData || [])

      // Set active academic year as default
      const activeYear = academicYearsData.find((year: AcademicYear) => year.isActive)
      if (activeYear) {
        setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }))
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    return data.url
  }

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingParent(true)

    try {
      // Validate parent form data
      if (!parentFormData.name || !parentFormData.email || !parentFormData.password) {
        toast({
          title: "Error",
          description: "Name, email, and password are required for parent",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/users/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parentFormData),
      })

      if (response.ok) {
        const newParent = await response.json()

        // Add new parent to the list
        setParents((prev) => [...prev, newParent])

        // Select the newly created parent
        setFormData((prev) => ({ ...prev, parentId: newParent.id }))

        // Reset parent form
        setParentFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          address: "",
        })

        // Close dialog
        setIsParentDialogOpen(false)

        toast({
          title: "Success",
          description: "Parent created successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create parent")
      }
    } catch (error) {
      console.error("Error creating parent:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create parent",
        variant: "destructive",
      })
    } finally {
      setIsCreatingParent(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let photoUrl = ""

      // Upload image if selected
      if (selectedFile) {
        photoUrl = await uploadImage(selectedFile)
      }

      const studentData = {
        ...formData,
        photo: photoUrl,
        age: formData.age ? Number.parseInt(formData.age) : null,
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student registered successfully",
        })
        router.push("/admin/students")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to register student")
      }
    } catch (error) {
      console.error("Error registering student:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register student",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleParentInputChange = (field: string, value: string) => {
    setParentFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register New Student</h1>
          <p className="text-gray-600 mt-2">Add a new student to the school system</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Photo */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>Student Photo</span>
              </CardTitle>
              <CardDescription>Upload a photo for the student (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={imagePreview || "/placeholder.svg"} alt="Student photo" />
                  <AvatarFallback className="text-2xl">
                    <User className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex space-x-2">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </div>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imagePreview && (
                    <Button type="button" variant="outline" size="sm" onClick={removeImage}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Maximum file size: 5MB
                  <br />
                  Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>Enter the student's personal details</CardDescription>
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
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="Enter student's age"
                    min="1"
                    max="25"
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+256 700 000 000"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    placeholder="+256 700 000 000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter student's address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medicalInfo">Medical Information</Label>
                <Textarea
                  id="medicalInfo"
                  value={formData.medicalInfo}
                  onChange={(e) => handleInputChange("medicalInfo", e.target.value)}
                  placeholder="Any medical conditions, allergies, or special needs"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Academic Information</span>
            </CardTitle>
            <CardDescription>Select the student's academic details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label htmlFor="term">Term</Label>
                <Select value={formData.termId} onValueChange={(value) => handleInputChange("termId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No term selected</SelectItem>
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
              <div>
                <Label htmlFor="parent">Parent/Guardian</Label>
                <div className="flex space-x-2">
                  <Select value={formData.parentId} onValueChange={(value) => handleInputChange("parentId", value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select parent" />
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
                  <Dialog open={isParentDialogOpen} onOpenChange={setIsParentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <UserPlus className="w-5 h-5" />
                          <span>Create New Parent</span>
                        </DialogTitle>
                        <DialogDescription>
                          Add a new parent/guardian to the system. They will be able to access the parent portal.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateParent} className="space-y-4">
                        <div>
                          <Label htmlFor="parentName">Full Name *</Label>
                          <Input
                            id="parentName"
                            value={parentFormData.name}
                            onChange={(e) => handleParentInputChange("name", e.target.value)}
                            placeholder="Enter parent's full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="parentEmail">Email Address *</Label>
                          <Input
                            id="parentEmail"
                            type="email"
                            value={parentFormData.email}
                            onChange={(e) => handleParentInputChange("email", e.target.value)}
                            placeholder="parent@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="parentPassword">Password *</Label>
                          <Input
                            id="parentPassword"
                            type="password"
                            value={parentFormData.password}
                            onChange={(e) => handleParentInputChange("password", e.target.value)}
                            placeholder="Enter password"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="parentPhone">Phone Number</Label>
                          <Input
                            id="parentPhone"
                            value={parentFormData.phone}
                            onChange={(e) => handleParentInputChange("phone", e.target.value)}
                            placeholder="+256 700 000 000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="parentAddress">Address</Label>
                          <Textarea
                            id="parentAddress"
                            value={parentFormData.address}
                            onChange={(e) => handleParentInputChange("address", e.target.value)}
                            placeholder="Enter parent's address"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsParentDialogOpen(false)}
                            disabled={isCreatingParent}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isCreatingParent}>
                            {isCreatingParent ? "Creating..." : "Create Parent"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Registering..." : "Register Student"}
          </Button>
        </div>
      </form>
    </div>
  )
}
