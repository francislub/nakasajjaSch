"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Calendar, Edit, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NextTermSchedule {
  id: string
  academicYear: {
    id: string
    year: string
    isActive: boolean
  }
  term: {
    id: string
    name: string
  }
  nextTermStartDate: string | null
  nextTermEndDate: string | null
  createdAt: string
  updatedAt: string
}

interface AcademicYear {
  id: string
  year: string
  isActive: boolean
}

interface Term {
  id: string
  name: string
}

export default function NextTermSchedulePage() {
  const [schedules, setSchedules] = useState<NextTermSchedule[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<NextTermSchedule | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    academicYearId: "",
    termId: "",
    nextTermStartDate: "",
    nextTermEndDate: "",
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchSchedules(), fetchAcademicYears(), fetchTerms()])
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/next-term-schedules")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data || [])
      } else {
        console.error("Failed to fetch schedules")
        setSchedules([])
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
      setSchedules([])
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch("/api/academic-years")
      if (response.ok) {
        const data = await response.json()
        setAcademicYears(data || [])
      } else {
        console.error("Failed to fetch academic years")
        setAcademicYears([])
      }
    } catch (error) {
      console.error("Error fetching academic years:", error)
      setAcademicYears([])
    }
  }

  const fetchTerms = async () => {
    try {
      const response = await fetch("/api/terms")
      if (response.ok) {
        const data = await response.json()
        setTerms(data || [])
      } else {
        console.error("Failed to fetch terms")
        setTerms([])
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
      setTerms([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.academicYearId || !formData.termId) {
      toast({
        title: "Error",
        description: "Please select both academic year and term",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingSchedule ? `/api/next-term-schedules/${editingSchedule.id}` : "/api/next-term-schedules"
      const method = editingSchedule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nextTermStartDate: formData.nextTermStartDate || null,
          nextTermEndDate: formData.nextTermEndDate || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Next term schedule ${editingSchedule ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        setEditingSchedule(null)
        setFormData({ academicYearId: "", termId: "", nextTermStartDate: "", nextTermEndDate: "" })
        fetchSchedules()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save schedule")
      }
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save schedule",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (schedule: NextTermSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      academicYearId: schedule.academicYear.id,
      termId: schedule.term.id,
      nextTermStartDate: schedule.nextTermStartDate ? schedule.nextTermStartDate.split("T")[0] : "",
      nextTermEndDate: schedule.nextTermEndDate ? schedule.nextTermEndDate.split("T")[0] : "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    try {
      const response = await fetch(`/api/next-term-schedules/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Schedule deleted successfully",
        })
        fetchSchedules()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete schedule")
      }
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete schedule",
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
          <h1 className="text-3xl font-bold text-gray-900">Next Term Schedules</h1>
          <p className="text-gray-600 mt-1">Manage next term start and end dates for report cards</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? "Edit" : "Add"} Next Term Schedule</DialogTitle>
              <DialogDescription>
                {editingSchedule ? "Update" : "Create a new"} next term schedule for report cards.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select
                  value={formData.academicYearId}
                  onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year} {year.isActive && "(Active)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="term">Term</Label>
                <Select value={formData.termId} onValueChange={(value) => setFormData({ ...formData, termId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
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
                <Label htmlFor="nextTermStartDate">Next Term Start Date</Label>
                <Input
                  id="nextTermStartDate"
                  type="date"
                  value={formData.nextTermStartDate}
                  onChange={(e) => setFormData({ ...formData, nextTermStartDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nextTermEndDate">Next Term End Date</Label>
                <Input
                  id="nextTermEndDate"
                  type="date"
                  value={formData.nextTermEndDate}
                  onChange={(e) => setFormData({ ...formData, nextTermEndDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingSchedule(null)
                    setFormData({ academicYearId: "", termId: "", nextTermStartDate: "", nextTermEndDate: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editingSchedule ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Next Term Schedules</CardTitle>
          <CardDescription>Manage next term dates that appear on report cards</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schedules</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first next term schedule.</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Next Term Start Date</TableHead>
                  <TableHead>Next Term End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {schedule.academicYear.year}
                        {schedule.academicYear.isActive && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{schedule.term.name}</TableCell>
                    <TableCell>
                      {schedule.nextTermStartDate
                        ? new Date(schedule.nextTermStartDate).toLocaleDateString()
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      {schedule.nextTermEndDate ? new Date(schedule.nextTermEndDate).toLocaleDateString() : "Not set"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.nextTermStartDate && schedule.nextTermEndDate ? "default" : "secondary"}>
                        {schedule.nextTermStartDate && schedule.nextTermEndDate ? "Complete" : "Incomplete"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(schedule)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(schedule.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
