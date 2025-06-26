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
  class: {
    id: string
    name: string
  }
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

interface Class {
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
    registrationNumber?: string
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

export default function SecretaryMarksPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [gradingSystem, setGradingSystem] = useState<GradingSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedExamType, setSelectedExamType] = useState("")

  // Class-specific data
  const [classStudents, setClassStudents] = useState<Student[]>([])
  const [classSubjects, setClassSubjects] = useState<Subject[]>([])
  const [loadingClassData, setLoadingClassData] = useState(false)

  // Entry state
  const [entryMarks, setEntryMarks] = useState<Record<string, StudentMark>>({})
  const [activeTab, setActiveTab] = useState("entry")

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedExportType, setSelectedExportType] = useState("")
  const [exportFilters, setExportFilters] = useState({
    classId: "all",
    subjectId: "all",
    termId: "all",
    examType: "all",
    studentId: "all",
    format: "csv",
    includeStats: true,
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (selectedClass && selectedClass !== "all") {
      fetchClassData(selectedClass)
    } else {
      setClassStudents([])
      setClassSubjects([])
    }
  }, [selectedClass])

  useEffect(() => {
    if (selectedSubject || selectedTerm || selectedClass) {
      fetchMarks()
    }
  }, [selectedSubject, selectedTerm, selectedClass])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedExamType && classStudents.length > 0) {
      initializeEntryMarks()
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedExamType, classStudents, marks])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all necessary data for secretary
      const [studentsRes, subjectsRes, termsRes, classesRes, gradingRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/subjects"),
        fetch("/api/terms"),
        fetch("/api/classes"),
        fetch("/api/grading-system"),
      ])

      if (!studentsRes.ok || !subjectsRes.ok || !termsRes.ok || !classesRes.ok) {
        throw new Error("Failed to fetch some data")
      }

      const [studentsData, subjectsData, termsData, classesData, gradingData] = await Promise.all([
        studentsRes.json(),
        subjectsRes.json(),
        termsRes.json(),
        classesRes.json(),
        gradingRes.ok ? gradingRes.json() : { gradingSystem: [] },
      ])

      setStudents(studentsData.students || studentsData || [])
      setSubjects(subjectsData.subjects || subjectsData || [])
      setTerms(termsData.terms || termsData || [])
      setClasses(classesData.classes || classesData || [])

      // Set grading system
      if (gradingData.gradingSystem && gradingData.gradingSystem.length > 0) {
        setGradingSystem(gradingData.gradingSystem)
      } else {
        // Set default grading system if API fails
        const defaultGrading = [
          { id: "1", grade: "A", minMark: 80, maxMark: 100, comment: "Excellent" },
          { id: "2", grade: "B", minMark: 70, maxMark: 79, comment: "Very Good" },
          { id: "3", grade: "C", minMark: 60, maxMark: 69, comment: "Good" },
          { id: "4", grade: "D", minMark: 50, maxMark: 59, comment: "Fair" },
          { id: "5", grade: "E", minMark: 40, maxMark: 49, comment: "Pass" },
          { id: "6", grade: "F", minMark: 0, maxMark: 39, comment: "Fail" },
        ]
        setGradingSystem(defaultGrading)
      }
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

  const fetchClassData = async (classId: string) => {
    if (!classId || classId === "all") {
      setClassStudents([])
      setClassSubjects([])
      return
    }

    setLoadingClassData(true)
    try {
      // Fetch subjects for the selected class
      const subjectsResponse = await fetch(`/api/classes/${classId}/subjects`)
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setClassSubjects(subjectsData.subjects || [])
      } else {
        // Fallback: show all subjects if class-specific subjects endpoint fails
        setClassSubjects(subjects)
      }

      // Fetch students for the selected class
      const studentsResponse = await fetch(`/api/classes/${classId}/students`)
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        const students = studentsData.students || studentsData || []
        setClassStudents(students)
      } else {
        // Fallback: filter students by class from the main students array
        const filteredStudents = students.filter((student) => student.class?.id === classId)
        setClassStudents(filteredStudents)
      }
    } catch (error) {
      console.error("Error fetching class data:", error)
      // Fallback to filtering from existing data
      setClassSubjects(subjects)
      const filteredStudents = students.filter((student) => student.class?.id === classId)
      setClassStudents(filteredStudents)
    } finally {
      setLoadingClassData(false)
    }
  }

  const fetchMarks = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedSubject && selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)

      const response = await fetch(`/api/marks?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMarks(Array.isArray(data) ? data : data.marks || [])
      } else {
        console.error("Failed to fetch marks:", data.error)
        setMarks([])
      }
    } catch (error) {
      console.error("Error fetching marks:", error)
      setMarks([])
    }
  }

  const initializeEntryMarks = () => {
    const initialMarks: Record<string, StudentMark> = {}

    classStudents.forEach((student) => {
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
    // Validate mark range
    if (mark < 0 || mark > 100) {
      toast({
        title: "Invalid Mark",
        description: "Please enter a mark between 0 and 100",
        variant: "destructive",
      })
      return
    }

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
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedExamType) {
      toast({
        title: "Error",
        description: "Please select class, subject, term, and exam type",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const marksToSave = Object.values(entryMarks)
        .filter((mark) => mark.mark > 0) // Only save marks that have been entered
        .map((mark) => ({
          studentId: mark.studentId,
          subjectId: selectedSubject,
          termId: selectedTerm,
          mark: mark.mark,
          examType: selectedExamType,
          existingMarkId: mark.existingMarkId,
        }))

      if (marksToSave.length === 0) {
        toast({
          title: "Warning",
          description: "No marks to save. Please enter at least one mark.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/marks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: marksToSave }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || `${selectedExamType} marks saved for ${marksToSave.length} students`,
        })
        fetchMarks() // Refresh marks
        initializeEntryMarks() // Refresh entry marks
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

      const response = await fetch("/api/admin/reports/download", {
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
          "Class",
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
          item.className || "",
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
        headers = [
          "Student Name",
          "Registration Number",
          "Class",
          "Subject",
          "Term",
          "BOT",
          "MOT",
          "EOT",
          "Total",
          "Grade",
        ]
        rows = data.map((item) => [
          item.studentName || "",
          item.registrationNumber || "",
          item.className || "",
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
          "Class",
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
          item.className || "",
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
      case "E":
        return "bg-orange-100 text-orange-800"
      case "F":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter marks based on selected filters
  const filteredMarks = marks.filter((mark) => {
    const matchesClass =
      !selectedClass ||
      selectedClass === "all" ||
      students.find((s) => s.id === mark.studentId)?.class.id === selectedClass

    const matchesSubject = !selectedSubject || selectedSubject === "all" || mark.subjectId === selectedSubject
    const matchesTerm = !selectedTerm || selectedTerm === "all" || mark.termId === selectedTerm

    return matchesClass && matchesSubject && matchesTerm
  })

  // Group marks for display
  const marksByStudent = filteredMarks.reduce(
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

  const marksBySubject = filteredMarks.reduce(
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

  const marksByClass = filteredMarks.reduce(
    (acc, mark) => {
      const student = students.find((s) => s.id === mark.studentId)
      const className = student?.class.name || "Unknown"

      if (!acc[className]) {
        acc[className] = []
      }
      acc[className].push(mark)
      return acc
    },
    {} as Record<string, Mark[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-orange-50 to-amber-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Secretary Marks Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            BOT • MOT • EOT Assessment System • {students.length} students • {subjects.length} subjects •{" "}
            {classes.length} classes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-sm">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export Data</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-600" />
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
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedExportType === type.id
                              ? "border-orange-500 bg-orange-50 shadow-lg"
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
                    <Label htmlFor="export-class">Class Filter</Label>
                    <Select
                      value={exportFilters.classId}
                      onValueChange={(value) => setExportFilters((prev) => ({ ...prev, classId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Export Options</Label>

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="csv-format"
                        name="format"
                        value="csv"
                        checked={exportFilters.format === "csv"}
                        onChange={(e) => setExportFilters((prev) => ({ ...prev, format: e.target.value }))}
                        className="text-orange-600"
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
                        className="text-orange-600"
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
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={exporting || !selectedExportType}
                    className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
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

          <Button variant="outline" onClick={() => fetchMarks()} disabled={loading} className="text-sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger
            value="entry"
            className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
          >
            <Edit className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Entry/Update</span>
          </TabsTrigger>
          <TabsTrigger
            value="view-student"
            className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
          >
            <Users className="w-4 h-4" />
            <span className="text-xs sm:text-sm">By Student</span>
          </TabsTrigger>
          <TabsTrigger
            value="view-subject"
            className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-xs sm:text-sm">By Subject</span>
          </TabsTrigger>
          <TabsTrigger
            value="view-class"
            className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-xs sm:text-sm">By Class</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Entry/Update Tab */}
        <TabsContent value="entry" className="space-y-4 sm:space-y-6">
          {/* Selection Controls */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                <span>Term-Based Assessment Entry</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Select class, subject, term, and assessment type (BOT/MOT/EOT)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="class" className="text-sm font-medium">
                    Class *
                  </Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium">
                    Subject *
                  </Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={loadingClassData || !selectedClass}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loadingClassData ? "Loading..." : "Select subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedClass ? classSubjects : subjects).map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="term" className="text-sm font-medium">
                    Term *
                  </Label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="examType" className="text-sm font-medium">
                    Assessment Type *
                  </Label>
                  <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                    <SelectTrigger className="mt-1">
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

              {/* Show loading indicator when fetching class data */}
              {loadingClassData && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Loading class data...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marks Entry Table */}
          {selectedClass && selectedSubject && selectedTerm && selectedExamType && (
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <Badge className={getExamTypeColor(selectedExamType)}>
                        {EXAM_TYPES.find((e) => e.value === selectedExamType)?.shortName}
                      </Badge>
                      <span className="text-lg sm:text-xl">
                        {classes.find((c) => c.id === selectedClass)?.name} -{" "}
                        {(selectedClass ? classSubjects : subjects).find((s) => s.id === selectedSubject)?.name}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      {terms.find((t) => t.id === selectedTerm)?.name} •{" "}
                      {EXAM_TYPES.find((e) => e.value === selectedExamType)?.label} • {classStudents.length} students
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleSaveMarks}
                    disabled={saving}
                    className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : `Save ${selectedExamType} Marks`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {classStudents.map((student) => {
                    const studentMark = entryMarks[student.id]
                    if (!studentMark) return null

                    return (
                      <Card
                        key={student.id}
                        className="border border-gray-200 hover:border-orange-300 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={student.photo || "/placeholder.svg"} />
                              <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.registrationNumber}</p>
                            </div>
                            <Badge className={getGradeColor(studentMark.grade)}>{studentMark.grade}</Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-600">Mark (0-100)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={studentMark.mark}
                                onChange={(e) => updateStudentMark(student.id, Number.parseInt(e.target.value) || 0)}
                                className="mt-1 text-center"
                                placeholder="0"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <Progress value={studentMark.mark} className="flex-1" />
                                <span className="text-xs text-gray-500 min-w-[3rem]">{studentMark.mark}%</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  studentMark.hasExistingMark
                                    ? "bg-blue-50 text-blue-700 ml-2"
                                    : "bg-green-50 text-green-700 ml-2"
                                }
                              >
                                {studentMark.hasExistingMark ? "Update" : "New"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-gray-50">
                        <TableHead className="w-64">Student</TableHead>
                        <TableHead className="w-32">Mark (0-100)</TableHead>
                        <TableHead className="w-24">Grade</TableHead>
                        <TableHead className="w-32">Progress</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map((student, index) => {
                        const studentMark = entryMarks[student.id]
                        if (!studentMark) return null

                        return (
                          <TableRow
                            key={student.id}
                            className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={student.photo || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-orange-100 text-orange-700">
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
                                className="w-24 text-center hover:border-orange-300 focus:border-orange-500 transition-colors"
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
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  Update
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
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

          {(!selectedClass || !selectedSubject || !selectedTerm || !selectedExamType) && (
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Assessment Parameters</h3>
                <p className="text-gray-600 mb-4">
                  Choose class, subject, term, and assessment type to start entering marks
                </p>
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
          {Object.entries(marksByStudent).length === 0 ? (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Student Data</h3>
                <p className="text-gray-600">Select class, subject and term filters to view student marks</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(marksByStudent).map(([studentName, studentMarks]) => {
              const totalMarks = studentMarks.filter((m) => m.total && m.total > 0)
              const average =
                totalMarks.length > 0
                  ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
                  : 0

              return (
                <Card key={studentName} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                          <AvatarImage src={studentMarks[0]?.student.photo || "/placeholder.svg"} />
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-lg sm:text-xl">{studentName}</span>
                          <p className="text-sm text-gray-500">{studentMarks[0]?.student.registrationNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center sm:text-right">
                          <p className="text-sm text-gray-600">Average</p>
                          <p className="text-lg font-bold text-orange-600">{average}%</p>
                        </div>
                        <Badge className={getGradeColor(calculateGrade(average).grade)}>
                          {calculateGrade(average).grade}
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>{studentMarks.length} subjects assessed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                      {studentMarks.map((mark) => (
                        <Card key={mark.id} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sm">{mark.subject.name}</p>
                                <p className="text-xs text-gray-500">{mark.term.name}</p>
                              </div>
                              <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div>
                                <p className="text-gray-600">BOT</p>
                                <p className="font-medium">{mark.bot || "-"}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">MOT</p>
                                <p className="font-medium">{mark.midterm || "-"}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">EOT</p>
                                <p className="font-medium">{mark.eot || "-"}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total</p>
                                <p className="font-semibold text-orange-600">{mark.total || "-"}%</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50">
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
                          {studentMarks.map((mark, index) => (
                            <TableRow
                              key={mark.id}
                              className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                            >
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
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* View by Subject Tab */}
        <TabsContent value="view-subject" className="space-y-4">
          {Object.entries(marksBySubject).length === 0 ? (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subject Data</h3>
                <p className="text-gray-600">Select class, subject and term filters to view subject marks</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(marksBySubject).map(([subjectName, subjectMarks]) => {
              const totalMarks = subjectMarks.filter((m) => m.total && m.total > 0)
              const average =
                totalMarks.length > 0
                  ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
                  : 0

              return (
                <Card key={subjectName} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-orange-600" />
                        <span className="text-lg sm:text-xl">{subjectName}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center sm:text-right">
                          <p className="text-sm text-gray-600">Class Average</p>
                          <p className="text-lg font-bold text-orange-600">{average}%</p>
                        </div>
                        <Badge className={getGradeColor(calculateGrade(average).grade)}>
                          {calculateGrade(average).grade}
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>{subjectMarks.length} students assessed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                      {subjectMarks.map((mark) => (
                        <Card key={mark.id} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={mark.student.photo || "/placeholder.svg"} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                                  {mark.student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{mark.student.name}</p>
                                <p className="text-xs text-gray-500">{mark.term.name}</p>
                              </div>
                              <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div>
                                <p className="text-gray-600">BOT</p>
                                <p className="font-medium">
                                  {mark.bot ? (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">{mark.bot}</Badge>
                                  ) : (
                                    "-"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">MOT</p>
                                <p className="font-medium">
                                  {mark.midterm ? (
                                    <Badge className="bg-orange-100 text-orange-800 text-xs">{mark.midterm}</Badge>
                                  ) : (
                                    "-"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">EOT</p>
                                <p className="font-medium">
                                  {mark.eot ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs">{mark.eot}</Badge>
                                  ) : (
                                    "-"
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total</p>
                                <p className="font-semibold text-orange-600">{mark.total || "-"}%</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress value={mark.total || 0} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50">
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
                          {subjectMarks.map((mark, index) => (
                            <TableRow
                              key={mark.id}
                              className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={mark.student.photo || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
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
                                {mark.bot ? (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                                    {mark.bot}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                {mark.midterm ? (
                                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors">
                                    {mark.midterm}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                {mark.eot ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                                    {mark.eot}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
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
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* View by Class Tab */}
        <TabsContent value="view-class" className="space-y-4">
          {Object.entries(marksByClass).length === 0 ? (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Class Data</h3>
                <p className="text-gray-600">Select filters to view class marks</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(marksByClass).map(([className, classMarks]) => {
              const totalMarks = classMarks.filter((m) => m.total && m.total > 0)
              const average =
                totalMarks.length > 0
                  ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
                  : 0

              return (
                <Card key={className} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5 text-orange-600" />
                        <span className="text-lg sm:text-xl">Class {className}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center sm:text-right">
                          <p className="text-sm text-gray-600">Class Average</p>
                          <p className="text-lg font-bold text-orange-600">{average}%</p>
                        </div>
                        <Badge className={getGradeColor(calculateGrade(average).grade)}>
                          {calculateGrade(average).grade}
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>{classMarks.length} assessment records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                      {classMarks.map((mark) => (
                        <Card key={mark.id} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={mark.student.photo || "/placeholder.svg"} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                                  {mark.student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{mark.student.name}</p>
                                <p className="text-xs text-gray-500">
                                  {mark.subject.name} - {mark.term.name}
                                </p>
                              </div>
                              <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-xs">
                              <div>
                                <p className="text-gray-600">BOT</p>
                                <p className="font-medium">{mark.bot || "-"}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">MOT</p>
                                <p className="font-medium">{mark.midterm || "-"}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">EOT</p>
                                <p className="font-medium">{mark.eot || "-"}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total</p>
                                <p className="font-semibold text-orange-600">{mark.total || "-"}%</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50">
                            <TableHead>Student</TableHead>
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
                          {classMarks.map((mark, index) => (
                            <TableRow
                              key={mark.id}
                              className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={mark.student.photo || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
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
                              <TableCell>{mark.subject.name}</TableCell>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-blue-800 text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{students.length}</p>
                <p className="text-xs sm:text-sm text-blue-600">Total enrolled</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-green-800 text-sm sm:text-base">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Subjects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{subjects.length}</p>
                <p className="text-xs sm:text-sm text-green-600">Being taught</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-orange-800 text-sm sm:text-base">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-orange-900">{classes.length}</p>
                <p className="text-xs sm:text-sm text-orange-600">Active classes</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-purple-800 text-sm sm:text-base">
                  <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900">{marks.length}</p>
                <p className="text-xs sm:text-sm text-purple-600">Marks recorded</p>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Type Distribution */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Assessment Type Distribution</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Overview of BOT, MOT, and EOT assessments
              </CardDescription>
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
                    <div
                      key={examType.value}
                      className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4"
                    >
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

          {/* Grading System Display */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Current Grading System</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Grade boundaries and descriptions from database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradingSystem.map((grade) => (
                  <div
                    key={grade.id}
                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                    style={{
                      backgroundColor: getGradeColor(grade.grade)
                        .split(" ")[0]
                        .replace("bg-", "")
                        .replace("-100", "-50"),
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getGradeColor(grade.grade)} variant="outline">
                        Grade {grade.grade}
                      </Badge>
                      <span className="text-sm font-medium">
                        {grade.minMark}% - {grade.maxMark}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{grade.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
