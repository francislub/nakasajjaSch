"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Calendar, Users, BookOpen, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AcademicYear {
  id: string
  year: string
  startDate: string
  endDate: string
  isActive: boolean
  terms: any[]
  classes: any[]
  students: any[]
}

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    year: "",
    startDate: "",
    endDate: "",
    isActive: false,
  })

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch("/api/academic-years")
      const data = await response.json()
      setAcademicYears(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingYear ? `/api/academic-years/${editingYear.id}` : "/api/academic-years"
      const method = editingYear ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Academic year ${editingYear ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        setEditingYear(null)
        setFormData({ year: "", startDate: "", endDate: "", isActive: false })
        fetchAcademicYears()
      } else {
        throw new Error("Failed to save academic year")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save academic year",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year)
    setFormData({
      year: year.year,
      startDate: year.startDate.split("T")[0],
      endDate: year.endDate.split("T")[0],
      isActive: year.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return

    try {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Academic year deleted successfully",
        })
        fetchAcademicYears()
      } else {
        throw new Error("Failed to delete academic year")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete academic year",
        variant: "destructive",
      })
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Academic Years</h1>
          <p className="text-gray-600 mt-1">Manage academic years and terms</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingYear ? "Edit" : "Add"} Academic Year</DialogTitle>
              <DialogDescription>
                {editingYear ? "Update" : "Create a new"} academic year for the school.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="year">Academic Year</Label>
                <Input
                  id="year"
                  placeholder="e.g., 2024-2025"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Set as Active Academic Year</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingYear ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {academicYears.map((year) => (
          <Card key={year.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{year.year}</CardTitle>
                {year.isActive && <Badge className="bg-green-100 text-green-800">Active</Badge>}
              </div>
              <CardDescription>
                {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Terms</p>
                  <p className="font-semibold text-gray-900">{year.terms.length}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-1">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Classes</p>
                  <p className="font-semibold text-gray-900">{year.classes.length}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-1">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="font-semibold text-gray-900">{year.students.length}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(year)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(year.id)}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {academicYears.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Academic Years</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first academic year.</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Academic Year
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
