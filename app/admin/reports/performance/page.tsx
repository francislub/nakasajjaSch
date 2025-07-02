"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Search, TrendingUp, TrendingDown, Users, BarChart3, Target, Star, FileText } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
)

interface StudentPerformance {
  id: string
  name: string
  photo?: string
  class: {
    id: string
    name: string
  }
  averageMark: number
  totalSubjects: number
  highestMark: number
  lowestMark: number
  trend: "up" | "down" | "stable"
  subjectPerformance: Array<{
    subject: string
    average: number
    grade: string
  }>
  termProgress: Array<{
    term: string
    average: number
  }>
}

interface PerformanceStats {
  totalStudents: number
  averagePerformance: number
  topPerformers: number
  needsImprovement: number
  subjectAverages: Array<{
    subject: string
    average: number
    studentCount: number
  }>
  gradeDistribution: {
    D1: number
    D2: number
    C3: number
    C4: number
    C5: number
    C6: number
    P7: number
    P8: number
    F9: number
  }
  classPerformance: Array<{
    classId: string
    className: string
    average: number
    studentCount: number
    topPerformers: number
    needsImprovement: number
  }>
  performanceTrend: Array<{
    month: string
    average: number
  }>
}

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
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

export default function AdminPerformanceReportsPage() {
  const [students, setStudents] = useState<StudentPerformance[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchStudentPerformance()
      fetchStats()
    }
  }, [selectedClass, selectedSubject, searchTerm, performanceFilter, selectedAcademicYear, selectedTerm])

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchTerms(selectedAcademicYear)
    }
  }, [selectedAcademicYear])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([fetchClasses(), fetchSubjects(), fetchAcademicYears()])
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStudentPerformance = async () => {
    if (!selectedAcademicYear) return

    try {
      const params = new URLSearchParams()
      params.append("academicYearId", selectedAcademicYear)
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedSubject && selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      if (searchTerm) params.append("search", searchTerm)
      if (performanceFilter && performanceFilter !== "all") params.append("performance", performanceFilter)

      const response = await fetch(`/api/admin/reports/performance?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error("Failed to fetch student performance")
        setStudents([])
      }
    } catch (error) {
      console.error("Error fetching student performance:", error)
      setStudents([])
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      } else {
        setClasses([])
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
      setClasses([])
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/subjects")
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      } else {
        setSubjects([])
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
      setSubjects([])
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch("/api/academic-years")
      if (response.ok) {
        const data = await response.json()
        setAcademicYears(data || [])
        // Set active academic year as default
        const activeYear = data?.find((year: AcademicYear) => year.isActive)
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id)
          fetchTerms(activeYear.id)
        }
      } else {
        setAcademicYears([])
      }
    } catch (error) {
      console.error("Error fetching academic years:", error)
      setAcademicYears([])
    }
  }

  const fetchTerms = async (academicYearId: string) => {
    try {
      const response = await fetch(`/api/terms?academicYearId=${academicYearId}`)
      if (response.ok) {
        const data = await response.json()
        setTerms(data || [])
      } else {
        setTerms([])
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
      setTerms([])
    }
  }

  const fetchStats = async () => {
    if (!selectedAcademicYear) return

    try {
      const params = new URLSearchParams()
      params.append("academicYearId", selectedAcademicYear)
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedSubject && selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)

      const response = await fetch(`/api/admin/reports/performance/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error("Failed to fetch performance stats")
      }
    } catch (error) {
      console.error("Error fetching performance stats:", error)
    }
  }

  const generatePerformancePDF = () => {
    if (!stats) return ""

    const currentDate = new Date().toLocaleDateString()
    const academicYear = academicYears.find((y) => y.id === selectedAcademicYear)?.year || ""
    const term = selectedTerm !== "all" ? terms.find((t) => t.id === selectedTerm)?.name || "" : "All Terms"
    const className = selectedClass !== "all" ? classes.find((c) => c.id === selectedClass)?.name || "" : "All Classes"
    const subjectName =
      selectedSubject !== "all" ? subjects.find((s) => s.id === selectedSubject)?.name || "" : "All Subjects"

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Performance Report</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #2563eb;
          }
          
          .school-motto {
            font-style: italic;
            margin-bottom: 10px;
            color: #666;
          }
          
          .report-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 15px;
            color: #333;
          }
          
          .report-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
          }
          
          .info-section {
            flex: 1;
          }
          
          .info-label {
            font-weight: bold;
            color: #555;
          }
          
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background-color: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          
          .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          
          .performance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          
          .performance-table th,
          .performance-table td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: center;
          }
          
          .performance-table th {
            background-color: #7c3aed;
            color: white;
            font-weight: bold;
          }
          
          .performance-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .performance-table tr:hover {
            background-color: #e3f2fd;
          }
          
          .total-row {
            background-color: #e3f2fd !important;
            font-weight: bold;
          }
          
          .grade-distribution {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .grade-card {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid #ddd;
          }
          
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .signature-box {
            text-align: center;
            min-width: 200px;
          }
          
          .signature-line {
            border-bottom: 2px solid #333;
            margin-bottom: 10px;
            height: 40px;
          }
          
          .signature-label {
            font-weight: bold;
            color: #555;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">HOLY FAMILY JUNIOR SCHOOL-NAKASAJJA</div>
          <div class="school-motto">"TIMOR DEI PRINCIPUM SAPIENTIAE"</div>
          <div>P.O BOX 25258, KAMPALA 'U'</div>
          <div>TEL: 0774-305717 / 0704-305747 / 0784-450896/0709-986390</div>
          <div class="report-title">ACADEMIC PERFORMANCE REPORT</div>
        </div>

        <div class="report-info">
          <div class="info-section">
            <div><span class="info-label">Academic Year:</span> ${academicYear}</div>
            <div><span class="info-label">Term:</span> ${term}</div>
            <div><span class="info-label">Class:</span> ${className}</div>
            <div><span class="info-label">Subject:</span> ${subjectName}</div>
          </div>
          <div class="info-section">
            <div><span class="info-label">Report Generated:</span> ${currentDate}</div>
            <div><span class="info-label">Total Students:</span> ${stats.totalStudents}</div>
            <div><span class="info-label">Average Performance:</span> ${stats.averagePerformance}%</div>
            <div><span class="info-label">Top Performers:</span> ${stats.topPerformers}</div>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-number">${stats.totalStudents}</div>
            <div class="stat-label">Total Students</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.averagePerformance}%</div>
            <div class="stat-label">Average Performance</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.topPerformers}</div>
            <div class="stat-label">Top Performers (80%+)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.needsImprovement}</div>
            <div class="stat-label">Need Support (<60%)</div>
          </div>
        </div>

        <h3>Grade Distribution</h3>
        <div class="grade-distribution">
          <div class="grade-card">
            <strong>D1 (80-100):</strong> ${stats.gradeDistribution.D1 || 0}
          </div>
          <div class="grade-card">
            <strong>D2 (75-79):</strong> ${stats.gradeDistribution.D2 || 0}
          </div>
          <div class="grade-card">
            <strong>C3 (70-74):</strong> ${stats.gradeDistribution.C3 || 0}
          </div>
          <div class="grade-card">
            <strong>C4 (60-69):</strong> ${stats.gradeDistribution.C4 || 0}
          </div>
          <div class="grade-card">
            <strong>C5 (55-59):</strong> ${stats.gradeDistribution.C5 || 0}
          </div>
          <div class="grade-card">
            <strong>C6 (50-54):</strong> ${stats.gradeDistribution.C6 || 0}
          </div>
          <div class="grade-card">
            <strong>P7 (45-49):</strong> ${stats.gradeDistribution.P7 || 0}
          </div>
          <div class="grade-card">
            <strong>P8 (40-44):</strong> ${stats.gradeDistribution.P8 || 0}
          </div>
          <div class="grade-card">
            <strong>F9 (0-39):</strong> ${stats.gradeDistribution.F9 || 0}
          </div>
        </div>

        <h3>Performance by Class</h3>
        <table class="performance-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Total Students</th>
              <th>Average Performance</th>
              <th>Top Performers</th>
              <th>Need Support</th>
              <th>Performance Rate</th>
            </tr>
          </thead>
          <tbody>
            ${stats.classPerformance
              .map(
                (classData) => `
              <tr>
                <td>${classData.className}</td>
                <td>${classData.studentCount}</td>
                <td>${classData.average}%</td>
                <td>${classData.topPerformers}</td>
                <td>${classData.needsImprovement}</td>
                <td>${classData.average >= 70 ? "Good" : classData.average >= 60 ? "Fair" : "Needs Improvement"}</td>
              </tr>
            `,
              )
              .join("")}
            <tr class="total-row">
              <td><strong>OVERALL</strong></td>
              <td><strong>${stats.classPerformance.reduce((sum, c) => sum + c.studentCount, 0)}</strong></td>
              <td><strong>${Math.round(stats.classPerformance.reduce((sum, c) => sum + c.average, 0) / stats.classPerformance.length)}%</strong></td>
              <td><strong>${stats.classPerformance.reduce((sum, c) => sum + c.topPerformers, 0)}</strong></td>
              <td><strong>${stats.classPerformance.reduce((sum, c) => sum + c.needsImprovement, 0)}</strong></td>
              <td><strong>${stats.averagePerformance >= 70 ? "Good" : stats.averagePerformance >= 60 ? "Fair" : "Needs Improvement"}</strong></td>
            </tr>
          </tbody>
        </table>

        ${
          stats.subjectAverages.length > 0
            ? `
          <h3>Subject Performance</h3>
          <table class="performance-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Students</th>
                <th>Average Score</th>
                <th>Performance Level</th>
              </tr>
            </thead>
            <tbody>
              ${stats.subjectAverages
                .map(
                  (subject) => `
                <tr>
                  <td>${subject.subject}</td>
                  <td>${subject.studentCount}</td>
                  <td>${subject.average}%</td>
                  <td>${subject.average >= 80 ? "Excellent" : subject.average >= 70 ? "Good" : subject.average >= 60 ? "Fair" : "Needs Improvement"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
            : ""
        }

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">ACADEMIC COORDINATOR</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">HEADTEACHER</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">DATE</div>
          </div>
        </div>

        <div class="footer">
          <p>This report is generated electronically and is valid without signature unless otherwise stated.</p>
          <p>Holy Family Junior School - Nakasajja | Generated on ${currentDate}</p>
        </div>
      </body>
      </html>
    `
  }

  const handleDownloadReport = async () => {
    if (!stats) {
      toast({
        title: "Error",
        description: "No data available for download",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)
    try {
      const htmlContent = generatePerformancePDF()
      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()

        // Auto-print after a short delay
        setTimeout(() => {
          newWindow.print()
        }, 1000)
      }

      toast({
        title: "Success",
        description: "Performance report opened for printing",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate performance report",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getPerformanceBadge = (average: number) => {
    if (average >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (average >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    if (average >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
    if (average >= 50) return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  // Chart data
  const gradeDistributionData = stats
    ? {
        labels: [
          "D1 (80-100)",
          "D2 (75-79)",
          "C3 (70-74)",
          "C4 (60-69)",
          "C5 (55-59)",
          "C6 (50-54)",
          "P7 (45-49)",
          "P8 (40-44)",
          "F9 (0-39)",
        ],
        datasets: [
          {
            data: [
              stats.gradeDistribution.D1 || 0,
              stats.gradeDistribution.D2 || 0,
              stats.gradeDistribution.C3 || 0,
              stats.gradeDistribution.C4 || 0,
              stats.gradeDistribution.C5 || 0,
              stats.gradeDistribution.C6 || 0,
              stats.gradeDistribution.P7 || 0,
              stats.gradeDistribution.P8 || 0,
              stats.gradeDistribution.F9 || 0,
            ],
            backgroundColor: [
              "#10B981",
              "#3B82F6",
              "#F59E0B",
              "#EF4444",
              "#8B5CF6",
              "#EC4899",
              "#F97316",
              "#6B7280",
              "#DC2626",
            ],
            borderWidth: 0,
          },
        ],
      }
    : null

  const subjectPerformanceData = stats
    ? {
        labels: stats.subjectAverages.map((item) => item.subject),
        datasets: [
          {
            label: "Average Score",
            data: stats.subjectAverages.map((item) => item.average),
            backgroundColor: "#3B82F6",
            borderColor: "#1D4ED8",
            borderWidth: 1,
          },
        ],
      }
    : null

  const classPerformanceData = stats
    ? {
        labels: stats.classPerformance.map((item) => item.className),
        datasets: [
          {
            label: "Class Average",
            data: stats.classPerformance.map((item) => item.average),
            backgroundColor: "#10B981",
            borderColor: "#059669",
            borderWidth: 1,
          },
        ],
      }
    : null

  const performanceTrendData = stats
    ? {
        labels: stats.performanceTrend.map((item) => item.month),
        datasets: [
          {
            label: "Average Performance",
            data: stats.performanceTrend.map((item) => item.average),
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null

  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive academic performance analysis</p>
        </div>
        <Button
          onClick={handleDownloadReport}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isDownloading || !stats}
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Download PDF Report
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
          <SelectTrigger className="w-48">
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
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-48">
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
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
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
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Performance</SelectItem>
            <SelectItem value="excellent">Excellent (80-100)</SelectItem>
            <SelectItem value="good">Good (70-79)</SelectItem>
            <SelectItem value="average">Average (60-69)</SelectItem>
            <SelectItem value="below">Below Average (50-59)</SelectItem>
            <SelectItem value="poor">Poor (0-49)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* No Data Message */}
      {!selectedAcademicYear && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Select Academic Year</h3>
            <p className="text-gray-500">Please select an academic year to view performance reports.</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Average Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averagePerformance}%</div>
              <p className="text-xs text-gray-500 mt-1">Overall average</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.topPerformers}</div>
              <p className="text-xs text-gray-500 mt-1">80% and above</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Need Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.needsImprovement}</div>
              <p className="text-xs text-gray-500 mt-1">Below 60%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Distribution of student grades</CardDescription>
              </CardHeader>
              <CardContent>
                {gradeDistributionData && (
                  <div className="h-64">
                    <Doughnut
                      data={gradeDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Academic performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceTrendData && (
                  <div className="h-64">
                    <Line
                      data={performanceTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Average performance across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectPerformanceData && (
                <div className="h-80">
                  <Bar
                    data={subjectPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Average performance by class</CardDescription>
            </CardHeader>
            <CardContent>
              {classPerformanceData && (
                <div className="h-80">
                  <Bar
                    data={classPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Long-term academic performance trends</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceTrendData && (
                <div className="h-80">
                  <Line
                    data={performanceTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Performance Table */}
      {selectedAcademicYear && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Detailed performance analysis for {filteredStudents.length} students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Highest</TableHead>
                  <TableHead>Lowest</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.class.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-lg">{student.averageMark}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.totalSubjects} subjects</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{student.highestMark}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{student.lowestMark}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">{getTrendIcon(student.trend)}</div>
                    </TableCell>
                    <TableCell>{getPerformanceBadge(student.averageMark)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredStudents.length === 0 && selectedAcademicYear && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Performance Data</h3>
                <p className="text-gray-500">No student performance data found for the selected filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
