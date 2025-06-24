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
  FileSpreadsheet,
  RefreshCw,
  BarChart3,
  Users,
  Download,
  TrendingUp,
  PieChart,
  User,
  GraduationCap,
  Search,
  Filter,
  UserPlus,
  Save,
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
  assessment1?: number
  assessment2?: number
  assessment3?: number
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

const EXAM_TYPES = [
  { value: "BOT", label: "Beginning of Term", color: "bg-blue-100 text-blue-800", shortName: "BOT" },
  { value: "MID", label: "Mid Term", color: "bg-orange-100 text-orange-800", shortName: "MID" },
  { value: "END", label: "End of Term", color: "bg-green-100 text-green-800", shortName: "END" },
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
  const [exporting, setExporting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedExamType, setSelectedExamType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [activeTab, setActiveTab] = useState("view-all")

  const [classSubjects, setClassSubjects] = useState<Subject[]>([])
  const [classStudents, setClassStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [marksEntry, setMarksEntry] = useState<Record<string, { bot?: number; mid?: number; end?: number }>>({})
  const [existingMarks, setExistingMarks] = useState<Record<string, Mark>>({})
  const [showMarksEntry, setShowMarksEntry] = useState(false)
  const [loadingClassData, setLoadingClassData] = useState(false)

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedExportType, setSelectedExportType] = useState("")
  const [exportFilters, setExportFilters] = useState({
    subjectId: "all",
    termId: "all",
    classId: "all",
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
    fetchMarks()
    if (selectedClass && selectedClass !== "all") {
      fetchClassData(selectedClass)
    } else {
      // Reset class-specific data when "all" is selected
      setClassSubjects([])
      setClassStudents([])
      setSelectedStudents([])
      setShowMarksEntry(false)
    }
  }, [selectedSubject, selectedTerm, selectedClass, searchTerm])

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm && selectedExamType) {
      fetchExistingMarks()
      setShowMarksEntry(true)
    } else {
      setShowMarksEntry(false)
    }
  }, [selectedClass, selectedSubject, selectedTerm, selectedExamType])

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
      setGradingSystem(gradingData.gradingSystem || gradingData || [])

      console.log("Fetched data:", {
        students: studentsData.students || studentsData || [],
        subjects: subjectsData.subjects || subjectsData || [],
        terms: termsData.terms || termsData || [],
        classes: classesData.classes || classesData || [],
      })
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

  const fetchMarks = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedSubject && selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/marks?${params}`)

      if (response.ok) {
        const data = await response.json()
        setMarks(Array.isArray(data) ? data : data.marks || [])
      } else {
        console.error("Failed to fetch marks:", response.statusText)
        setMarks([])
      }
    } catch (error) {
      console.error("Error fetching marks:", error)
      setMarks([])
    }
  }

  const fetchClassData = async (classId: string) => {
    if (!classId || classId === "all") {
      setClassSubjects([])
      setClassStudents([])
      setSelectedStudents([])
      setShowMarksEntry(false)
      return
    }

    setLoadingClassData(true)
    try {
      // Fetch subjects for the selected class
      const subjectsResponse = await fetch(`/api/classes/${classId}/subjects`)
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setClassSubjects(subjectsData.subjects || [])
        console.log("Class subjects:", subjectsData.subjects || [])
      } else {
        console.error("Failed to fetch class subjects:", subjectsResponse.statusText)
        // Fallback: show all subjects if class-specific subjects endpoint fails
        setClassSubjects(subjects)
        toast({
          title: "Warning",
          description: "Could not fetch class-specific subjects. Showing all subjects.",
          variant: "destructive",
        })
      }

      // Fetch students for the selected class
      const studentsResponse = await fetch(`/api/classes/${classId}/students`)
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        const students = studentsData.students || studentsData || []
        setClassStudents(students)
        setSelectedStudents(students)
        console.log("Class students:", students)
      } else {
        console.error("Failed to fetch class students:", studentsResponse.statusText)
        // Fallback: filter students by class from the main students array
        const filteredStudents = students.filter((student) => student.class?.id === classId)
        setClassStudents(filteredStudents)
        setSelectedStudents(filteredStudents)
        console.log("Filtered students:", filteredStudents)
      }
    } catch (error) {
      console.error("Error fetching class data:", error)
      // Fallback to filtering from existing data
      setClassSubjects(subjects)
      const filteredStudents = students.filter((student) => student.class?.id === classId)
      setClassStudents(filteredStudents)
      setSelectedStudents(filteredStudents)

      toast({
        title: "Warning",
        description: "Using cached data. Some information may not be up to date.",
        variant: "destructive",
      })
    } finally {
      setLoadingClassData(false)
    }
  }

  const fetchExistingMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) return

    try {
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        termId: selectedTerm,
      })

      const response = await fetch(`/api/marks?${params}`)
      if (response.ok) {
        const data = await response.json()
        const marks = Array.isArray(data) ? data : data.marks || []

        // Create a map of existing marks by student ID
        const marksMap: Record<string, Mark> = {}
        const entryMap: Record<string, { bot?: number; mid?: number; end?: number }> = {}

        marks.forEach((mark: Mark) => {
          marksMap[mark.studentId] = mark
          entryMap[mark.studentId] = {
            bot: mark.bot || undefined,
            mid: mark.midterm || undefined,
            end: mark.eot || undefined,
          }
        })

        setExistingMarks(marksMap)
        setMarksEntry(entryMap)
        console.log("Fetched existing marks:", marks.length, "records")
      }
    } catch (error) {
      console.error("Error fetching existing marks:", error)
    }
  }

  const handleMarksSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedExamType) {
      toast({
        title: "Error",
        description: "Please select class, subject, term, and exam type",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const marksData = Object.entries(marksEntry)
        .filter(([studentId, marks]) => {
          const mark = marks[selectedExamType.toLowerCase() as keyof typeof marks]
          return mark !== undefined && mark !== null && mark !== ""
        })
        .map(([studentId, marks]) => ({
          studentId,
          subjectId: selectedSubject,
          termId: selectedTerm,
          examType: selectedExamType,
          mark: marks[selectedExamType.toLowerCase() as keyof typeof marks],
          existingMarkId: existingMarks[studentId]?.id,
        }))

      if (marksData.length === 0) {
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
        body: JSON.stringify({ marks: marksData }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || `${marksData.length} marks saved successfully`,
        })
        fetchExistingMarks()
        fetchMarks()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save marks")
      }
    } catch (error) {
      console.error("Error saving marks:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save marks",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateMarkEntry = (studentId: string, examType: string, value: string) => {
    const numValue = value === "" ? undefined : Number(value)
    setMarksEntry((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examType.toLowerCase()]: numValue,
      },
    }))
  }

  const calculateGrade = (mark: number): { grade: string; comment: string } => {
    for (const gradeSystem of gradingSystem) {
      if (mark >= (gradeSystem.minMark || 0) && mark <= (gradeSystem.maxMark || 100)) {
        return { grade: gradeSystem.grade, comment: gradeSystem.comment }
      }
    }
    return { grade: "F", comment: "Fail" }
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
          "Assessment 1",
          "Assessment 2",
          "Assessment 3",
          "BOT",
          "EOT",
          "Total",
          "Grade",
          "Last Updated",
        ]
        rows = data.map((item) => [
          item.studentName || "",
          item.registrationNumber || "",
          item.className || "",
          item.subjectName || "",
          item.termName || "",
          item.assessment1?.toString() || "0",
          item.assessment2?.toString() || "0",
          item.assessment3?.toString() || "0",
          item.bot?.toString() || "0",
          item.eot?.toString() || "0",
          item.total?.toString() || "0",
          item.grade || "",
          item.lastUpdated || "",
        ])
        break

      default:
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

  // Filter marks based on selected filters
  const filteredMarks = marks.filter((mark) => {
    const matchesSearch =
      !searchTerm ||
      mark.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mark.subject.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClass =
      !selectedClass ||
      selectedClass === "all" ||
      students.find((s) => s.id === mark.studentId)?.class.id === selectedClass

    const matchesSubject = !selectedSubject || selectedSubject === "all" || mark.subjectId === selectedSubject
    const matchesTerm = !selectedTerm || selectedTerm === "all" || mark.termId === selectedTerm

    return matchesSearch && matchesClass && matchesSubject && matchesTerm
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-amber-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marks Management & Oversight</h1>
          <p className="text-gray-600 mt-1">
            Secretary Dashboard • Assessment System • {students.length} students • {subjects.length} subjects •{" "}
            {classes.length} classes
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Download className="w-4 h-4 mr-2" />
                Export Reports
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
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedExportType === type.id
                              ? "border-orange-500 bg-orange-50"
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

                  <div className="flex items-center space-x-4">
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
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={exporting || !selectedExportType}
                    className="bg-orange-600 hover:bg-orange-700"
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

      {/* Filters */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-orange-600" />
            <span>Filter & Search</span>
          </CardTitle>
          <CardDescription>Filter marks by class, subject, term, or search for specific students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClass || "all"} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
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
            <Select value={selectedSubject || "all"} onValueChange={setSelectedSubject} disabled={loadingClassData}>
              <SelectTrigger>
                <SelectValue placeholder={loadingClassData ? "Loading subjects..." : "Filter by subject"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {(selectedClass && selectedClass !== "all" ? classSubjects : subjects).map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm || "all"} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by term" />
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
            <Select value={selectedExamType || "all"} onValueChange={setSelectedExamType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by exam type" />
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

          {/* Show loading indicator when fetching class data */}
          {loadingClassData && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
              <span className="text-sm text-gray-600">Loading class data...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="view-all">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            All Marks
          </TabsTrigger>
          <TabsTrigger value="marks-entry">
            <UserPlus className="w-4 h-4 mr-2" />
            Enter Marks
          </TabsTrigger>
          <TabsTrigger value="view-student">
            <Users className="w-4 h-4 mr-2" />
            By Student
          </TabsTrigger>
          <TabsTrigger value="view-subject">
            <BookOpen className="w-4 h-4 mr-2" />
            By Subject
          </TabsTrigger>
          <TabsTrigger value="view-class">
            <GraduationCap className="w-4 h-4 mr-2" />
            By Class
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Marks Entry Tab */}
        <TabsContent value="marks-entry" className="space-y-4">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <span>Enter/Update Marks</span>
              </CardTitle>
              <CardDescription>
                Select class, subject, term, and exam type to enter or update marks for students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showMarksEntry ? (
                <div className="text-center py-12">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Select Filters to Enter Marks</h3>
                  <p className="text-gray-500">
                    Please select a class, subject, term, and exam type to start entering marks.
                  </p>
                  {selectedClass && selectedClass !== "all" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Class selected: <strong>{classes.find((c) => c.id === selectedClass)?.name}</strong>
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        {classStudents.length} students • {classSubjects.length} subjects available
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Filters Summary */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">Selected Filters:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-orange-100 text-orange-800">
                        Class: {classes.find((c) => c.id === selectedClass)?.name}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        Subject:{" "}
                        {
                          (selectedClass && selectedClass !== "all" ? classSubjects : subjects).find(
                            (s) => s.id === selectedSubject,
                          )?.name
                        }
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        Term: {terms.find((t) => t.id === selectedTerm)?.name}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-800">
                        Exam: {EXAM_TYPES.find((e) => e.value === selectedExamType)?.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Marks Entry Table */}
                  {selectedStudents.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Enter Marks for {selectedStudents.length} Students</h4>
                        <Button
                          onClick={handleMarksSubmit}
                          disabled={isSubmitting}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Marks
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Current Mark</TableHead>
                              <TableHead>New/Update Mark</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedStudents.map((student) => {
                              const existingMark = existingMarks[student.id]
                              const currentMark = existingMark
                                ? selectedExamType === "BOT"
                                  ? existingMark.bot
                                  : selectedExamType === "MID"
                                    ? existingMark.midterm
                                    : selectedExamType === "END"
                                      ? existingMark.eot
                                      : null
                                : null

                              const entryValue =
                                marksEntry[student.id]?.[
                                  selectedExamType.toLowerCase() as keyof (typeof marksEntry)[string]
                                ] || ""

                              return (
                                <TableRow key={student.id}>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
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
                                    {currentMark !== null ? (
                                      <Badge className="bg-blue-100 text-blue-800">{currentMark}</Badge>
                                    ) : (
                                      <span className="text-gray-400">Not entered</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="Enter mark"
                                      value={entryValue}
                                      onChange={(e) => updateMarkEntry(student.id, selectedExamType, e.target.value)}
                                      className="w-24"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {existingMark ? (
                                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                                        Update
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-green-600 border-green-600">
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
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No students found for the selected class.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Marks Tab */}
        <TabsContent value="view-all" className="space-y-4">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>All Marks Overview</CardTitle>
              <CardDescription>
                Showing {filteredMarks.length} marks records
                {(selectedClass || selectedSubject || selectedTerm || searchTerm) && " (filtered)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMarks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Ass 1</TableHead>
                        <TableHead>Ass 2</TableHead>
                        <TableHead>Ass 3</TableHead>
                        <TableHead>BOT</TableHead>
                        <TableHead>EOT</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMarks.slice(0, 50).map((mark) => (
                        <TableRow key={mark.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={mark.student.photo || "/placeholder.svg"} />
                                <AvatarFallback className="bg-orange-100 text-orange-700">
                                  {mark.student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{mark.student.name}</p>
                                <p className="text-xs text-gray-500">{mark.student.registrationNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{mark.subject.name}</p>
                              <p className="text-xs text-gray-500">{mark.subject.code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{mark.term.name}</TableCell>
                          <TableCell>
                            {mark.assessment1 ? (
                              <Badge className="bg-blue-100 text-blue-800">{mark.assessment1}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.assessment2 ? (
                              <Badge className="bg-purple-100 text-purple-800">{mark.assessment2}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.assessment3 ? (
                              <Badge className="bg-indigo-100 text-indigo-800">{mark.assessment3}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.bot ? <Badge className="bg-orange-100 text-orange-800">{mark.bot}</Badge> : "-"}
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
                  {filteredMarks.length > 50 && (
                    <div className="text-center py-4 text-gray-500">
                      Showing first 50 records. Use filters to narrow down results.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Marks Found</h3>
                  <p className="text-gray-500">
                    {selectedClass || selectedSubject || selectedTerm || searchTerm
                      ? "No marks match your current filters."
                      : "No marks have been recorded yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {studentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-lg">{studentName}</span>
                        <p className="text-sm text-gray-500">{studentMarks[0]?.student.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Ass 1</TableHead>
                        <TableHead>Ass 2</TableHead>
                        <TableHead>Ass 3</TableHead>
                        <TableHead>BOT</TableHead>
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
                          <TableCell>{mark.assessment1 || "-"}</TableCell>
                          <TableCell>{mark.assessment2 || "-"}</TableCell>
                          <TableCell>{mark.assessment3 || "-"}</TableCell>
                          <TableCell>{mark.bot || "-"}</TableCell>
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
                      <BookOpen className="w-5 h-5 text-orange-600" />
                      <span>{subjectName}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Ass 1</TableHead>
                        <TableHead>Ass 2</TableHead>
                        <TableHead>Ass 3</TableHead>
                        <TableHead>BOT</TableHead>
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
                            {mark.assessment1 ? (
                              <Badge className="bg-blue-100 text-blue-800">{mark.assessment1}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.assessment2 ? (
                              <Badge className="bg-purple-100 text-purple-800">{mark.assessment2}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.assessment3 ? (
                              <Badge className="bg-indigo-100 text-indigo-800">{mark.assessment3}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.bot ? <Badge className="bg-orange-100 text-orange-800">{mark.bot}</Badge> : "-"}
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

        {/* View by Class Tab */}
        <TabsContent value="view-class" className="space-y-4">
          {Object.entries(marksByClass).map(([className, classMarks]) => {
            const totalMarks = classMarks.filter((m) => m.total && m.total > 0)
            const average =
              totalMarks.length > 0
                ? Math.round(totalMarks.reduce((sum, mark) => sum + (mark.total || 0), 0) / totalMarks.length)
                : 0

            return (
              <Card key={className} className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5 text-orange-600" />
                      <span>Class {className}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Ass 1</TableHead>
                        <TableHead>Ass 2</TableHead>
                        <TableHead>Ass 3</TableHead>
                        <TableHead>BOT</TableHead>
                        <TableHead>EOT</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classMarks.map((mark) => (
                        <TableRow key={mark.id}>
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
                            {mark.assessment1 ? (
                              <Badge className="bg-blue-100 text-blue-800">{mark.assessment1}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.assessment2 ? (
                              <Badge className="bg-purple-100 text-purple-800">{mark.assessment2}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.assessment3 ? (
                              <Badge className="bg-indigo-100 text-indigo-800">{mark.assessment3}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {mark.bot ? <Badge className="bg-orange-100 text-orange-800">{mark.bot}</Badge> : "-"}
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
                <p className="text-sm text-blue-600">Total enrolled</p>
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
                  <GraduationCap className="w-5 h-5" />
                  <span>Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-900">{classes.length}</p>
                <p className="text-sm text-orange-600">Active classes</p>
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
              <CardDescription>Overview of all assessments across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {EXAM_TYPES.map((examType) => {
                  let count = 0
                  marks.forEach((mark) => {
                    if (examType.value === "BOT" && mark.bot) count++
                    if (examType.value === "MID" && mark.midterm) count++
                    if (examType.value === "END" && mark.eot) count++
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

          {/* Grade Distribution */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Overall grade distribution across all assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["A", "B", "C", "D", "F"].map((grade) => {
                  const count = marks.filter((mark) => mark.grade === grade).length
                  const percentage = marks.length > 0 ? Math.round((count / marks.length) * 100) : 0

                  return (
                    <div key={grade} className="flex items-center space-x-4">
                      <Badge className={getGradeColor(grade)} variant="outline">
                        Grade {grade}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Grade {grade}</span>
                          <span className="text-sm text-gray-600">
                            {count} students ({percentage}%)
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
