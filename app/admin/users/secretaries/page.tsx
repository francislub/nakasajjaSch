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
import { Plus, FileText, Eye, Edit, Trash2, Search, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Secretary {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function SecretariesPage() {
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedSecretary, setSelectedSecretary] = useState<Secretary | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch("/api/users/secretaries")
      const data = await response.json()
      setSecretaries(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch secretaries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/users/secretaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "SECRETARY",
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Secretary created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create secretary")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create secretary",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSecretary) return

    try {
      const response = await fetch(`/api/users/secretaries/${selectedSecretary.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Secretary updated successfully",
        })
        setIsEditDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update secretary")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update secretary",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (secretaryId: string) => {
    try {
      const response = await fetch(`/api/users/secretaries/${secretaryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Secretary deleted successfully",
        })
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete secretary")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete secretary",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
    })
    setSelectedSecretary(null)
  }

  const openEditDialog = (secretary: Secretary) => {
    setSelectedSecretary(secretary)
    setFormData({
      email: secretary.email,
      password: "",
      name: secretary.name,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (secretary: Secretary) => {
    setSelectedSecretary(secretary)
    setIsViewDialogOpen(true)
  }

  const filteredSecretaries = secretaries.filter(
    (secretary) =>
      secretary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      secretary.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-orange-600" />
            Secretaries Management
          </h1>
          <p className="text-gray-600 mt-1">Manage administrative staff accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Secretary
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Secretary</DialogTitle>
              <DialogDescription>Create a new secretary account for administrative tasks.</DialogDescription>
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
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  Create Secretary
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
            placeholder="Search secretaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-3 h-3 mr-1" />
          {filteredSecretaries.length} Secretaries
        </Badge>
      </div>

      {/* Secretaries Table */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Administrative Staff</span>
          </CardTitle>
          <CardDescription>Manage secretary accounts for student registration and data entry</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSecretaries.map((secretary) => (
                <TableRow key={secretary.id}>
                  <TableCell className="font-medium">{secretary.name}</TableCell>
                  <TableCell>{secretary.email}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      <FileText className="w-3 h-3 mr-1" />
                      Secretary
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(secretary.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(secretary)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(secretary)}>
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
                              This action cannot be undone. This will permanently delete the secretary account for{" "}
                              {secretary.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(secretary.id)}
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
            <DialogTitle>Edit Secretary</DialogTitle>
            <DialogDescription>Update secretary information.</DialogDescription>
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                Update Secretary
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Secretary Details</DialogTitle>
            <DialogDescription>View secretary information.</DialogDescription>
          </DialogHeader>
          {selectedSecretary && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                <p className="text-sm font-medium">{selectedSecretary.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{selectedSecretary.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Role</Label>
                <Badge className="bg-orange-100 text-orange-800">
                  <FileText className="w-3 h-3 mr-1" />
                  Secretary
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Responsibilities</Label>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Student registration and data entry</li>
                  <li>• Administrative document management</li>
                  <li>• Report generation and distribution</li>
                  <li>• Communication with parents and staff</li>
                </ul>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="text-sm">{new Date(selectedSecretary.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
