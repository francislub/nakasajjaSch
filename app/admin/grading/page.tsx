"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Award, Edit, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GradingEntry {
  id: string
  grade: string
  minMark: number
  maxMark: number
  comment: string
  createdAt: string
}

export default function GradingPage() {
  const [gradingSystem, setGradingSystem] = useState<GradingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<GradingEntry | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    grade: "",
    minMark: "",
    maxMark: "",
    comment: "",
  })

  useEffect(() => {
    fetchGradingSystem()
  }, [])

  const fetchGradingSystem = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/grading-system")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setGradingSystem(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching grading system:", error)
      toast({
        title: "Error",
        description: "Failed to fetch grading system",
        variant: "destructive",
      })
      setGradingSystem([])
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const minMark = Number.parseFloat(formData.minMark)
    const maxMark = Number.parseFloat(formData.maxMark)

    if (!formData.grade.trim()) {
      toast({
        title: "Validation Error",
        description: "Grade is required",
        variant: "destructive",
      })
      return false
    }

    if (isNaN(minMark) || isNaN(maxMark)) {
      toast({
        title: "Validation Error",
        description: "Min and Max marks must be valid numbers",
        variant: "destructive",
      })
      return false
    }

    if (minMark >= maxMark) {
      toast({
        title: "Validation Error",
        description: "Minimum mark must be less than maximum mark",
        variant: "destructive",
      })
      return false
    }

    if (minMark < 0 || maxMark > 100) {
      toast({
        title: "Validation Error",
        description: "Marks must be between 0 and 100",
        variant: "destructive",
      })
      return false
    }

    // Check for overlapping ranges (excluding current entry when editing)
    const existingEntries = editingEntry ? gradingSystem.filter((entry) => entry.id !== editingEntry.id) : gradingSystem

    const hasOverlap = existingEntries.some((entry) => {
      return (
        (minMark >= entry.minMark && minMark <= entry.maxMark) ||
        (maxMark >= entry.minMark && maxMark <= entry.maxMark) ||
        (minMark <= entry.minMark && maxMark >= entry.maxMark)
      )
    })

    if (hasOverlap) {
      toast({
        title: "Validation Error",
        description: "Mark range overlaps with existing grade",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const url = editingEntry ? `/api/grading-system/${editingEntry.id}` : "/api/grading-system"
      const method = editingEntry ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: formData.grade.toUpperCase(),
          minMark: Number.parseFloat(formData.minMark),
          maxMark: Number.parseFloat(formData.maxMark),
          comment: formData.comment,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Grading entry ${editingEntry ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchGradingSystem()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${editingEntry ? "update" : "create"} grading entry`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Failed to ${editingEntry ? "update" : "create"} grading entry`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (entry: GradingEntry) => {
    setEditingEntry(entry)
    setFormData({
      grade: entry.grade,
      minMark: entry.minMark.toString(),
      maxMark: entry.maxMark.toString(),
      comment: entry.comment,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/grading-system/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Grading entry deleted successfully",
        })
        fetchGradingSystem()
      } else {
        throw new Error("Failed to delete grading entry")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete grading entry",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ grade: "", minMark: "", maxMark: "", comment: "" })
    setEditingEntry(null)
  }

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A":
        return "bg-green-100 text-green-800 border-green-200"
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "D":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "F":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
          <h1 className="text-3xl font-bold text-gray-900">Grading System</h1>
          <p className="text-gray-600 mt-1">Configure grade ranges and comments</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Grade" : "Add Grade"}</DialogTitle>
              <DialogDescription>
                {editingEntry ? "Update the grade range and comment." : "Create a new grade range with comment."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  placeholder="e.g., A"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value.toUpperCase() })}
                  required
                  maxLength={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minMark">Minimum Mark</Label>
                  <Input
                    id="minMark"
                    type="number"
                    placeholder="e.g., 85"
                    value={formData.minMark}
                    onChange={(e) => setFormData({ ...formData, minMark: e.target.value })}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxMark">Maximum Mark</Label>
                  <Input
                    id="maxMark"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.maxMark}
                    onChange={(e) => setFormData({ ...formData, maxMark: e.target.value })}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="e.g., Very Good"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? "Saving..." : editingEntry ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span>Grade Configuration</span>
          </CardTitle>
          <CardDescription>Define grade ranges and their corresponding comments</CardDescription>
        </CardHeader>
        <CardContent>
          {gradingSystem.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Mark Range</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradingSystem.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge className={getGradeColor(entry.grade)}>{entry.grade}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.minMark} - {entry.maxMark}
                    </TableCell>
                    <TableCell>{entry.comment}</TableCell>
                    <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the grade "{entry.grade}" ({entry.minMark}-{entry.maxMark}
                                ). This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(entry.id)}
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
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grading System</h3>
              <p className="text-gray-600 mb-4">Set up your grading system to evaluate student performance.</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Grade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Card */}
      {gradingSystem.length > 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Grading Scale Preview</CardTitle>
            <CardDescription>How the grading system will appear on report cards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradingSystem.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border border-gray-200 rounded-lg text-center hover:border-blue-300 transition-colors"
                >
                  <Badge className={`${getGradeColor(entry.grade)} text-lg px-3 py-1 mb-2`}>{entry.grade}</Badge>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {entry.minMark} - {entry.maxMark} marks
                  </p>
                  <p className="text-sm text-gray-600">{entry.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Warning */}
      {gradingSystem.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Grading System Guidelines</h4>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  <li>• Ensure all mark ranges cover the full spectrum (0-100)</li>
                  <li>• Avoid overlapping grade ranges</li>
                  <li>• Consider having consistent grade intervals</li>
                  <li>• Test the system with sample marks before finalizing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
