"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BookOpen,
  Save,
  FileSpreadsheet,
  Edit,
  RefreshCw,
  BarChart3,
  Users,
  Calendar,
  Download,
  TrendingUp,
  PieChart,
  User,
  GraduationCap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Student {
  id: string
  name: string
  photo?: string
  registrationNumber?: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Term {
  id: string
  name: string
}

interface GradingSystem {
  id: string
  grade: string
  minMark: number
  maxMark: number
  comment: string
}

interface Mark {
  id: string
  studentId: string
  subjectId: string
  termId: string
  bot?: number
  midterm?: number
  eot?: number
  total?: number
  grade: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    name: string
    photo?: string
  }
  subject: {
    id: string
    name: string
    code: string
  }
  term: {
    id: string
    name: string
  }
  createdBy?: {
    name: string
  }
}

interface StudentMark {
  studentId: string
  studentName: string
  mark: number
  grade: string
  hasExistingMark: boolean
  existingMarkId?: string
}

const EXAM_TYPES = [
  { value: "BOT", label: "Beginning of Term", color: "bg-blue-100 text-blue-800", shortName: "BOT" },
  { value: "MOT", label: "Middle of Term", color: "bg-orange-100 text-orange-800", shortName: "MOT" },
  { value: "EOT", label: "End of Term", color: "bg-green-100 text-green-800", shortName: "EOT" },
]

const EXPORT_TYPES = [
  {
    id: "subject_examtype",
    name: "Subject + Exam Type",
    description: "Export marks for specific subject and exam type",
    icon: BookOpen,
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "subject_all_exams",
    name: "Subject (All Exams)",
    description: "Export all exam types for a specific subject",
    icon: FileSpreadsheet,
    color: "bg-green-50 border-green-200",
  },
  {
    id: "all_subjects_all_exams",
    name: "Complete Class Report",
    description: "Export all subjects and exam types for the class",
    icon: GraduationCap,
    color: "bg-purple-50 border-purple-200",
  },
  {
    id: "student_report",
    name: "Individual Student Report",
    description: "Detailed report for a specific student",
    icon: User,
    color: "bg-orange-50 border-orange-200",
  },
  {
    id: "class_summary",
    name: "Class Performance Summary",
    description: "Overview of all students' performance",
    icon: Users,
    color: "bg-indigo-50 border-indigo-200",
  },
  {
    id: "performance_analysis",
    name: "Performance Analysis",
    description: "Advanced analytics and trends",
    icon: TrendingUp,
    color: "bg-red-50 border-red-200",
  },
  {
    id: "grade_distribution",
    name: "Grade Distribution",
    description: "Grade distribution and statistics",
    icon: PieChart,
    color: "bg-yellow-50 border-yellow-200",
  },
]

export default function TeacherMarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [gradingSystem, setGradingSystem] = useState<GradingSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedExamType, setSelectedExamType] = useState("")

  // Entry state
  const [entryMarks, setEntryMarks] = useState<Record<string, StudentMark>>({})
  const [activeTab, setActiveTab] = useState("entry")

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedExportType, setSelectedExportType] = useState("")
  const [exportFilters, setExportFilters] = useState({
    subjectId: "all",
    termId: "all",
    examType: "all",
    studentId: "all",
    format: "csv",
    includeStats: true,
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchClassData()
  }, [])

  useEffect(() => {
    if (selectedSubject || selectedTerm) {
      fetchMarks()
    }
  }, [selectedSubject, selectedTerm])

  useEffect(() => {
    if (selectedSubject && selectedTerm && selectedExamType && students.length > 0) {
      initializeEntryMarks()
    }
  }, [selectedSubject, selectedTerm, selectedExamType, students, marks])

  const fetchClassData = async () => {
    try {
      const response = await fetch("/api/teacher/class-data")
      const data = await response.json()

      if (response.ok) {
        setStudents(data.students || [])
        setSubjects(data.subjects || [])
        setTerms(data.terms || [])
        setGradingSystem(data.gradingSystem || [])
      } else {
        throw new Error(data.error || "Failed to fetch class data")
      }
    } catch (error) {
      console.error("Error fetching class data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch class data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMarks = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedSubject) params.append("subjectId", selectedSubject)
      if (selectedTerm) params.append("termId", selectedTerm)

      const response = await fetch(`/api/teacher/marks?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMarks(Array.isArray(data) ? data : [])
      } else {
        throw new Error(data.error || "Failed to fetch marks")
      }
    } catch (error) {
      console.error("Error fetching marks:", error)
      setMarks([])
    }
  }

  const initializeEntryMarks = () => {
    const initialMarks: Record<string, StudentMark> = {}

    students.forEach((student) => {
      const existingMark = marks.find(
        (m) => m.studentId === student.id && m.subjectId === selectedSubject && m.termId === selectedTerm,
      )

      let currentMark = 0
      if (existingMark) {
        switch (selectedExamType) {
          case "BOT":
            currentMark = existingMark.bot || 0
            break
          case "MOT":
            currentMark = existingMark.midterm || 0
            break
          case "EOT":
            currentMark = existingMark.eot || 0
            break
        }
      }

      initialMarks[student.id] = {
        studentId: student.id,
        studentName: student.name,
        mark: currentMark,
        grade: calculateGrade(currentMark).grade,
        hasExistingMark: currentMark > 0,
        existingMarkId: existingMark?.id,
      }
    })

    setEntryMarks(initialMarks)
  }

  const calculateGrade = (mark: number): { grade: string; comment: string } => {
    for (const gradeSystem of gradingSystem) {
      if (mark >= (gradeSystem.minMark || 0) && mark <= (gradeSystem.maxMark || 100)) {
        return { grade: gradeSystem.grade, comment: gradeSystem.comment }
      }
    }
    return { grade: "F", comment: "Fail" }
  }

  const updateStudentMark = (studentId: string, mark: number) => {
    setEntryMarks((prev) => {
      const updated = { ...prev }
      if (updated[studentId]) {
        const { grade } = calculateGrade(mark)
        updated[studentId] = {
          ...updated[studentId],
          mark,
          grade,
        }
      }
      return updated
    })
  }

  const handleSaveMarks = async () => {
    if (!selectedSubject || !selectedTerm || !selectedExamType) {
      toast({
        title: "Error",
        description: "Please select subject, term, and exam type",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const marksToSave = Object.values(entryMarks).map((mark) => ({
        studentId: mark.studentId,
        subjectId: selectedSubject,
        termId: selectedTerm,
        mark: mark.mark,
      }))

      const response = await fetch("/api/teacher/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: marksToSave, examType: selectedExamType }),
      })

      if (response.ok) {
        const savedMarks = await response.json()
        toast({
          title: "Success",
          description: `${selectedExamType} marks saved for ${savedMarks.length} students`,
        })
        fetchMarks() // Refresh marks
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save marks")
      }
    } catch (error) {
      console.error("Save marks error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save marks",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    if (!selectedExportType) {
      toast({
        title: "Error",
        description: "Please select an export type",
        variant: "destructive",
      })
      return
    }

    setExporting(true)
    try {
      const exportData = {
        exportType: selectedExportType,
        ...exportFilters,
      }

      const response = await fetch("/api/teacher/marks/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      })

      if (response.ok) {
        const result = await response.json()
        downloadFile(result, selectedExportType)

        toast({
          title: "Success",
          description: "Export completed successfully",
        })
        setExportDialogOpen(false)
      } else {
        throw new Error("Failed to export data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const downloadFile = (result: any, exportType: string) => {
    const { data, metadata, format } = result

    let content = ""
    let filename = `marks_export_${exportType}_${new Date().toISOString().split("T")[0]}`

    if (format === "csv") {
      content = convertToCSV(data, exportType)
      filename += ".csv"
    } else {
      content = JSON.stringify({ data, metadata }, null, 2)
      filename += ".json"
    }

    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any[], exportType: string) => {
    if (!data || data.length === 0) return ""

    let headers: string[] = []
    let rows: string[][] = []

    switch (exportType) {
      case "subject_examtype":
        headers = [
          "Student Name",
          "Registration Number",
          "Subject",
          "Term",
          "Exam Type",
          "Mark",
          "Grade",
          "Total",
          "Last Updated",
        ]
        rows = data.map((item) => [
          item.studentName || "",
          item.registrationNumber || "",
          item.subjectName || "",
          item.termName || "",
          item.examType || "",
          item.mark?.toString() || "0",
          item.grade || "",
          item.total?.toString() || "0",
          item.lastUpdated || "",
        ])
        break

      case "subject_all_exams":
        headers = ["Student Name", "Registration Number", "Subject", "Term", "BOT", "MOT", "EOT", "Total", "Grade"]
        rows = data.map((item) => [
          item.studentName || "",
          item.registrationNumber || "",
          item.subjectName || "",
          item.termName || "",
          item.bot?.toString() || "0",
          item.mot?.toString() || "0",
          item.eot?.toString() || "0",
          item.total?.toString() || "0",
          item.grade || "",
        ])
        break

      case "class_summary":
        headers = [
          "Student Name",
          "Registration Number",
          "Total Subjects",
          "Average Score",
          "Highest Score",
          "Lowest Score",
          "Grade",
          "Status",
        ]
        rows = data.map((item) => [
          item.studentName || "",
          item.registrationNumber || "",
          item.totalSubjects?.toString() || "0",
          item.averageScore?.toString() || "0",
          item.highestScore?.toString() || "0",
          item.lowestScore?.toString() || "0",
          item.grade || "",
          item.status || "",
        ])
        break

      default:
        // Default format
        if (data.length > 0) {
          headers = Object.keys(data[0])
          rows = data.map((item) => headers.map((header) => item[header]?.toString() || ""))
        }
    }

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    return csvContent
  }

  const getExamTypeColor = (examType: string) => {
    const exam = EXAM_TYPES.find((e) => e.value === examType)
    return exam?.color || "bg-gray-100 text-gray-800"
  }

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
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

  // Group marks for display
  const marksByStudent = marks.reduce(
    (acc, mark) => {
      const studentName = mark.student.name
      if (!acc[studentName]) {
        acc[studentName] = []
      }
      acc[studentName].push(mark)
      return acc
    },
    {} as Record<string, Mark[]>,
  )

  const marksBySubject = marks.reduce(
    (acc, mark) => {
      const subjectName = mark.subject.name
      if (!acc[subjectName]) {
        acc[subjectName] = []
      }
      acc[subjectName].push(mark)
      return acc
    },
    {} as Record<string, Mark[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Term-Based Marks Management</h1>
          <p className="text-gray-600 mt-1">
            BOT • MOT • EOT Assessment System • {students.length} students • {subjects.length} subjects
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span>Advanced Export Options</span>
                </DialogTitle>
                <DialogDescription>
                  Choose from various export formats and filtering options to get exactly the data you need.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Export Type Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Export Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EXPORT_TYPES.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <div
                          key={type.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedExportType === type.id
                              ? "border-green-500 bg-green-50"
                              : `${type.color} hover:border-gray-300`
                          }`}
                          onClick={() => setSelectedExportType(type.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <IconComponent className="w-5 h-5 mt-1 text-gray-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">{type.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Export Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="export-subject">Subject Filter</Label>
                    <Select
                      value={exportFilters.subjectId}
                      onValueChange={(value) => setExportFilters((prev) => ({ ...prev, subjectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="export-term">Term Filter</Label>
                    <Select
                      value={exportFilters.termId}
                      onValueChange={(value) => setExportFilters((prev) => ({ ...prev, termId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        {terms.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="export-examtype">Exam Type Filter</Label>
                    <Select
                      value={exportFilters.examType}
                      onValueChange={(value) => setExportFilters((prev) => ({ ...prev, examType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Exam Types</SelectItem>
                        {EXAM_TYPES.map((exam) => (
                          <SelectItem key={exam.value} value={exam.value}>
                            {exam.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="export-student">Student Filter</Label>
                    <Select
                      value={exportFilters.studentId}
                      onValueChange={(value) => setExportFilters((prev) => ({ ...prev, studentId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Export Options</Label>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="csv-format"
                        name="format"
                        value="csv"
                        checked={exportFilters.format === "csv"}
                        onChange={(e) => setExportFilters((prev) => ({ ...prev, format: e.target.value }))}
                        className="text-green-600"
                      />
                      <Label htmlFor="csv-format">CSV Format</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="json-format"
                        name="format"
                        value="json"
                        checked={exportFilters.format === "json"}
                        onChange={(e) => setExportFilters((prev) => ({ ...prev, format: e.target.value }))}
                        className="text-green-600"
                      />
                      <Label htmlFor="json-format">JSON Format</Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-stats"
                      checked={exportFilters.includeStats}
                      onCheckedChange={(checked) => setExportFilters((prev) => ({ ...prev, includeStats: !!checked }))}
                    />
                    <Label htmlFor="include-stats">Include Statistics and Metadata</Label>
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={exporting || !selectedExportType}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => fetchMarks()} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entry" className="flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Entry/Update</span>
          </TabsTrigger>
          <TabsTrigger value="view-student">
            <Users className="w-4 h-4 mr-2" />
            By Student
          </TabsTrigger>
          <TabsTrigger value="view-subject">
            <BookOpen className="w-4 h-4 mr-2" />
            By Subject
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Entry/Update Tab */}
        <TabsContent value="entry" className="space-y-6">
          {/* Selection Controls */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-green-600" />
                <span>Term-Based Assessment Entry</span>
              </CardTitle>
              <CardDescription>Select subject, term, and assessment type (BOT/MOT/EOT)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="term">Term *</Label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
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
                  <Label htmlFor="examType">Assessment Type *</Label>
                  <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_TYPES.map((exam) => (
                        <SelectItem key={exam.value} value={exam.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={exam.color} variant="outline">
                              {exam.shortName}
                            </Badge>
                            <span>{exam.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marks Entry Table */}
          {selectedSubject && selectedTerm && selectedExamType && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Badge className={getExamTypeColor(selectedExamType)}>
                        {EXAM_TYPES.find((e) => e.value === selectedExamType)?.shortName}
                      </Badge>
                      <span>{subjects.find((s) => s.id === selectedSubject)?.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {terms.find((t) => t.id === selectedTerm)?.name} •{" "}
                      {EXAM_TYPES.find((e) => e.value === selectedExamType)?.label} • {students.length} students
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveMarks} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : `Save ${selectedExamType} Marks`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64">Student</TableHead>
                        <TableHead className="w-32">Mark (0-100)</TableHead>
                        <TableHead className="w-24">Grade</TableHead>
                        <TableHead className="w-32">Progress</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const studentMark = entryMarks[student.id]
                        if (!studentMark) return null

                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={student.photo || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-green-100 text-green-700">
                                    {student.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-xs text-gray-500">{student.registrationNumber}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={studentMark.mark}
                                onChange={(e) => updateStudentMark(student.id, Number.parseInt(e.target.value) || 0)}
                                className="w-24 text-center"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge className={getGradeColor(studentMark.grade)}>{studentMark.grade}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={studentMark.mark} className="w-20" />
                                <span className="text-xs text-gray-500">{studentMark.mark}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {studentMark.hasExistingMark ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Update
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  New
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {(!selectedSubject || !selectedTerm || !selectedExamType) && (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Assessment Parameters</h3>
                <p className="text-gray-600 mb-4">Choose subject, term, and assessment type to start entering marks</p>
                <div className="flex justify-center space-x-2 flex-wrap gap-2">
                  {EXAM_TYPES.map((exam) => (
                    <Badge key={exam.value} className={exam.color} variant="outline">
                      {exam.shortName} - {exam.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* View by Student Tab */}
        <TabsContent value="view-student" className="space-y-4">
          {Object.entries(marksByStudent).map(([studentName, studentMarks]) => {
            const totalMarks = studentMarks.filter((m) => m.total && m.total > 0)
            const average =
              totalMarks.length > 0
                ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
                : 0

            return (
              <Card key={studentName} className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={studentMarks[0]?.student.photo || "/placeholder.svg"} />
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{studentName}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Average</p>
                        <p className="text-lg font-bold text-green-600">{average}%</p>
                      </div>
                      <Badge className={getGradeColor(calculateGrade(average).grade)}>
                        {calculateGrade(average).grade}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{studentMarks.length} subjects assessed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>BOT</TableHead>
                        <TableHead>MOT</TableHead>
                        <TableHead>EOT</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentMarks.map((mark) => (
                        <TableRow key={mark.id}>
                          <TableCell className="font-medium">{mark.subject.name}</TableCell>
                          <TableCell>{mark.term.name}</TableCell>
                          <TableCell>{mark.bot || "-"}</TableCell>
                          <TableCell>{mark.midterm || "-"}</TableCell>
                          <TableCell>{mark.eot || "-"}</TableCell>
                          <TableCell className="font-semibold">{mark.total || "-"}%</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* View by Subject Tab */}
        <TabsContent value="view-subject" className="space-y-4">
          {Object.entries(marksBySubject).map(([subjectName, subjectMarks]) => {
            const totalMarks = subjectMarks.filter((m) => m.total && m.total > 0)
            const average =
              totalMarks.length > 0
                ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
                : 0

            return (
              <Card key={subjectName} className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span>{subjectName}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Class Average</p>
                        <p className="text-lg font-bold text-green-600">{average}%</p>
                      </div>
                      <Badge className={getGradeColor(calculateGrade(average).grade)}>
                        {calculateGrade(average).grade}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>{subjectMarks.length} students assessed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>BOT</TableHead>
                        <TableHead>MOT</TableHead>
                        <TableHead>EOT</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectMarks.map((mark) => (
                        <TableRow key={mark.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={mark.student.photo || "/placeholder.svg"} />
                                <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                  {mark.student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{mark.student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{mark.term.name}</TableCell>
                          <TableCell>
                            {mark.bot ? <Badge className="bg-blue-100 text-blue-800">{mark.bot}</Badge> : "-"}
                          </TableCell>
                          <TableCell>
                            {mark.midterm ? (
                              <Badge className="bg-orange-100 text-orange-800">{mark.midterm}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.eot ? <Badge className="bg-green-100 text-green-800">{mark.eot}</Badge> : "-"}
                          </TableCell>
                          <TableCell className="font-semibold">{mark.total || "-"}%</TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                          </TableCell>
                          <TableCell>
                            <Progress value={mark.total || 0} className="w-20" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Users className="w-5 h-5" />
                  <span>Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-900">{students.length}</p>
                <p className="text-sm text-blue-600">Active students</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <BookOpen className="w-5 h-5" />
                  <span>Subjects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-900">{subjects.length}</p>
                <p className="text-sm text-green-600">Being taught</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <Calendar className="w-5 h-5" />
                  <span>Terms</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-900">{terms.length}</p>
                <p className="text-sm text-orange-600">Academic terms</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-800">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-900">{marks.length}</p>
                <p className="text-sm text-purple-600">Marks recorded</p>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Type Distribution */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Assessment Type Distribution</CardTitle>
              <CardDescription>Overview of BOT, MOT, and EOT assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {EXAM_TYPES.map((examType) => {
                  let count = 0
                  marks.forEach((mark) => {
                    if (examType.value === "BOT" && mark.bot) count++
                    if (examType.value === "MOT" && mark.midterm) count++
                    if (examType.value === "EOT" && mark.eot) count++
                  })

                  const totalPossible = marks.length
                  const percentage = totalPossible > 0 ? Math.round((count / totalPossible) * 100) : 0

                  return (
                    <div key={examType.value} className="flex items-center space-x-4">
                      <Badge className={examType.color} variant="outline">
                        {examType.shortName}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{examType.label}</span>
                          <span className="text-sm text-gray-600">
                            {count} completed ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
