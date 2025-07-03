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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Plus,
  Users,
  UserCheck,
  Shield,
  FileText,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  lastLogin?: string
  class?: {
    id: string
    name: string
  }
  children?: {
    id: string
    name: string
    class?: {
      name: string
    }
  }[]
  assignedSubjects?: {
    id: string
    name: string
    code: string
  }[]
}

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  code: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("ALL")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "ADMIN",
    classId: "",
    subjectIds: [] as string[],
  })

  const [editFormData, setEditFormData] = useState({
    id: "",
    email: "",
    name: "",
    phone: "",
    role: "ADMIN",
    classId: "",
    subjectIds: [] as string[],
    isActive: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersResponse, classesResponse, subjectsResponse] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/classes"),
        fetch("/api/subjects"),
      ])

      const [usersData, classesData, subjectsData] = await Promise.all([
        usersResponse.json(),
        classesResponse.json(),
        subjectsResponse.json(),
      ])

      setUsers(usersData)
      setClasses(classesData)
      setSubjects(subjectsData)
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
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully",
        })
        setIsDialogOpen(false)
        setFormData({
          email: "",
          password: "",
          name: "",
          phone: "",
          role: "ADMIN",
          classId: "",
          subjectIds: [],
        })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create user")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/users/${editFormData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update user")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete user")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      role: user.role,
      classId: user.class?.id || "",
      subjectIds: user.assignedSubjects?.map((s) => s.id) || [],
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
      case "HEADTEACHER":
        return <Shield className="w-4 h-4" />
      case "CLASS_TEACHER":
        return <UserCheck className="w-4 h-4" />
      case "SECRETARY":
        return <FileText className="w-4 h-4" />
      case "PARENT":
        return <Users className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
      case "HEADTEACHER":
        return "bg-red-100 text-red-800"
      case "CLASS_TEACHER":
        return "bg-green-100 text-green-800"
      case "SECRETARY":
        return "bg-orange-100 text-orange-800"
      case "PARENT":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filterUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = selectedRole === "ALL" || user.role === selectedRole
      return matchesSearch && matchesRole
    })
  }

  const getUserStats = () => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "ADMIN" || u.role === "HEADTEACHER").length,
      teachers: users.filter((u) => u.role === "CLASS_TEACHER").length,
      secretaries: users.filter((u) => u.role === "SECRETARY").length,
      parents: users.filter((u) => u.role === "PARENT").length,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = getUserStats()
  const filteredUsers = filterUsers()

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>Create a new user account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="HEADTEACHER">Head Teacher</SelectItem>
                    <SelectItem value="CLASS_TEACHER">Class Teacher</SelectItem>
                    <SelectItem value="SECRETARY">Secretary</SelectItem>
                    <SelectItem value="PARENT">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              {formData.role === "CLASS_TEACHER" && (
                <div>
                  <Label htmlFor="classId">Assign to Class</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classData) => (
                        <SelectItem key={classData.id} value={classData.id}>
                          {classData.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Secretaries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.secretaries}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.parents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrators</SelectItem>
                <SelectItem value="HEADTEACHER">Head Teachers</SelectItem>
                <SelectItem value="CLASS_TEACHER">Class Teachers</SelectItem>
                <SelectItem value="SECRETARY">Secretaries</SelectItem>
                <SelectItem value="PARENT">Parents</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{filteredUsers.length} users found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>All Users</span>
          </CardTitle>
          <CardDescription>Manage all system users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{user.role.replace("_", " ")}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.children && user.children.length > 0 ? (
                      <div className="space-y-1">
                        {user.children.map((child) => (
                          <Badge key={child.id} variant="outline" className="mr-1 text-xs">
                            {child.name} {child.class ? `(${child.class.name})` : ""}
                          </Badge>
                        ))}
                      </div>
                    ) : user.assignedSubjects && user.assignedSubjects.length > 0 ? (
                      <div className="space-y-1">
                        {user.assignedSubjects.slice(0, 2).map((subject) => (
                          <Badge key={subject.id} variant="outline" className="mr-1 text-xs">
                            {subject.code}
                          </Badge>
                        ))}
                        {user.assignedSubjects.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.assignedSubjects.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(user)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(user)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and settings.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                placeholder="Enter full name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                placeholder="Enter email address"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                type="tel"
                placeholder="Enter phone number"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="HEADTEACHER">Head Teacher</SelectItem>
                  <SelectItem value="CLASS_TEACHER">Class Teacher</SelectItem>
                  <SelectItem value="SECRETARY">Secretary</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editFormData.role === "CLASS_TEACHER" && (
              <div>
                <Label htmlFor="editClassId">Assign to Class</Label>
                <Select
                  value={editFormData.classId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, classId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No class assigned</SelectItem>
                    {classes.map((classData) => (
                      <SelectItem key={classData.id} value={classData.id}>
                        {classData.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="editIsActive">Active User</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-lg">
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {getRoleIcon(selectedUser.role)}
                    <span className="ml-1">{selectedUser.role.replace("_", " ")}</span>
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="mt-1">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge
                    className={
                      selectedUser.isActive ? "bg-green-100 text-green-800 mt-1" : "bg-red-100 text-red-800 mt-1"
                    }
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p className="mt-1">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Login</Label>
                  <p className="mt-1">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : "Never"}
                  </p>
                </div>
              </div>

              {selectedUser.class && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned Class</Label>
                  <Badge className="bg-blue-100 text-blue-800 mt-1">{selectedUser.class.name}</Badge>
                </div>
              )}

              {selectedUser.children && selectedUser.children.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Children</Label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{child.name}</span>
                        {child.class && <Badge variant="outline">{child.class.name}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.assignedSubjects && selectedUser.assignedSubjects.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned Subjects</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.assignedSubjects.map((subject) => (
                      <Badge key={subject.id} variant="outline">
                        {subject.name} ({subject.code})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone and will remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
