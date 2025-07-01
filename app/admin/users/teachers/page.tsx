"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, User, Edit, Trash2, Eye, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Teacher {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  qualification?: string
  experience?: number
  isActive: boolean
  createdAt: string
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

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    experience: "",
  })

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    qualification: "",
    experience: "",
    isActive: true,
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers")
      if (response.ok) {
        const data = await response.json()
        setTeachers(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch teachers:", response.statusText)
        setTeachers([])
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch teachers",
        variant: "destructive",
      })
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher created successfully",
        })
        setIsDialogOpen(false)
        setFormData({ name: "", email: "", phone: "", address: "", qualification: "", experience: "" })
        fetchTeachers()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create teacher",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setEditFormData({
      name: teacher.name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      address: teacher.address || "",
      qualification: teacher.qualification || "",
      experience: teacher.experience?.toString() || "",
      isActive: teacher.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTeacher) return

    try {
      const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingTeacher(null)
        fetchTeachers()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update teacher",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm("Are you sure you want to delete this teacher? This will also remove all subject assignments.")) return

    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        })
        fetchTeachers()
      } else {
        throw new Error("Failed to delete teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      })
    }
  }

  const handleView = (teacher: Teacher) => {
    setViewingTeacher(teacher)
    setIsViewDialogOpen(true)
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
          <h1 className="text-3xl font-bold text-gray-900">Subject Teachers</h1>
          <p className="text-gray-600 mt-1">Manage teachers who teach specific subjects (no login access)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Subject Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account for subject teaching.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  placeholder="e.g., Bachelor of Education"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  placeholder="Enter years of experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Teacher
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter full name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                placeholder="Enter phone number"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-qualification">Qualification</Label>
              <Input
                id="edit-qualification"
                placeholder="e.g., Bachelor of Education"
                value={editFormData.qualification}
                onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-experience">Years of Experience</Label>
              <Input
                id="edit-experience"
                type="number"
                placeholder="Enter years of experience"
                value={editFormData.experience}
                onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Teacher
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>View teacher information and subject assignments.</DialogDescription>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-sm font-semibold">{viewingTeacher.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{viewingTeacher.email || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p className="text-sm">{viewingTeacher.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Experience</Label>
                  <p className="text-sm">
                    {viewingTeacher.experience ? `${viewingTeacher.experience} years` : "Not specified"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Qualification</Label>
                <p className="text-sm">{viewingTeacher.qualification || "Not provided"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Subject Assignments</Label>
                <div className="space-y-2 mt-2">
                  {viewingTeacher.subjectAssignments.length > 0 ? (
                    viewingTeacher.subjectAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{assignment.subject.name}</p>
                            <p className="text-xs text-gray-600">
                              {assignment.class.name} - {assignment.term.name} ({assignment.academicYear.year})
                            </p>
                          </div>
                          <Badge variant="outline">{assignment.subject.code}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No subject assignments</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Subject Teachers</span>
          </CardTitle>
          <CardDescription>Teachers assigned to specific subjects (no system login access)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Subject Assignments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {teacher.email && <p className="text-sm">{teacher.email}</p>}
                      {teacher.phone && <p className="text-sm text-gray-600">{teacher.phone}</p>}
                      {!teacher.email && !teacher.phone && (
                        <span className="text-gray-500 text-sm">No contact info</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{teacher.qualification || "Not specified"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {teacher.experience ? `${teacher.experience} years` : "Not specified"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{teacher.subjectAssignments.length}</span>
                      <span className="text-sm text-gray-600">subjects</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={teacher.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {teacher.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(teacher)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(teacher)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(teacher.id)}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {teachers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teachers</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first subject teacher.</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
