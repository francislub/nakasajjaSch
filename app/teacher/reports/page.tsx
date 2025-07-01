"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Eye,
  FileText,
  Users,
  Clock,
  BookOpen,
  Send,
  Edit,
  Trophy,
  TrendingUp,
  Award,
  Target,
  Download,
  Filter,
  BarChart3,
  GraduationCap,
  Star,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface Mark {
  id: string
  bot?: number
  midterm?: number
  eot?: number
  total?: number
  grade?: string
  subject: {
    id: string
    name: string
    code?: string
    category: "GENERAL" | "SUBSIDIARY"
  }
  term: {
    id: string
    name: string
  }
  student: {
    id: string
    name: string
    photo?: string
    registrationNumber?: string
    class: {
      id: string
      name: string
    }
  }
  createdBy?: {
    id: string
    name: string
    role: string
  }
}

interface DivisionResult {
  division: "DIVISION_1" | "DIVISION_2" | "DIVISION_3" | "DIVISION_4" | "UNGRADED" | "FAIL"
  aggregate: number
  label: string
  color: string
  subjects: {
    subjectId: string
    subjectName: string
    grade: string
    gradeValue: number
    score?: number
  }[]
}

interface Student {
  id: string
  name: string
  photo?: string
  gender: string
  registrationNumber?: string
  class: {
    id: string
    name: string
    classTeacher?: {
      id: string
      name: string
      email: string
    }
    subjects: {
      id: string
      name: string
      code: string
      category: "GENERAL" | "SUBSIDIARY"
    }[]
    academicYear?: {
      id: string
      year: string
      isCurrent: boolean
    }
  }
  parent?: {
    id: string
    name: string
    email: string
  }
  marks: Mark[]
  reportCards: ReportCard[]
  divisions: {
    BOT: DivisionResult | null
    MID: DivisionResult | null
    END: DivisionResult | null
  }
}

interface ReportCard {
  id: string
  discipline?: string
  cleanliness?: string
  classWorkPresentation?: string
  adherenceToSchool?: string
  coCurricularActivities?: string
  considerationToOthers?: string
  speakingEnglish?: string
  classTeacherComment?: string
  headteacherComment?: string
  isApproved: boolean
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

interface Class {
  id: string
  name: string
  academicYear?: {
    id: string
    year: string
    isCurrent: boolean
  }
  subjects: {
    id: string
    name: string
    code: string
    category: "GENERAL" | "SUBSIDIARY"
  }[]
  classTeacher?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    students: number
  }
}

interface Term {
  id: string
  name: string
}

interface AcademicYear {
  id: string
  name: string
  isCurrent: boolean
}

interface GradingSystem {
  id: string
  grade: string
  minMark: number
  maxMark: number
  comment?: string
}

interface DivisionStatistics {
  totalStudents: number
  divisions: Record<string, number>
  passRate: number
}

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// Behavioral Assessment Grades - Fixed format
const BEHAVIORAL_GRADES = [
  { value: "A", label: "A - Very Good", description: "Very Good" },
  { value: "B", label: "B - Good", description: "Good" },
  { value: "C", label: "C - Fair", description: "Fair" },
  { value: "D", label: "D - Needs Improvement", description: "Needs Improvement" },
]

const getDivisionColor = (division: string): string => {
  switch (division) {
    case "DIVISION_1":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
    case "DIVISION_2":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
    case "DIVISION_3":
      return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
    case "DIVISION_4":
      return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
    case "UNGRADED":
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
    case "FAIL":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
  }
}

const getBehavioralGradeDisplay = (grade: string): string => {
  const gradeInfo = BEHAVIORAL_GRADES.find((g) => g.value === grade)
  return gradeInfo ? gradeInfo.description : grade || "Not Set"
}

const calculateDivision = (
  marks: Mark[],
  examType: "BOT" | "MID" | "END",
  gradingSystem: GradingSystem[],
  classSubjects: { id: string; name: string; code: string; category: "GENERAL" | "SUBSIDIARY" }[],
): DivisionResult | null => {
  console.log(`🔍 Calculating division for exam type: ${examType}`)
  console.log("📊 Marks data:", marks)
  console.log("📋 Grading system:", gradingSystem)
  console.log("🏫 Class subjects:", classSubjects)

  if (!marks || marks.length === 0 || !gradingSystem || gradingSystem.length === 0) {
    console.log("❌ Missing data - marks or grading system empty")
    return null
  }

  // Filter only GENERAL subjects for division calculation
  const generalSubjectMarks = marks.filter((mark) => {
    // Find the subject in class subjects to get category
    const classSubject = classSubjects.find((sub) => sub.id === mark.subject.id)
    const isGeneral = classSubject?.category === "GENERAL"
    console.log(`📝 Subject: ${mark.subject.name}, Category: ${classSubject?.category}, Is General: ${isGeneral}`)
    return isGeneral
  })

  console.log("📚 General subject marks:", generalSubjectMarks)

  if (generalSubjectMarks.length < 4) {
    console.log(`❌ Not enough general subjects (${generalSubjectMarks.length}/4 required)`)
    return null
  }

  // Get scores for the specific exam type from general subjects only
  const subjectScores = generalSubjectMarks
    .map((mark) => {
      let score = 0
      switch (examType) {
        case "BOT":
          score = mark.bot || 0
          break
        case "MID":
          score = mark.midterm || 0
          break
        case "END":
          score = mark.eot || 0
          break
      }

      console.log(`📝 Subject: ${mark.subject.name} (GENERAL), Score: ${score}`)

      // Convert score to grade using grading system
      let grade = "F"
      let gradeValue = 9

      for (const gradeEntry of gradingSystem.sort((a, b) => b.minMark - a.minMark)) {
        if (score >= gradeEntry.minMark && score <= gradeEntry.maxMark) {
          grade = gradeEntry.grade
          // Assign grade values: D1=1, D2=2, C3=3, C4=4, C5=5, C6=6, P7=7, P8=8, F=9
          switch (grade) {
            case "D1":
              gradeValue = 1
              break
            case "D2":
              gradeValue = 2
              break
            case "C3":
              gradeValue = 3
              break
            case "C4":
              gradeValue = 4
              break
            case "C5":
              gradeValue = 5
              break
            case "C6":
              gradeValue = 6
              break
            case "P7":
              gradeValue = 7
              break
            case "P8":
              gradeValue = 8
              break
            default:
              gradeValue = 9
              break
          }
          break
        }
      }

      console.log(`📊 ${mark.subject.name}: Score=${score}, Grade=${grade}, Value=${gradeValue}`)

      return {
        subjectId: mark.subject.id,
        subjectName: mark.subject.name,
        score,
        grade,
        gradeValue,
      }
    })
    .filter((subject) => subject.score > 0) // Only include subjects with scores

  console.log("📈 General subject scores after filtering:", subjectScores)

  if (subjectScores.length < 4) {
    console.log(`❌ Not enough general subjects with scores (${subjectScores.length}/4 required)`)
    return null
  }

  // Sort by grade value (best grades first) and take exactly 4 general subjects
  const best4GeneralSubjects = subjectScores.sort((a, b) => a.gradeValue - b.gradeValue).slice(0, 4)
  console.log("🏆 Best 4 general subjects:", best4GeneralSubjects)

  // Calculate aggregate (sum of grade values for best 4 general subjects)
  const aggregate = best4GeneralSubjects.reduce((sum, subject) => sum + subject.gradeValue, 0)
  console.log("🎯 Aggregate score:", aggregate)

  // Determine division based on aggregate
  let division: DivisionResult["division"] = "FAIL"
  let label = "X"

  if (aggregate >= 4 && aggregate <= 12) {
    division = "DIVISION_1"
    label = "Division I"
  } else if (aggregate >= 13 && aggregate <= 24) {
    division = "DIVISION_2"
    label = "Division II"
  } else if (aggregate >= 25 && aggregate <= 32) {
    division = "DIVISION_3"
    label = "Division III"
  } else if (aggregate >= 33 && aggregate <= 35) {
    division = "DIVISION_4"
    label = "Division IV"
  } else if (aggregate === 36) {
    division = "UNGRADED"
    label = "U"
  }

  console.log(`🏅 Final division: ${division} (${label})`)

  return {
    division,
    aggregate,
    label,
    color: getDivisionColor(division),
    subjects: best4GeneralSubjects,
  }
}

export default function TeacherReportsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [gradingSystem, setGradingSystem] = useState<GradingSystem[]>([])
  const [statistics, setStatistics] = useState<Record<string, DivisionStatistics>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("")
  const [selectedExamType, setSelectedExamType] = useState<"BOT" | "MID" | "END">("BOT")
  const [divisionFilter, setDivisionFilter] = useState<string>("all")
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [createMode, setCreateMode] = useState<"individual" | "bulk">("individual")
  const [bulkReports, setBulkReports] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const { toast } = useToast()

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  })

  const [reportForm, setReportForm] = useState({
    studentId: "",
    discipline: "",
    cleanliness: "",
    classWorkPresentation: "",
    adherenceToSchool: "",
    coCurricularActivities: "",
    considerationToOthers: "",
    speakingEnglish: "",
    classTeacherComment: "",
  })

  useEffect(() => {
    console.log("🚀 Component mounted, fetching initial data...")
    fetchInitialData()
  }, [])

  useEffect(() => {
    console.log("🔄 Dependencies changed:", { selectedClass, selectedTerm, selectedAcademicYear })
    if (selectedClass && selectedTerm && selectedAcademicYear) {
      console.log("✅ All required selections made, fetching students...")
      fetchStudentsWithMarks()
    } else {
      console.log("⏳ Waiting for all selections to be made...")
    }
  }, [selectedClass, selectedTerm, selectedAcademicYear])

  const fetchInitialData = async () => {
    try {
      console.log("📡 Starting initial data fetch...")
      setIsLoading(true)
      await Promise.all([fetchTeacherClasses(), fetchTerms(), fetchAcademicYears(), fetchGradingSystem()])
      console.log("✅ Initial data fetch completed successfully")
    } catch (error) {
      console.error("❌ Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGradingSystem = async () => {
    try {
      console.log("📡 Fetching grading system...")
      const response = await fetch("/api/grading-system")
      console.log("📡 Grading system response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Grading system data received:", data)

        let gradingData = []
        if (data.gradingSystems && Array.isArray(data.gradingSystems)) {
          gradingData = data.gradingSystems
        } else if (Array.isArray(data)) {
          gradingData = data
        } else if (data.grades && Array.isArray(data.grades)) {
          gradingData = data.grades
        }

        console.log("📋 Processed grading data:", gradingData)
        setGradingSystem(gradingData)
      } else {
        throw new Error(`Failed to fetch grading system: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error fetching grading system:", error)
      // Set default grading system
      const defaultGrading = [
        { id: "1", grade: "D1", minMark: 80, maxMark: 100, comment: "Distinction" },
        // { id: "2", grade: "D2", minMark: 75, maxMark: 79, comment: "Distinction" },
        // { id: "3", grade: "C3", minMark: 70, maxMark: 74, comment: "Credit" },
        // { id: "4", grade: "C4", minMark: 65, maxMark: 69, comment: "Credit" },
        // { id: "5", grade: "C5", minMark: 60, maxMark: 64, comment: "Credit" },
        // { id: "6", grade: "C6", minMark: 55, maxMark: 59, comment: "Credit" },
        // { id: "7", grade: "P7", minMark: 50, maxMark: 54, comment: "Pass" },
        // { id: "8", grade: "P8", minMark: 45, maxMark: 49, comment: "Pass" },
        // { id: "9", grade: "F", minMark: 0, maxMark: 44, comment: "Fail" },
      ]
      console.log("🔧 Using default grading system:", defaultGrading)
      setGradingSystem(defaultGrading)
    }
  }

  const fetchTeacherClasses = async () => {
    try {
      console.log("📡 Fetching teacher classes...")
      const response = await fetch("/api/teacher/classes")
      console.log("📡 Teacher classes response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("🏫 Teacher classes data received:", data)

        const classesData = data.classes || data || []
        console.log("📚 Processed classes data:", classesData)
        setClasses(classesData)

        if (classesData.length > 0) {
          console.log("🎯 Auto-selecting first class:", classesData[0].id)
          setSelectedClass(classesData[0].id)
        } else {
          console.log("⚠️ No classes found for teacher")
        }
      } else {
        throw new Error(`Failed to fetch teacher classes: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error fetching teacher classes:", error)
      setClasses([])
    }
  }

  const fetchTerms = async () => {
    try {
      console.log("📡 Fetching terms...")
      const response = await fetch("/api/terms")
      console.log("📡 Terms response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📅 Terms data received:", data)

        const termsData = data.terms || data || []
        console.log("📋 Processed terms data:", termsData)
        setTerms(termsData)

        if (termsData.length > 0) {
          console.log("🎯 Auto-selecting first term:", termsData[0].id)
          setSelectedTerm(termsData[0].id)
        } else {
          console.log("⚠️ No terms found")
        }
      } else {
        throw new Error(`Failed to fetch terms: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error fetching terms:", error)
      setTerms([])
    }
  }

  const fetchAcademicYears = async () => {
    try {
      console.log("📡 Fetching academic years...")
      const response = await fetch("/api/academic-years")
      console.log("📡 Academic years response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Academic years data received:", data)

        const yearsData = data.academicYears || data || []
        console.log("📋 Processed academic years data:", yearsData)
        setAcademicYears(yearsData)

        const currentYear = yearsData.find((year: AcademicYear) => year.isCurrent)
        if (currentYear) {
          console.log("🎯 Auto-selecting current year:", currentYear.id)
          setSelectedAcademicYear(currentYear.id)
        } else if (yearsData.length > 0) {
          console.log("🎯 Auto-selecting first year:", yearsData[0].id)
          setSelectedAcademicYear(yearsData[0].id)
        } else {
          console.log("⚠️ No academic years found")
        }
      } else {
        throw new Error(`Failed to fetch academic years: ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error fetching academic years:", error)
      setAcademicYears([])
    }
  }

  const fetchStudentsWithMarks = async () => {
    try {
      console.log("📡 Starting to fetch students with marks...")
      console.log("🔍 Parameters:", { selectedClass, selectedTerm, selectedAcademicYear })
      setIsRefreshing(true)

      // Fetch students in the class with all their marks
      const studentsUrl = `/api/teacher/students?classId=${selectedClass}&academicYearId=${selectedAcademicYear}`
      console.log("📡 Fetching students from:", studentsUrl)

      const studentsResponse = await fetch(studentsUrl)
      console.log("📡 Students response status:", studentsResponse.status)

      if (!studentsResponse.ok) {
        throw new Error(`Failed to fetch students: ${studentsResponse.status}`)
      }

      const studentsData = await studentsResponse.json()
      console.log("👥 Students data received:", studentsData)

      const studentsList = studentsData.students || studentsData || []
      console.log("📋 Processed students list:", studentsList)

      if (studentsList.length === 0) {
        console.log("⚠️ No students found for the selected class")
        setStudents([])
        calculateStatistics([])
        updatePagination(0)
        return
      }

      // Get class subjects for category information
      const selectedClassData = classes.find((cls) => cls.id === selectedClass)
      const classSubjects = selectedClassData?.subjects || []
      console.log("🏫 Class subjects for division calculation:", classSubjects)

      // Process students with their marks and calculate divisions
      console.log("📊 Processing students with marks and calculating divisions...")
      const studentsWithDivisions = studentsList.map((student: any) => {
        console.log(`📡 Processing student: ${student.name} (${student.id})`)

        // Filter marks for the selected term
        const termMarks = student.marks.filter((mark: Mark) => mark.term.id === selectedTerm)
        console.log(`📊 Term marks for ${student.name}:`, termMarks)

        // Calculate divisions for each exam type using class subjects for category info
        console.log(`🧮 Calculating divisions for ${student.name}...`)
        const divisions = {
          BOT: calculateDivision(termMarks, "BOT", gradingSystem, classSubjects),
          MID: calculateDivision(termMarks, "MID", gradingSystem, classSubjects),
          END: calculateDivision(termMarks, "END", gradingSystem, classSubjects),
        }
        console.log(`📊 Divisions for ${student.name}:`, divisions)

        return {
          ...student,
          marks: termMarks,
          divisions,
        }
      })

      console.log("✅ All student data processed:", studentsWithDivisions)
      setStudents(studentsWithDivisions)
      calculateStatistics(studentsWithDivisions)
      updatePagination(studentsWithDivisions.length)

      // Initialize bulk reports for ALL students when data is loaded
      if (studentsWithDivisions.length > 0) {
        console.log("📋 Initializing bulk reports for ALL students:", studentsWithDivisions.length)
        const initialReports = studentsWithDivisions.map((student: any) => {
          const existingReport = student.reportCards?.[0]
          return {
            studentId: student.id,
            discipline: existingReport?.discipline || "",
            cleanliness: existingReport?.cleanliness || "",
            classWorkPresentation: existingReport?.classWorkPresentation || "",
            adherenceToSchool: existingReport?.adherenceToSchool || "",
            coCurricularActivities: existingReport?.coCurricularActivities || "",
            considerationToOthers: existingReport?.considerationToOthers || "",
            speakingEnglish: existingReport?.speakingEnglish || "",
            classTeacherComment: existingReport?.classTeacherComment || "",
            hasExistingReport: !!existingReport,
            reportId: existingReport?.id,
          }
        })
        console.log("📋 Initialized bulk reports for all students:", initialReports.length)
        setBulkReports(initialReports)
      }
    } catch (error) {
      console.error("❌ Error fetching students with marks:", error)
      toast({
        title: "Error",
        description: "Failed to fetch student data",
        variant: "destructive",
      })
      setStudents([])
      calculateStatistics([])
      updatePagination(0)
    } finally {
      setIsRefreshing(false)
    }
  }

  const updatePagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1),
    }))
  }

  const calculateStatistics = (studentsData: Student[]) => {
    console.log("📊 Calculating statistics for students:", studentsData.length)

    const stats: Record<string, DivisionStatistics> = {
      BOT: { totalStudents: 0, divisions: {}, passRate: 0 },
      MID: { totalStudents: 0, divisions: {}, passRate: 0 },
      END: { totalStudents: 0, divisions: {}, passRate: 0 },
    }
    ;["BOT", "MID", "END"].forEach((examType) => {
      console.log(`📈 Calculating stats for ${examType}...`)
      const examStats = stats[examType]
      let totalStudents = 0
      let passedStudents = 0
      const divisionCounts: Record<string, number> = {}

      studentsData.forEach((student) => {
        const division = student.divisions[examType as keyof typeof student.divisions]
        if (division) {
          totalStudents++
          divisionCounts[division.division] = (divisionCounts[division.division] || 0) + 1
          if (division.division !== "FAIL") {
            passedStudents++
          }
        }
      })

      examStats.totalStudents = totalStudents
      examStats.divisions = divisionCounts
      examStats.passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0

      console.log(`📊 ${examType} stats:`, examStats)
    })

    console.log("📈 Final statistics:", stats)
    setStatistics(stats)
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📝 Creating individual report:", reportForm)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/report-cards/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportForm),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Report created/updated successfully:", data)
        toast({
          title: "Success",
          description: data.isUpdate ? "Report card updated successfully" : "Report card created successfully",
        })
        setIsCreateDialogOpen(false)
        resetReportForm()
        fetchStudentsWithMarks()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save report card")
      }
    } catch (error) {
      console.error("❌ Error creating report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save report card",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkCreateReports = async () => {
    console.log("📝 Creating bulk reports:", bulkReports)
    setIsSubmitting(true)

    try {
      // Filter out reports that have at least one field filled
      const validReports = bulkReports.filter(
        (report) =>
          report.discipline ||
          report.cleanliness ||
          report.classWorkPresentation ||
          report.adherenceToSchool ||
          report.coCurricularActivities ||
          report.considerationToOthers ||
          report.speakingEnglish ||
          report.classTeacherComment,
      )

      console.log("📋 Valid reports to submit:", validReports)

      if (validReports.length === 0) {
        toast({
          title: "Warning",
          description: "Please fill at least one field for each student report",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/report-cards/bulk-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportCards: validReports,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Bulk reports processed successfully:", data)
        toast({
          title: "Success",
          description: `${data.successful || validReports.length} report cards processed successfully. ${data.failed || 0} failed.`,
        })
        setIsCreateDialogOpen(false)
        resetReportForm()
        fetchStudentsWithMarks()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process bulk report cards")
      }
    } catch (error) {
      console.error("❌ Error creating bulk reports:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process bulk report cards",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.append("classId", selectedClass)
      if (selectedTerm) params.append("termId", selectedTerm)
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear)

      const response = await fetch(`/api/teacher/classes/${selectedClass}/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `class-performance-${selectedClass}-${selectedTerm}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: "Success",
          description: "Performance data exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const resetReportForm = () => {
    setReportForm({
      studentId: "",
      discipline: "",
      cleanliness: "",
      classWorkPresentation: "",
      adherenceToSchool: "",
      coCurricularActivities: "",
      considerationToOthers: "",
      speakingEnglish: "",
      classTeacherComment: "",
    })
    setBulkReports([])
  }

  const getBehavioralGradeOptions = () => {
    return BEHAVIORAL_GRADES.map((grade) => ({
      value: grade.value,
      label: grade.label,
    }))
  }

  const handleOpenCreateDialog = (mode: "individual" | "bulk") => {
    console.log(`🔧 Opening create dialog in ${mode} mode`)
    setCreateMode(mode)
    if (mode === "bulk") {
      // Initialize bulk reports with existing data for ALL students
      console.log("📋 Initializing bulk reports for ALL students:", students.length)
      const initialReports = students.map((student) => {
        const existingReport = student.reportCards?.[0]
        console.log(`📝 Student ${student.name} existing report:`, existingReport)
        return {
          studentId: student.id,
          discipline: existingReport?.discipline || "",
          cleanliness: existingReport?.cleanliness || "",
          classWorkPresentation: existingReport?.classWorkPresentation || "",
          adherenceToSchool: existingReport?.adherenceToSchool || "",
          coCurricularActivities: existingReport?.coCurricularActivities || "",
          considerationToOthers: existingReport?.considerationToOthers || "",
          speakingEnglish: existingReport?.speakingEnglish || "",
          classTeacherComment: existingReport?.classTeacherComment || "",
          hasExistingReport: !!existingReport,
          reportId: existingReport?.id,
        }
      })
      console.log("📋 Initialized bulk reports for ALL students:", initialReports.length)
      setBulkReports(initialReports)
    }
    setIsCreateDialogOpen(true)
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    setSelectedStudent(student || null)

    // Pre-fill form with existing report data if available
    const existingReport = student?.reportCards?.[0]
    console.log("📝 Selected student report data:", existingReport)
    if (existingReport) {
      setReportForm({
        studentId,
        discipline: existingReport.discipline || "",
        cleanliness: existingReport.cleanliness || "",
        classWorkPresentation: existingReport.classWorkPresentation || "",
        adherenceToSchool: existingReport.adherenceToSchool || "",
        coCurricularActivities: existingReport.coCurricularActivities || "",
        considerationToOthers: existingReport.considerationToOthers || "",
        speakingEnglish: existingReport.speakingEnglish || "",
        classTeacherComment: existingReport.classTeacherComment || "",
      })
    } else {
      setReportForm({ ...reportForm, studentId })
    }
  }

  const updateBulkReport = (studentId: string, field: string, value: string) => {
    console.log(`📝 Updating bulk report for student ${studentId}, field ${field}, value ${value}`)
    setBulkReports((prev) =>
      prev.map((report) => (report.studentId === studentId ? { ...report, [field]: value } : report)),
    )
  }

  const getFilteredStudents = () => {
    let filtered = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by division
    if (divisionFilter !== "all") {
      filtered = filtered.filter((student) => {
        const division = student.divisions[selectedExamType]
        return division?.division === divisionFilter
      })
    }

    // Filter by report status
    if (reportStatusFilter !== "all") {
      if (reportStatusFilter === "has_report") {
        filtered = filtered.filter((student) => student.reportCards.length > 0)
      } else if (reportStatusFilter === "no_report") {
        filtered = filtered.filter((student) => student.reportCards.length === 0)
      } else if (reportStatusFilter === "approved") {
        filtered = filtered.filter((student) => student.reportCards.some((report) => report.isApproved))
      } else if (reportStatusFilter === "pending") {
        filtered = filtered.filter((student) => student.reportCards.some((report) => !report.isApproved))
      }
    }

    return filtered
  }

  const getPaginatedStudents = () => {
    const filtered = getFilteredStudents()
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(newPage, prev.totalPages)),
    }))
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage: newItemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / newItemsPerPage),
    }))
  }

  const filteredStudents = getFilteredStudents()
  const paginatedStudents = getPaginatedStudents()
  const currentStats = statistics[selectedExamType] || {
    totalStudents: 0,
    divisions: {},
    passRate: 0,
  }

  const getDivisionProgress = (division: string) => {
    const count = currentStats.divisions[division] || 0
    const percentage = currentStats.totalStudents > 0 ? (count / currentStats.totalStudents) * 100 : 0
    return Math.round(percentage)
  }

  // Update pagination when filtered students change
  useEffect(() => {
    const totalPages = Math.ceil(filteredStudents.length / pagination.itemsPerPage)
    setPagination((prev) => ({
      ...prev,
      totalItems: filteredStudents.length,
      totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1),
    }))
  }, [filteredStudents.length, pagination.itemsPerPage])

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600">Loading teacher reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Performance & Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Division-based academic performance using 4 general subjects and behavioral assessments
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Using {gradingSystem.length} grade levels • {students.length} students loaded
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={fetchStudentsWithMarks}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="bg-white hover:bg-gray-50 text-xs sm:text-sm transition-colors"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => setIsAnalyticsDialogOpen(true)}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-blue-50 text-xs sm:text-sm transition-colors"
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
          <Button
            onClick={handleExportData}
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="bg-white hover:bg-green-50 text-xs sm:text-sm transition-colors"
          >
            <Download className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isExporting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => handleOpenCreateDialog("individual")}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm transition-colors"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Individual</span>
          </Button>
          <Button
            onClick={() => handleOpenCreateDialog("bulk")}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-purple-50 text-xs sm:text-sm transition-colors"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Bulk</span>
          </Button>
        </div>
      </div>

      {/* Division Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Division I</span>
              <span className="sm:hidden">Div I</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{currentStats.divisions.DIVISION_1 || 0}</div>
            <div className="text-xs opacity-80">Agg: 4-12</div>
            <Progress value={getDivisionProgress("DIVISION_1")} className="mt-1 sm:mt-2 bg-emerald-400 h-1 sm:h-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Division II</span>
              <span className="sm:hidden">Div II</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{currentStats.divisions.DIVISION_2 || 0}</div>
            <div className="text-xs opacity-80">Agg: 13-24</div>
            <Progress value={getDivisionProgress("DIVISION_2")} className="mt-1 sm:mt-2 bg-blue-400 h-1 sm:h-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Division III</span>
              <span className="sm:hidden">Div III</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{currentStats.divisions.DIVISION_3 || 0}</div>
            <div className="text-xs opacity-80">Agg: 25-32</div>
            <Progress value={getDivisionProgress("DIVISION_3")} className="mt-1 sm:mt-2 bg-amber-400 h-1 sm:h-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Division IV</span>
              <span className="sm:hidden">Div IV</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{currentStats.divisions.DIVISION_4 || 0}</div>
            <div className="text-xs opacity-80">Agg: 33-35</div>
            <Progress value={getDivisionProgress("DIVISION_4")} className="mt-1 sm:mt-2 bg-orange-400 h-1 sm:h-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ungraded</span>
              <span className="sm:hidden">Ungrd</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{currentStats.divisions.UNGRADED || 0}</div>
            <div className="text-xs opacity-80">Agg: 36</div>
            <Progress value={getDivisionProgress("UNGRADED")} className="mt-1 sm:mt-2 bg-purple-400 h-1 sm:h-2" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Pass Rate</span>
              <span className="sm:hidden">Pass</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{currentStats.passRate}%</div>
            <div className="text-xs opacity-80">Success</div>
            <Progress value={currentStats.passRate} className="mt-1 sm:mt-2 bg-rose-400 h-1 sm:h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              Filters & Search
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden bg-transparent"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            >
              {isMobileFiltersOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`${isMobileFiltersOpen ? "block" : "hidden"} sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm hover:border-emerald-300 focus:border-emerald-500 transition-colors"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="text-sm hover:border-emerald-300 transition-colors">
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
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="text-sm hover:border-emerald-300 transition-colors">
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
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="text-sm hover:border-emerald-300 transition-colors">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.isCurrent && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedExamType}
              onValueChange={(value) => setSelectedExamType(value as "BOT" | "MID" | "END")}
            >
              <SelectTrigger className="text-sm hover:border-emerald-300 transition-colors">
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOT">BOT</SelectItem>
                <SelectItem value="MID">MID</SelectItem>
                <SelectItem value="END">END</SelectItem>
              </SelectContent>
            </Select>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="text-sm hover:border-emerald-300 transition-colors">
                <SelectValue placeholder="Filter by division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="DIVISION_1">Division I</SelectItem>
                <SelectItem value="DIVISION_2">Division II</SelectItem>
                <SelectItem value="DIVISION_3">Division III</SelectItem>
                <SelectItem value="DIVISION_4">Division IV</SelectItem>
                <SelectItem value="UNGRADED">Ungraded</SelectItem>
                <SelectItem value="FAIL">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
              <SelectTrigger className="text-sm hover:border-emerald-300 transition-colors">
                <SelectValue placeholder="Filter by report status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="has_report">Has Report</SelectItem>
                <SelectItem value="no_report">No Report</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table with Divisions */}
      <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Student Performance - {terms.find((t) => t.id === selectedTerm)?.name} ({selectedExamType})
              </CardTitle>
              <CardDescription className="text-sm">
                Division-based performance using 4 general subjects only. Showing {paginatedStudents.length} of{" "}
                {filteredStudents.length} students.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-xs sm:text-sm hover:bg-blue-100 transition-colors">
                <GraduationCap className="w-3 h-3 mr-1" />
                {currentStats.totalStudents} Students
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-xs sm:text-sm hover:bg-green-100 transition-colors">
                <Star className="w-3 h-3 mr-1" />
                {currentStats.passRate}% Pass Rate
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3 p-3">
            {paginatedStudents.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedStudents.map((student) => {
                const currentReport = student.reportCards?.[0]
                return (
                  <Card
                    key={student.id}
                    className="border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-sm truncate">{student.name}</h3>
                              <p className="text-xs text-gray-500">
                                {student.class.name} • {student.gender}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setIsViewDialogOpen(true)
                                }}
                                className="h-7 w-7 p-0 hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleStudentSelect(student.id)
                                  setCreateMode("individual")
                                  setIsCreateDialogOpen(true)
                                }}
                                className="h-7 w-7 p-0 hover:bg-emerald-50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Divisions */}
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {["BOT", "MID", "END"].map((examType) => {
                              const division = student.divisions[examType as keyof typeof student.divisions]
                              return (
                                <div key={examType} className="text-center">
                                  <div className="text-xs font-medium text-gray-600 mb-1">{examType}</div>
                                  {division ? (
                                    <div className="space-y-1">
                                      <Badge className={`${getDivisionColor(division.division)} text-xs px-1 py-0`}>
                                        {division.label}
                                      </Badge>
                                      <div className="text-xs text-gray-500">Agg: {division.aggregate}</div>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      No Data
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Report Status */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Report:</span>
                            {currentReport ? (
                              <div className="flex gap-1">
                                <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">Created</Badge>
                                <Badge
                                  className={`text-xs px-1 py-0 ${
                                    currentReport.isApproved
                                      ? "bg-green-100 text-green-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {currentReport.isApproved ? "Approved" : "Pending"}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 text-xs px-1 py-0">
                                No Report
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-50">
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>BOT Division</TableHead>
                    <TableHead>MID Division</TableHead>
                    <TableHead>END Division</TableHead>
                    <TableHead>Report Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No students found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student, index) => {
                      const currentReport = student.reportCards?.[0]
                      return (
                        <TableRow
                          key={student.id}
                          className={`hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all ${
                            index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">{student.name}</span>
                                <div className="text-xs text-gray-500">{student.gender}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="hover:bg-gray-200 transition-colors">
                              {student.class.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {student.divisions.BOT ? (
                              <div className="space-y-1">
                                <Badge className={getDivisionColor(student.divisions.BOT.division)}>
                                  {student.divisions.BOT.label}
                                </Badge>
                                <div className="text-xs text-gray-500">Agg: {student.divisions.BOT.aggregate}</div>
                                <div className="text-xs text-gray-400">
                                  Top 4 General: {student.divisions.BOT.subjects.map((s) => s.grade).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400 text-sm">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No data
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.divisions.MID ? (
                              <div className="space-y-1">
                                <Badge className={getDivisionColor(student.divisions.MID.division)}>
                                  {student.divisions.MID.label}
                                </Badge>
                                <div className="text-xs text-gray-500">Agg: {student.divisions.MID.aggregate}</div>
                                <div className="text-xs text-gray-400">
                                  Top 4 General: {student.divisions.MID.subjects.map((s) => s.grade).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400 text-sm">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No data
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.divisions.END ? (
                              <div className="space-y-1">
                                <Badge className={getDivisionColor(student.divisions.END.division)}>
                                  {student.divisions.END.label}
                                </Badge>
                                <div className="text-xs text-gray-500">Agg: {student.divisions.END.aggregate}</div>
                                <div className="text-xs text-gray-400">
                                  Top 4 General: {student.divisions.END.subjects.map((s) => s.grade).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400 text-sm">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No data
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {currentReport ? (
                              <div className="space-y-1">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Report Created
                                </Badge>
                                <Badge
                                  className={`transition-colors ${
                                    currentReport.isApproved
                                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                                      : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                                  }`}
                                >
                                  {currentReport.isApproved ? "Approved" : "Pending"}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 hover:bg-gray-50 transition-colors">
                                No Report
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setIsViewDialogOpen(true)
                                }}
                                className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleStudentSelect(student.id)
                                  setCreateMode("individual")
                                  setIsCreateDialogOpen(true)
                                }}
                                className="hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-gray-50/50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <Select
                value={pagination.itemsPerPage.toString()}
                onValueChange={(value) => handleItemsPerPageChange(Number.parseInt(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                of {filteredStudents.length} students (Page {pagination.currentPage} of {pagination.totalPages})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="hover:bg-emerald-50 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="hover:bg-emerald-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNumber = Math.max(
                    1,
                    Math.min(pagination.currentPage - 2 + i, pagination.totalPages - 4 + i),
                  )
                  if (pageNumber > pagination.totalPages) return null
                  return (
                    <Button
                      key={pageNumber}
                      variant={pagination.currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-8 h-8 p-0 ${
                        pagination.currentPage === pageNumber
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "hover:bg-emerald-50"
                      } transition-colors`}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="hover:bg-emerald-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="hover:bg-emerald-50 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Class Performance Analytics
            </DialogTitle>
            <DialogDescription>Comprehensive analysis of student performance across all exam types</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["BOT", "MID", "END"].map((examType) => {
                const stats = statistics[examType] || { totalStudents: 0, divisions: {}, passRate: 0 }
                return (
                  <Card key={examType} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-emerald-700">{examType} Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Students</span>
                        <Badge variant="outline" className="hover:bg-gray-50 transition-colors">
                          {stats.totalStudents}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pass Rate</span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                          {stats.passRate}%
                        </Badge>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        {Object.entries(stats.divisions).map(([division, count]) => (
                          <div key={division} className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">{division.replace("DIVISION_", "Div ")}</span>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={stats.totalStudents > 0 ? ((count as number) / stats.totalStudents) * 100 : 0}
                                className="w-16 h-2"
                              />
                              <span className="text-xs font-medium w-6">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Performance Trends */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-emerald-700">Performance Trends</CardTitle>
                <CardDescription>Student performance comparison across exam types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.slice(0, 10).map((student, index) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        index % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={student.photo || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {["BOT", "MID", "END"].map((examType) => {
                          const division = student.divisions[examType as keyof typeof student.divisions]
                          return (
                            <Badge
                              key={examType}
                              className={`transition-colors ${
                                division ? getDivisionColor(division.division) : "bg-gray-100 text-gray-400"
                              }`}
                              variant="outline"
                            >
                              {examType}: {division ? division.label : "N/A"}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">
              {createMode === "individual" ? "Create/Edit Individual Report" : "Bulk Create/Update Reports"}
            </DialogTitle>
            <DialogDescription>
              {createMode === "individual"
                ? "Create or update a behavioral assessment report for a single student"
                : "Create or update behavioral assessment reports for multiple students at once"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as "individual" | "bulk")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="data-[state=active]:bg-emerald-100">
                Individual Student
              </TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:bg-emerald-100">
                Bulk Class Creation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <Label htmlFor="student">Select Student</Label>
                  <Select value={reportForm.studentId} onValueChange={handleStudentSelect}>
                    <SelectTrigger className="hover:border-emerald-300 transition-colors">
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.class.name}
                          {student.reportCards.length > 0 && " (Has Report)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show individual student divisions if selected */}
                {selectedStudent && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-medium mb-3 flex items-center text-emerald-700">
                      <Trophy className="w-4 h-4 mr-2" />
                      {selectedStudent.name}'s Academic Performance (Divisions)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["BOT", "MID", "END"].map((examType) => {
                        const division = selectedStudent.divisions[examType as keyof typeof selectedStudent.divisions]
                        return (
                          <div key={examType} className="bg-white p-4 rounded border hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-sm">{examType}</span>
                              {division ? (
                                <Badge className={getDivisionColor(division.division)}>{division.label}</Badge>
                              ) : (
                                <Badge variant="outline">No Data</Badge>
                              )}
                            </div>
                            {division && (
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Aggregate: {division.aggregate}</div>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-600">Top 4 General Subjects:</div>
                                  {division.subjects.map((subject) => (
                                    <div key={subject.subjectId} className="flex justify-between text-xs">
                                      <span>{subject.subjectName}</span>
                                      <span className="font-medium">
                                        {subject.grade} ({subject.gradeValue}){subject.score && ` - ${subject.score}%`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Behavioral Assessment Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "discipline", label: "Discipline" },
                    { key: "cleanliness", label: "Cleanliness" },
                    { key: "classWorkPresentation", label: "Class Work Presentation" },
                    { key: "adherenceToSchool", label: "Adherence to School Rules" },
                    { key: "coCurricularActivities", label: "Co-Curricular Activities" },
                    { key: "considerationToOthers", label: "Consideration to Others" },
                    { key: "speakingEnglish", label: "Speaking English" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Select
                        value={reportForm[field.key as keyof typeof reportForm]}
                        onValueChange={(value) => setReportForm({ ...reportForm, [field.key]: value })}
                      >
                        <SelectTrigger className="hover:border-emerald-300 transition-colors">
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {getBehavioralGradeOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classTeacherComment">Class Teacher Comment</Label>
                  <Textarea
                    id="classTeacherComment"
                    placeholder="Enter your comment about the student's behavior and performance..."
                    value={reportForm.classTeacherComment}
                    onChange={(e) => setReportForm({ ...reportForm, classTeacherComment: e.target.value })}
                    rows={3}
                    className="hover:border-emerald-300 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!reportForm.studentId || isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Saving..." : "Save Report"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              {students.length > 0 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-emerald-900 mb-2">Bulk Report Management</h3>
                    <p className="text-emerald-700 text-sm">
                      Create new reports or update existing ones for all students in the class. Academic performance
                      shows division-based results using top 4 general subjects only.
                    </p>
                    <p className="text-emerald-600 text-xs mt-1">
                      Behavioral grades: A-Very Good, B-Good, C-Fair, D-Needs Improvement
                    </p>
                  </div>

                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-4">
                      {students.map((student, index) => {
                        const bulkReport = bulkReports[index]
                        return (
                          <Card
                            key={student.id}
                            className={`border-2 transition-all hover:shadow-md ${
                              bulkReport?.hasExistingReport
                                ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                                : "border-gray-200 hover:border-emerald-200"
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={student.photo || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                      {student.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <CardTitle className="text-base">{student.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                      {student.class.name}
                                      {bulkReport?.hasExistingReport && (
                                        <Badge variant="outline" className="text-xs">
                                          <Edit className="w-3 h-3 mr-1" />
                                          Editing Existing
                                        </Badge>
                                      )}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {student.divisions[selectedExamType] && (
                                    <Badge className={getDivisionColor(student.divisions[selectedExamType]!.division)}>
                                      {student.divisions[selectedExamType]!.label}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              {/* Division Performance Display */}
                              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                {["BOT", "MID", "END"].map((examType) => {
                                  const division = student.divisions[examType as keyof typeof student.divisions]
                                  return (
                                    <div key={examType} className="text-center">
                                      <div className="text-xs font-medium text-gray-600 mb-1">{examType}</div>
                                      {division ? (
                                        <div className="space-y-1">
                                          <Badge
                                            className={`${getDivisionColor(division.division)} text-xs`}
                                            variant="outline"
                                          >
                                            {division.label}
                                          </Badge>
                                          <div className="text-xs text-gray-500">Agg: {division.aggregate}</div>
                                          <div className="text-xs text-gray-400">
                                            {division.subjects.map((s) => s.grade).join(", ")}
                                          </div>
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          No Data
                                        </Badge>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Behavioral Assessment */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  { key: "discipline", label: "Discipline" },
                                  { key: "cleanliness", label: "Cleanliness" },
                                  { key: "classWorkPresentation", label: "Class Work" },
                                  { key: "adherenceToSchool", label: "School Rules" },
                                  { key: "coCurricularActivities", label: "Co-Curricular" },
                                  { key: "considerationToOthers", label: "Consideration" },
                                  { key: "speakingEnglish", label: "Speaking English" },
                                ].map((field) => (
                                  <div key={field.key} className="space-y-1">
                                    <Label className="text-xs">{field.label}</Label>
                                    <Select
                                      value={bulkReports[index]?.[field.key] || ""}
                                      onValueChange={(value) => updateBulkReport(student.id, field.key, value)}
                                    >
                                      <SelectTrigger className="h-8 hover:border-emerald-300 transition-colors">
                                        <SelectValue placeholder="Grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getBehavioralGradeOptions().map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Comment</Label>
                                <Textarea
                                  placeholder="Class teacher comment..."
                                  value={bulkReports[index]?.classTeacherComment || ""}
                                  onChange={(e) => updateBulkReport(student.id, "classTeacherComment", e.target.value)}
                                  rows={2}
                                  className="text-sm hover:border-emerald-300 transition-colors"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkCreateReports}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Processing..." : `Save ${students.length} Reports`}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-700">Comprehensive Student Profile</DialogTitle>
            <DialogDescription>Complete academic performance and behavioral assessment overview</DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 via-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={selectedStudent.photo || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg sm:text-xl bg-emerald-100 text-emerald-700">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-800">{selectedStudent.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                    <Badge variant="secondary" className="text-sm hover:bg-gray-200 transition-colors">
                      {selectedStudent.class.name}
                    </Badge>
                    <Badge variant="outline" className="text-sm hover:bg-gray-50 transition-colors">
                      {selectedStudent.gender}
                    </Badge>
                    <Badge variant="outline" className="text-sm hover:bg-gray-50 transition-colors">
                      ID: {selectedStudent.id.slice(-6)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Academic Year</div>
                  <div className="font-medium text-emerald-700">
                    {academicYears.find((year) => year.id === selectedAcademicYear)?.name}
                  </div>
                </div>
              </div>

              {/* Academic Performance - Divisions */}
              <Card className="border-2 border-emerald-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-700">Academic Performance Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Division-based performance across all exam types using top 4 general subjects only
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {["BOT", "MID", "END"].map((examType) => {
                      const division = selectedStudent.divisions[examType as keyof typeof selectedStudent.divisions]
                      return (
                        <div
                          key={examType}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="font-bold text-lg text-emerald-700">{examType}</span>
                              <div className="text-xs text-gray-500">
                                {examType === "BOT" && "Beginning of Term"}
                                {examType === "MID" && "Mid Term"}
                                {examType === "END" && "End of Term"}
                              </div>
                            </div>
                            {division ? (
                              <Badge className={getDivisionColor(division.division)} variant="outline">
                                {division.label}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100">
                                No Data
                              </Badge>
                            )}
                          </div>

                          {division && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-2 bg-white rounded border">
                                <span className="text-sm font-medium">Aggregate Score</span>
                                <Badge className="bg-emerald-100 text-emerald-800">{division.aggregate}</Badge>
                              </div>

                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-600 mb-2">Top 4 General Subjects:</div>
                                {division.subjects.map((subject) => (
                                  <div
                                    key={subject.subjectId}
                                    className="flex justify-between items-center p-2 bg-white rounded text-sm border hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="font-medium">{subject.subjectName}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {subject.grade}
                                      </Badge>
                                      <span className="text-xs text-gray-500">({subject.gradeValue})</span>
                                      {subject.score && <span className="text-xs text-gray-400">{subject.score}%</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Marks Summary */}
              {selectedStudent.marks.length > 0 && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700">Subject Marks Summary</span>
                    </CardTitle>
                    <CardDescription>
                      Detailed marks breakdown for {terms.find((t) => t.id === selectedTerm)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50">
                            <TableHead>Subject</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>BOT</TableHead>
                            <TableHead>MID</TableHead>
                            <TableHead>END</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedStudent.marks.map((mark, index) => {
                            // Find subject category from class subjects
                            const classSubject = classes
                              .find((cls) => cls.id === selectedClass)
                              ?.subjects.find((sub) => sub.id === mark.subject.id)
                            return (
                              <TableRow
                                key={mark.id}
                                className={`transition-colors ${
                                  index % 2 === 0 ? "bg-gray-50/50 hover:bg-emerald-50" : "bg-white hover:bg-emerald-50"
                                }`}
                              >
                                <TableCell className="font-medium">{mark.subject.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={classSubject?.category === "GENERAL" ? "GENERAL" : "SUBSIDIARY"}
                                    className="text-xs"
                                  >
                                    {classSubject?.category || ""}
                                  </Badge>
                                </TableCell>
                                <TableCell>{mark.bot || "-"}</TableCell>
                                <TableCell>{mark.midterm || "-"}</TableCell>
                                <TableCell>{mark.eot || "-"}</TableCell>
                                <TableCell className="font-medium">{mark.total || "-"}</TableCell>
                                <TableCell>
                                  {mark.grade && (
                                    <Badge variant="outline" className="hover:bg-gray-50 transition-colors">
                                      {mark.grade}
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

              {/* Parent Information */}
              {selectedStudent.parent && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700">Parent/Guardian Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded border hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Parent Name</div>
                          <div className="font-medium text-emerald-700">{selectedStudent.parent.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded border hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Email Address</div>
                          <div className="font-medium text-teal-700">{selectedStudent.parent.email}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Report Cards History */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-700">
                      Behavioral Assessment Reports ({selectedStudent.reportCards.length})
                    </span>
                  </CardTitle>
                  <CardDescription>Complete history of behavioral assessments and teacher comments</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedStudent.reportCards.length > 0 ? (
                    <div className="space-y-4">
                      {selectedStudent.reportCards.map((report, index) => (
                        <div
                          key={report.id}
                          className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <FileText className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <span className="font-medium">Report #{report.id.slice(-8)}</span>
                                <div className="text-xs text-gray-500">
                                  Created: {new Date(report.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`transition-colors ${
                                  report.isApproved
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                                }`}
                              >
                                {report.isApproved ? "Approved" : "Pending Approval"}
                              </Badge>
                              {report.approvedAt && (
                                <div className="text-xs text-gray-500">
                                  Approved: {new Date(report.approvedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {[
                              { key: "discipline", label: "Discipline", value: report.discipline },
                              { key: "cleanliness", label: "Cleanliness", value: report.cleanliness },
                              {
                                key: "classWorkPresentation",
                                label: "Class Work",
                                value: report.classWorkPresentation,
                              },
                              { key: "adherenceToSchool", label: "School Rules", value: report.adherenceToSchool },
                              {
                                key: "coCurricularActivities",
                                label: "Co-Curricular",
                                value: report.coCurricularActivities,
                              },
                              {
                                key: "considerationToOthers",
                                label: "Consideration",
                                value: report.considerationToOthers,
                              },
                              { key: "speakingEnglish", label: "Speaking English", value: report.speakingEnglish },
                            ].map((field) => (
                              <div
                                key={field.key}
                                className="text-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                              >
                                <div className="text-xs text-gray-600 mb-1">{field.label}</div>
                                <Badge variant="outline" className="text-sm">
                                  {getBehavioralGradeDisplay(field.value || "")}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          {report.classTeacherComment && (
                            <div className="bg-white p-3 rounded border hover:bg-gray-50 transition-colors">
                              <div className="text-sm font-medium text-emerald-700 mb-2">Class Teacher Comment:</div>
                              <p className="text-sm text-gray-600 italic">"{report.classTeacherComment}"</p>
                            </div>
                          )}
                          {report.headteacherComment && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2 hover:bg-blue-100 transition-colors">
                              <div className="text-sm font-medium text-blue-700 mb-2">Head Teacher Comment:</div>
                              <p className="text-sm text-blue-600 italic">"{report.headteacherComment}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No behavioral assessment reports found</p>
                      <p className="text-gray-400 text-sm">
                        Create a report to track this student's behavioral progress
                      </p>
                      <Button
                        onClick={() => {
                          handleStudentSelect(selectedStudent.id)
                          setCreateMode("individual")
                          setIsViewDialogOpen(false)
                          setIsCreateDialogOpen(true)
                        }}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Report
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleStudentSelect(selectedStudent.id)
                    setCreateMode("individual")
                    setIsViewDialogOpen(false)
                    setIsCreateDialogOpen(true)
                  }}
                  className="w-full sm:w-auto hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {selectedStudent.reportCards.length > 0 ? "Edit Report" : "Create Report"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="w-full sm:w-auto hover:bg-gray-50 transition-colors"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
