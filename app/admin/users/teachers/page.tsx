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
import { Plus, UserCheck, Eye, Edit, Trash2, Search, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Teacher {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  assignedClasses?: {
    id: string
    name: string
  }[]
}

interface Class {
  id: string
  name: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    classIds: [] as string[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teachersResponse, classesResponse] = await Promise.all([
        fetch("/api/users/teachers"),
        fetch("/api/classes"),
      ])

      const [teachersData, classesData] = await Promise.all([teachersResponse.json(), classesResponse.json()])

      setTeachers(teachersData)
      setClasses(classesData)
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
      const response = await fetch("/api/users/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "CLASS_TEACHER",
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create teacher",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return

    try {
      const response = await fetch(`/api/users/teachers/${selectedTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update teacher")
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
    try {
      const response = await fetch(`/api/users/teachers/${teacherId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        })
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete teacher")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete teacher",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      classIds: [],
    })
    setSelectedTeacher(null)
  }

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setFormData({
      email: teacher.email,
      password: "",
      name: teacher.name,
      classIds: teacher.assignedClasses?.map((c) => c.id) || [],
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsViewDialogOpen(true)
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-green-600" />
            Teachers Management
          </h1>
          <p className="text-gray-600 mt-1">Manage class teachers and their assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account and assign classes.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="classes">Assign Classes (Optional)</Label>
                <Select
                  value={formData.classIds[0] || ""}
                  onValueChange={(value) => setFormData({ ...formData, classIds: value ? [value] : [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class assignment</SelectItem>
                    {classes.map((classData) => (
                      <SelectItem key={classData.id} value={classData.id}>
                        {classData.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Create Teacher
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-3 h-3 mr-1" />
          {filteredTeachers.length} Teachers
        </Badge>
      </div>

      {/* Teachers Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span>Class Teachers</span>
          </CardTitle>
          <CardDescription>Manage teacher accounts and class assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Classes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses.map((classData) => (
                          <Badge key={classData.id} className="bg-blue-100 text-blue-800">
                            {classData.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No classes assigned</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(teacher.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(teacher)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(teacher)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the teacher account for{" "}
                              {teacher.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(teacher.id)}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information and class assignments.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (Optional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-classes">Assign Classes</Label>
              <Select
                value={formData.classIds[0] || ""}
                onValueChange={(value) => setFormData({ ...formData, classIds: value ? [value] : [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class to assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class assignment</SelectItem>
                  {classes.map((classData) => (
                    <SelectItem key={classData.id} value={classData.id}>
                      {classData.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Update Teacher
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>View teacher information and assignments.</DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                <p className="text-sm font-medium">{selectedTeacher.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{selectedTeacher.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Role</Label>
                <Badge className="bg-green-100 text-green-800">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Class Teacher
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Assigned Classes</Label>
                {selectedTeacher.assignedClasses && selectedTeacher.assignedClasses.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTeacher.assignedClasses.map((classData) => (
                      <Badge key={classData.id} variant="outline">
                        {classData.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No classes assigned</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm">{new Date(selectedTeacher.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
