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
import { Plus, Users, Eye, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Parent {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  children?: {
    id: string
    name: string
    class?: {
      name: string
    }
  }[]
}

interface Student {
  id: string
  name: string
  class?: {
    id: string
    name: string
  }
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    childrenIds: [] as string[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [parentsResponse, studentsResponse] = await Promise.all([
        fetch("/api/users/parents"),
        fetch("/api/students"),
      ])

      const [parentsData, studentsData] = await Promise.all([parentsResponse.json(), studentsResponse.json()])

      setParents(parentsData)
      setStudents(studentsData)
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
      const response = await fetch("/api/users/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "PARENT",
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Parent created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create parent")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create parent",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParent) return

    try {
      const response = await fetch(`/api/users/parents/${selectedParent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Parent updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update parent")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update parent",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (parentId: string) => {
    try {
      const response = await fetch(`/api/users/parents/${parentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Parent deleted successfully",
        })
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete parent")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete parent",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      childrenIds: [],
    })
    setSelectedParent(null)
  }

  const openEditDialog = (parent: Parent) => {
    setSelectedParent(parent)
    setFormData({
      email: parent.email,
      password: "",
      name: parent.name,
      childrenIds: parent.children?.map((c) => c.id) || [],
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (parent: Parent) => {
    setSelectedParent(parent)
    setIsViewDialogOpen(true)
  }

  const filteredParents = parents.filter(
    (parent) =>
      parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get students without parents for assignment
  const availableStudents = students.filter(
    (student) => !parents.some((parent) => parent.children?.some((child) => child.id === student.id)),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
            Parents Management
          </h1>
          <p className="text-gray-600 mt-1">Manage parent accounts and child assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Parent</DialogTitle>
              <DialogDescription>Create a new parent account and assign children.</DialogDescription>
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
                <Label htmlFor="children">Assign Children (Optional)</Label>
                <Select
                  value={formData.childrenIds[0] || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      childrenIds: value ? [value] : [],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select child to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No child assignment</SelectItem>
                    {availableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} {student.class && `(${student.class.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Create Parent
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
            placeholder="Search parents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-3 h-3 mr-1" />
          {filteredParents.length} Parents
        </Badge>
      </div>

      {/* Parents Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Parent Accounts</span>
          </CardTitle>
          <CardDescription>Manage parent accounts for viewing their children's progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Children</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell className="font-medium">{parent.name}</TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>
                    {parent.children && parent.children.length > 0 ? (
                      <div className="space-y-1">
                        {parent.children.map((child) => (
                          <div key={child.id} className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {child.name}
                            </Badge>
                            {child.class && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">{child.class.name}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No children assigned</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(parent.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(parent)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(parent)}>
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
                              This action cannot be undone. This will permanently delete the parent account for{" "}
                              {parent.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(parent.id)}
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
            <DialogTitle>Edit Parent</DialogTitle>
            <DialogDescription>Update parent information and child assignments.</DialogDescription>
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
              <Label htmlFor="edit-children">Assign Children</Label>
              <Select
                value={formData.childrenIds[0] || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    childrenIds: value ? [value] : [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select child to assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No child assignment</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.class && `(${student.class.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Update Parent
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parent Details</DialogTitle>
            <DialogDescription>View parent information and children.</DialogDescription>
          </DialogHeader>
          {selectedParent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                <p className="text-sm font-medium">{selectedParent.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{selectedParent.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Role</Label>
                <Badge className="bg-purple-100 text-purple-800">
                  <Users className="w-3 h-3 mr-1" />
                  Parent
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Children</Label>
                {selectedParent.children && selectedParent.children.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {selectedParent.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{child.name}</span>
                        {child.class && (
                          <Badge variant="outline" className="text-xs">
                            {child.class.name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No children assigned</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Access Permissions</Label>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• View child's academic progress</li>
                  <li>• Access attendance records</li>
                  <li>• Download report cards</li>
                  <li>• Receive notifications</li>
                </ul>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm">{new Date(selectedParent.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
