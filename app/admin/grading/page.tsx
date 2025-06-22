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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Award, Edit, Trash2 } from "lucide-react"
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
      const response = await fetch("/api/grading-system")
      const data = await response.json()
      setGradingSystem(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch grading system",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/grading-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Grading entry created successfully",
        })
        setIsDialogOpen(false)
        setFormData({ grade: "", minMark: "", maxMark: "", comment: "" })
        fetchGradingSystem()
      } else {
        throw new Error("Failed to create grading entry")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create grading entry",
        variant: "destructive",
      })
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A":
        return "bg-green-100 text-green-800"
      case "B":
        return "bg-blue-100 text-blue-800"
      case "C":
        return "bg-yellow-100 text-yellow-800"
      case "D":
        return "bg-orange-100 text-orange-800"
      case "F":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Grade</DialogTitle>
              <DialogDescription>Create a new grade range with comment.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  placeholder="e.g., A"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  required
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create
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
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {gradingSystem.length === 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grading System</h3>
            <p className="text-gray-600 mb-4">Set up your grading system to evaluate student performance.</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Grade
            </Button>
          </CardContent>
        </Card>
      )}

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
    </div>
  )
}
