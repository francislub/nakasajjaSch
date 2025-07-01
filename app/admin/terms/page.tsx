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
import { Plus, Calendar, Users, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  academicYear: {
    id: string
    year: string
  }
  students?: any[]
  studentCount?: number
  _count?: {
    students: number
  }
}

interface AcademicYear {
  id: string
  year: string
}

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    academicYearId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [termsResponse, academicYearsResponse] = await Promise.all([
        fetch("/api/terms"),
        fetch("/api/academic-years"),
      ])

      if (!termsResponse.ok || !academicYearsResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const [termsData, academicYearsData] = await Promise.all([termsResponse.json(), academicYearsResponse.json()])

      setTerms(termsData || [])
      setAcademicYears(academicYearsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
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
      const url = editingTerm ? `/api/terms/${editingTerm.id}` : "/api/terms"
      const method = editingTerm ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Term ${editingTerm ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        setEditingTerm(null)
        setFormData({ name: "", startDate: "", endDate: "", academicYearId: "" })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save term")
      }
    } catch (error) {
      console.error("Error saving term:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save term",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (term: Term) => {
    setEditingTerm(term)
    setFormData({
      name: term.name,
      startDate: term.startDate.split("T")[0],
      endDate: term.endDate.split("T")[0],
      academicYearId: term.academicYear.id,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this term?")) return

    try {
      const response = await fetch(`/api/terms/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Term deleted successfully",
        })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete term")
      }
    } catch (error) {
      console.error("Error deleting term:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete term",
        variant: "destructive",
      })
    }
  }

  const getStudentCount = (term: Term): number => {
    if (term.studentCount !== undefined) return term.studentCount
    if (term._count?.students !== undefined) return term._count.students
    if (term.students?.length !== undefined) return term.students.length
    return 0
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
          <h1 className="text-3xl font-bold text-gray-900">Terms</h1>
          <p className="text-gray-600 mt-1">Manage academic terms</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTerm ? "Edit" : "Add"} Term</DialogTitle>
              <DialogDescription>
                {editingTerm ? "Update" : "Create a new"} term for an academic year.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Term Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Term 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingTerm(null)
                    setFormData({ name: "", startDate: "", endDate: "", academicYearId: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingTerm ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terms.map((term) => (
          <Card key={term.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">{term.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(term)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(term.id)}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-blue-600 font-medium">
                {term.academicYear?.year || "Unknown Academic Year"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {getStudentCount(term)} students enrolled
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {terms.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Terms</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first term.</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
