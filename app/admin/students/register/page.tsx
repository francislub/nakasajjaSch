"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Upload, Lock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Class {
  id: string
  name: string
}

interface Term {
  id: string
  name: string
}

export default function RegisterStudentPage() {
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    classId: "",
    termId: "",
    photo: "",
    parentName: "",
    parentEmail: "",
    parentPassword: "",
  })

  useEffect(() => {
    if (isCodeVerified) {
      fetchData()
    }
  }, [isCodeVerified])

  const handleCodeVerification = () => {
    if (accessCode === "12345") {
      setIsCodeVerified(true)
      toast({
        title: "Access Granted",
        description: "You can now register students",
      })
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid access code",
        variant: "destructive",
      })
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [classesResponse, termsResponse] = await Promise.all([fetch("/api/classes"), fetch("/api/terms")])

      const [classesData, termsData] = await Promise.all([classesResponse.json(), termsResponse.json()])

      setClasses(classesData)
      setTerms(termsData)
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
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student registered successfully",
        })
        router.push("/admin/students")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to register student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register student",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isCodeVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <Lock className="text-white w-10 h-10" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Access Required</CardTitle>
              <CardDescription className="text-blue-600 font-medium">
                Enter access code to register students
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                type="password"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button
              onClick={handleCodeVerification}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!accessCode}
            >
              Verify Access
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register Student</h1>
          <p className="text-gray-600 mt-1">Add a new student to the system</p>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Access Verified</span>
        </div>
      </div>

      <Card className="bg-white shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <span>Student Registration Form</span>
          </CardTitle>
          <CardDescription>Fill in all required information to register a new student</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-blue-200 pb-2">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter student's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    min="3"
                    max="18"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="classId">Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                  <Label htmlFor="termId">Term *</Label>
                  <Select
                    value={formData.termId}
                    onValueChange={(value) => setFormData({ ...formData, termId: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                  <Label htmlFor="photo">Photo URL (Optional)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="photo"
                      placeholder="Enter photo URL"
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-blue-200 pb-2">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input
                    id="parentName"
                    placeholder="Enter parent's full name"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="parentEmail">Parent Email *</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="Enter parent's email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="parentPassword">Parent Password *</Label>
                  <Input
                    id="parentPassword"
                    type="password"
                    placeholder="Create password for parent login"
                    value={formData.parentPassword}
                    onChange={(e) => setFormData({ ...formData, parentPassword: e.target.value })}
                    required
                    minLength={6}
                    className="border-gray-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Note:</strong> Parent login credentials will be created automatically. The parent will be able
                to log in using the provided email and password to view their child's progress.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                {isSubmitting ? "Registering..." : "Register Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
