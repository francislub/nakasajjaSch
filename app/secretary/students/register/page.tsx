"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Class {
  id: string
  name: string
}

interface Term {
  id: string
  name: string
}

interface Parent {
  id: string
  name: string
  email: string
  children: Array<{
    id: string
    name: string
    class: { name: string }
  }>
}

export default function SecretaryRegisterStudentPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parentSearch, setParentSearch] = useState("")
  const [showNewParent, setShowNewParent] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [parentLoading, setParentLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    classId: "",
    termId: "",
    photo: "",
    parentId: "",
    // New parent fields
    parentName: "",
    parentEmail: "",
    parentPassword: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (parentSearch) {
      fetchParents()
    }
  }, [parentSearch])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [classesResponse, termsResponse] = await Promise.all([fetch("/api/classes"), fetch("/api/terms")])

      if (classesResponse.ok && termsResponse.ok) {
        const [classesData, termsData] = await Promise.all([classesResponse.json(), termsResponse.json()])
        setClasses(classesData.classes || classesData || [])
        setTerms(termsData.terms || termsData || [])
      }
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

  const fetchParents = async () => {
    if (!parentSearch.trim()) {
      setParents([])
      return
    }

    setParentLoading(true)
    try {
      const response = await fetch(`/api/users/parents?search=${encodeURIComponent(parentSearch.trim())}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setParents(data.parents || data || [])
      } else {
        console.error("Failed to fetch parents:", response.statusText)
        setParents([])
      }
    } catch (error) {
      console.error("Error fetching parents:", error)
      setParents([])
    } finally {
      setParentLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        createNewParent: showNewParent,
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student registered successfully",
        })
        router.push("/secretary/students")
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

  const selectParent = (parent: Parent) => {
    setFormData({ ...formData, parentId: parent.id })
    setShowNewParent(false)
    setParentSearch("")
  }

  const selectedParent = parents.find((p) => p.id === formData.parentId)

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register Student</h1>
          <p className="text-gray-600 mt-1">Add a new student to the system</p>
        </div>
      </div>

      <Card className="bg-white shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-orange-600" />
            <span>Student Registration Form</span>
          </CardTitle>
          <CardDescription>Fill in all required information to register a new student</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-orange-200 pb-2">
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter student's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
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
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
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
                  <Label htmlFor="classId">Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
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
                  <Label htmlFor="termId">Term *</Label>
                  <Select
                    value={formData.termId}
                    onValueChange={(value) => setFormData({ ...formData, termId: value })}
                  >
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
                  <Label htmlFor="photo">Photo URL (Optional)</Label>
                  <Input
                    id="photo"
                    placeholder="Enter photo URL"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Parent Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Parent Information</h3>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={!showNewParent ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowNewParent(false)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={showNewParent ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowNewParent(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </div>
              </div>

              {!showNewParent ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="parentSearch">Search for Parent</Label>
                    <Input
                      id="parentSearch"
                      placeholder="Type parent name or email to search..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                    />
                  </div>

                  {selectedParent && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">{selectedParent.name}</h4>
                          <p className="text-sm text-green-700">{selectedParent.email}</p>
                          {selectedParent.children.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedParent.children.map((child) => (
                                <Badge key={child.id} variant="secondary" className="text-xs">
                                  {child.name} ({child.class.name})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, parentId: "" })}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  {parentSearch && parents.length > 0 && !selectedParent && (
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {parents.map((parent) => (
                        <div
                          key={parent.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectParent(parent)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{parent.name}</h4>
                              <p className="text-sm text-gray-600">{parent.email}</p>
                              {parent.children.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parent.children.map((child) => (
                                    <Badge key={child.id} variant="outline" className="text-xs">
                                      {child.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="ghost">
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {parentSearch && parentLoading && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="animate-pulse">Searching...</div>
                    </div>
                  )}

                  {parentSearch && parents.length === 0 && !parentLoading && (
                    <div className="text-center py-4 text-gray-500">
                      No parents found matching "{parentSearch}". Try a different search term or create a new parent.
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Parent Name *</Label>
                    <Input
                      id="parentName"
                      placeholder="Enter parent's full name"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      required={showNewParent}
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
                      required={showNewParent}
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
                      required={showNewParent}
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </div>
                </div>
              )}
            </div>

            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-800">
                <strong>Note:</strong>{" "}
                {showNewParent
                  ? "A new parent account will be created with the provided credentials."
                  : "The student will be linked to the selected existing parent account."}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loading || (!showNewParent && !formData.parentId)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? "Registering..." : "Register Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
