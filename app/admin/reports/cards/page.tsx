"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Eye, FileText, CheckCircle, XCircle, Calendar, BarChart3, Loader2, Printer } from "lucide-react"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import { generateReportCardHTML } from "@/lib/report-card-generator"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface ReportCard {
  id: string
  student: {
    id: string
    name: string
    photo?: string
    class: {
      id: string
      name: string
      subjects: Array<{
        id: string
        name: string
        code: string
        category: string
      }>
    }
    parent?: {
      name: string
      email: string
    }
    marks: Array<{
      id: string
      subject: {
        id: string
        name: string
        code: string
        category: string
        subjectTeachers: Array<{
          id: string
          classId: string
          teacher: {
            id: string
            name: string
          }
        }>
      }
      total: number
      grade: string
      homework: number
      bot: number
      midterm: number
      eot: number
      remarks?: string
      createdBy?: {
        name: string
      }
      term: {
        id: string
        name: string
      }
      academicYear: {
        id: string
        year: string
      }
    }>
    term: {
      id: string
      name: string
    }
    academicYear: {
      id: string
      year: string
    }
  }
  discipline: string
  cleanliness: string
  classWorkPresentation: string
  adherenceToSchool: string
  coCurricularActivities: string
  considerationToOthers: string
  speakingEnglish: string
  classTeacherComment?: string
  headteacherComment?: string
  isApproved: boolean
  approvedAt?: string
  createdAt: string
  term: {
    id: string
    name: string
  }
  academicYear: {
    id: string
    name: string
  }
  gradingSystem?: Array<{
    id: string
    grade: string
    minMark: number
    maxMark: number
    comment?: string
  }>
}

interface Class {
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

interface ReportStats {
  totalReports: number
  approvedReports: number
  pendingReports: number
  gradeDistribution: {
    A: number
    B: number
    C: number
    D: number
  }
  classDistribution: Array<{
    className: string
    reportCount: number
  }>
}

interface ClassReportCards {
  classInfo: {
    name: string
    classTeacher?: {
      name: string
    }
  }
  reportCards: ReportCard[]
  totalStudents: number
  approvedReports: number
  pendingReports: number
  gradingSystem?: Array<{
    id: string
    grade: string
    minMark: number
    maxMark: number
    comment?: string
  }>
}

interface BulkPreviewData {
  reportCards: ReportCard[]
  totalCount: number
  gradingSystem?: Array<{
    id: string
    grade: string
    minMark: number
    maxMark: number
    comment?: string
  }>
  filters: {
    academicYear?: string
    term?: string
    class?: string
    status?: string
  }
}

export default function AdminReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null)
  const [classReportCards, setClassReportCards] = useState<ClassReportCards | null>(null)
  const [bulkPreviewData, setBulkPreviewData] = useState<BulkPreviewData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isClassPreviewOpen, setIsClassPreviewOpen] = useState(false)
  const [isBulkPreviewOpen, setIsBulkPreviewOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [gradingSystem, setGradingSystem] = useState<
    Array<{
      id: string
      grade: string
      minMark: number
      maxMark: number
      comment?: string
    }>
  >([])
  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchReportCards()
      fetchStats()
    }
  }, [selectedClass, searchTerm, statusFilter, selectedAcademicYear, selectedTerm])

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchTerms(selectedAcademicYear)
    }
  }, [selectedAcademicYear])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([fetchClasses(), fetchAcademicYears(), fetchGradingSystem()])
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

  const fetchGradingSystem = async () => {
    try {
      const response = await fetch("/api/grading-system")
      if (response.ok) {
        const data = await response.json()
        setGradingSystem(data || [])
      }
    } catch (error) {
      console.error("Error fetching grading system:", error)
    }
  }

  const fetchReportCards = async () => {
    if (!selectedAcademicYear) {
      console.log("No academic year selected, skipping fetch")
      return
    }

    try {
      const params = new URLSearchParams()
      params.append("academicYearId", selectedAcademicYear)
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)

      console.log("Fetching report cards with params:", params.toString())
      const response = await fetch(`/api/admin/reports/cards?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Report cards data:", data)
        setReportCards(data.reportCards || [])
      } else {
        console.error("Failed to fetch report cards:", response.status, response.statusText)
        const errorData = await response.json()
        console.error("Error details:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch report cards",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching report cards:", error)
      toast({
        title: "Error",
        description: "Failed to fetch report cards",
        variant: "destructive",
      })
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        console.log("Classes data:", data)
        setClasses(data.classes || [])
      } else {
        console.error("Failed to fetch classes")
        setClasses([])
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
      setClasses([])
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch("/api/academic-years")
      if (response.ok) {
        const data = await response.json()
        console.log("Academic years data:", data)
        setAcademicYears(data || [])
        // Set active academic year as default
        const activeYear = data?.find((year: AcademicYear) => year.isActive)
        if (activeYear) {
          console.log("Setting active academic year:", activeYear.id)
          setSelectedAcademicYear(activeYear.id)
          // Fetch terms for the active academic year
          fetchTerms(activeYear.id)
        }
      } else {
        console.error("Failed to fetch academic years")
        setAcademicYears([])
      }
    } catch (error) {
      console.error("Error fetching academic years:", error)
      setAcademicYears([])
    }
  }

  const fetchTerms = async (academicYearId?: string) => {
    try {
      const url = academicYearId ? `/api/terms?academicYearId=${academicYearId}` : "/api/terms"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("Terms data:", data)
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

  const fetchStats = async () => {
    if (!selectedAcademicYear) return

    try {
      const params = new URLSearchParams()
      params.append("academicYearId", selectedAcademicYear)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)

      const response = await fetch(`/api/admin/reports/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Stats data:", data)
        setStats(data)
      } else {
        console.error("Failed to fetch stats")
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchReportCardPreview = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/cards/preview?reportId=${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedReportCard(data.reportCard)
        setIsPreviewOpen(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report card preview",
        variant: "destructive",
      })
    }
  }

  const fetchClassReportCards = async (classId: string) => {
    if (!classId || classId === "all") return

    try {
      const params = new URLSearchParams()
      params.append("classId", classId)
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)

      const response = await fetch(`/api/admin/reports/cards/class?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClassReportCards(data)
        setIsClassPreviewOpen(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load class report cards",
        variant: "destructive",
      })
    }
  }

  const fetchBulkPreview = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear)
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/reports/cards/bulk-preview?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBulkPreviewData(data)
        setIsBulkPreviewOpen(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bulk preview",
        variant: "destructive",
      })
    }
  }

  const handleApproveReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/report-cards/${reportId}/approve`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Report card approved successfully",
        })
        fetchReportCards()
        fetchStats()
      } else {
        throw new Error("Failed to approve report card")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve report card",
        variant: "destructive",
      })
    }
  }

  const handleDownloadReport = async (studentId: string, reportId: string, showPreview = true) => {
    if (showPreview) {
      await fetchReportCardPreview(reportId)
      return
    }

    setIsDownloading(true)
    try {
      // Find the report card to get its term and academic year
      const report = reportCards.find((r) => r.id === reportId)
      if (!report) {
        throw new Error("Report card not found")
      }

      const params = new URLSearchParams({
        studentId,
        reportId,
        termId: report.term.id,
        academicYearId: report.academicYear.id,
      })

      const response = await fetch(`/api/admin/reports/download?${params}`)
      if (response.ok) {
        const htmlContent = await response.text()
        const newWindow = window.open("", "_blank")
        if (newWindow) {
          newWindow.document.write(htmlContent)
          newWindow.document.close()
        }
        toast({
          title: "Success",
          description: "Report card opened for printing",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate report card")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report card",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadClassReports = async (classId: string, showPreview = true) => {
    if (!classId || classId === "all") {
      toast({
        title: "Error",
        description: "Please select a specific class",
        variant: "destructive",
      })
      return
    }

    if (showPreview) {
      await fetchClassReportCards(classId)
      return
    }

    setIsDownloading(true)
    try {
      const response = await fetch("/api/admin/reports/cards/download-class", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          academicYearId: selectedAcademicYear,
          termId: selectedTerm !== "all" ? selectedTerm : undefined,
        }),
      })

      if (response.ok) {
        const htmlContent = await response.text()
        const newWindow = window.open("", "_blank")
        if (newWindow) {
          newWindow.document.write(htmlContent)
          newWindow.document.close()
        }
        toast({
          title: "Success",
          description: "Class report cards opened for printing",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate class reports")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate class reports",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleBulkDownload = async (showPreview = true) => {
    if (showPreview) {
      await fetchBulkPreview()
      return
    }

    setIsDownloading(true)
    try {
      const response = await fetch("/api/admin/reports/bulk-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academicYearId: selectedAcademicYear,
          classId: selectedClass !== "all" ? selectedClass : undefined,
          termId: selectedTerm !== "all" ? selectedTerm : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        }),
      })

      if (response.ok) {
        const htmlContent = await response.text()
        const newWindow = window.open("", "_blank")
        if (newWindow) {
          newWindow.document.write(htmlContent)
          newWindow.document.close()
        }
        toast({
          title: "Success",
          description: "Bulk report cards opened for printing",
        })
      } else {
        throw new Error("Failed to generate bulk reports")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate bulk reports",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreviewWithGenerator = (reportCard: ReportCard) => {
    try {
      const htmlContent = generateReportCardHTML({
        reportCard,
        student: reportCard.student,
        gradingSystem: gradingSystem,
        division: "DIVISION I", // This would be calculated properly
        aggregate: 0, // This would be calculated properly
        generalSubjectsData: [],
        allSubjectsData: [],
        totals: {},
        term: reportCard.term,
        academicYear: reportCard.academicYear,
      })

      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report card preview",
        variant: "destructive",
      })
    }
  }

  const gradeDistributionData = stats
    ? {
        labels: ["A - Very Good", "B - Good", "C - Fair", "D - Needs Improvement"],
        datasets: [
          {
            data: [
              stats.gradeDistribution.A,
              stats.gradeDistribution.B,
              stats.gradeDistribution.C,
              stats.gradeDistribution.D,
            ],
            backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
            borderWidth: 0,
          },
        ],
      }
    : null

  const classDistributionData = stats
    ? {
        labels: stats.classDistribution.map((item) => item.className),
        datasets: [
          {
            label: "Report Cards",
            data: stats.classDistribution.map((item) => item.reportCount),
            backgroundColor: "#3B82F6",
            borderColor: "#1D4ED8",
            borderWidth: 1,
          },
        ],
      }
    : null

  const filteredReportCards = reportCards.filter((report) =>
    report.student.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Cards Management</h1>
            <p className="text-muted-foreground">View, approve, and download student report cards</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </CardTitle>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Cards Management</h1>
          <p className="text-muted-foreground">View, approve, and download student report cards</p>
        </div>
        <div className="flex gap-2">
          {selectedClass && selectedClass !== "all" && (
            <>
              <Button
                onClick={() => fetchClassReportCards(selectedClass)}
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isDownloading}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Class
              </Button>
              <Button
                onClick={() => handleDownloadClassReports(selectedClass, false)}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Print Class
              </Button>
            </>
          )}
          <Button
            onClick={() => handleBulkDownload(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isDownloading || !selectedAcademicYear}
          >
            <FileText className="mr-2 h-4 w-4" />
            Bulk Preview
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedReports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalReports > 0 ? Math.round((stats.approvedReports / stats.totalReports) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <XCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalReports > 0 ? Math.round((stats.pendingReports / stats.totalReports) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReports > 0 ? Math.round((stats.approvedReports / stats.totalReports) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Overall approval rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Distribution of grades across all report cards</CardDescription>
            </CardHeader>
            <CardContent>
              {gradeDistributionData && (
                <div className="h-[300px] flex items-center justify-center">
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

          <Card>
            <CardHeader>
              <CardTitle>Reports by Class</CardTitle>
              <CardDescription>Number of report cards per class</CardDescription>
            </CardHeader>
            <CardContent>
              {classDistributionData && (
                <div className="h-[300px]">
                  <Bar
                    data={classDistributionData}
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
                        },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-[200px]">
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Terms" />
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Classes" />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* No Data Message */}
      {!selectedAcademicYear && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select Academic Year</h3>
              <p className="text-muted-foreground">Please select an academic year to view report cards.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAcademicYear && filteredReportCards.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Report Cards Found</h3>
              <p className="text-muted-foreground">No report cards found for the selected filters.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Cards Table */}
      {filteredReportCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Report Cards</CardTitle>
            <CardDescription>
              Showing {filteredReportCards.length} of {reportCards.length} report cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportCards.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={report.student.photo || "/placeholder.svg"} />
                          <AvatarFallback>
                            {report.student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{report.student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{report.student.class.name}</TableCell>
                    <TableCell>{report.term.name}</TableCell>
                    <TableCell>{report.academicYear.name}</TableCell>
                    <TableCell>
                      {report.student.parent ? (
                        <div>
                          <div className="font-medium">{report.student.parent.name}</div>
                          <div className="text-sm text-muted-foreground">{report.student.parent.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No parent assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={report.isApproved ? "default" : "secondary"}>
                        {report.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewWithGenerator(report)}
                          title="Preview with Generator"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!report.isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveReport(report.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDownloadReport(report.student.id, report.id, false)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Individual Report Card Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Card Preview</DialogTitle>
            <DialogDescription>
              {selectedReportCard &&
                `${selectedReportCard.student.name} - ${selectedReportCard.student.class.name} - ${selectedReportCard.term.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedReportCard && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  This is a simplified preview. Use the "Preview with Generator" button for the full formatted report
                  card.
                </p>
                <Button onClick={() => handlePreviewWithGenerator(selectedReportCard)} className="mb-4">
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Report Card
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Name: <strong>{selectedReportCard.student.name}</strong>
                    </div>
                    <div>
                      Class: <strong>{selectedReportCard.student.class.name}</strong>
                    </div>
                    <div>
                      Term: <strong>{selectedReportCard.term.name}</strong>
                    </div>
                    <div>
                      Academic Year: <strong>{selectedReportCard.academicYear.name}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Personal Assessment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Discipline: <strong>{selectedReportCard.discipline}</strong>
                    </div>
                    <div>
                      Cleanliness: <strong>{selectedReportCard.cleanliness}</strong>
                    </div>
                    <div>
                      Class Work: <strong>{selectedReportCard.classWorkPresentation}</strong>
                    </div>
                    <div>
                      Adherence: <strong>{selectedReportCard.adherenceToSchool}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Academic Performance</h4>
                  <div className="text-sm">
                    <p>Subjects: {selectedReportCard.student.marks.length} subjects assessed</p>
                    <p>
                      Total Marks: {selectedReportCard.student.marks.reduce((sum, mark) => sum + (mark.total || 0), 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Comments</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Class Teacher:</strong> {selectedReportCard.classTeacherComment || "No comment"}
                    </div>
                    <div>
                      <strong>Headteacher:</strong> {selectedReportCard.headteacherComment || "No comment"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => handleDownloadReport(selectedReportCard.student.id, selectedReportCard.id, false)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print Report Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Class Report Cards Preview Dialog */}
      <Dialog open={isClassPreviewOpen} onOpenChange={setIsClassPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Class Report Cards Preview</DialogTitle>
            <DialogDescription>
              {classReportCards && `${classReportCards.classInfo.name} - ${classReportCards.totalStudents} students`}
            </DialogDescription>
          </DialogHeader>
          {classReportCards && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classReportCards.totalStudents}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Approved Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{classReportCards.approvedReports}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pending Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{classReportCards.pendingReports}</div>
                  </CardContent>
                </Card>
              </div>

              {classReportCards.classInfo.classTeacher && (
                <div className="text-sm text-muted-foreground">
                  Class Teacher: <strong>{classReportCards.classInfo.classTeacher.name}</strong>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classReportCards.reportCards.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.student.photo || "/placeholder.svg"} />
                            <AvatarFallback>
                              {report.student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{report.student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.isApproved ? "default" : "secondary"}>
                          {report.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePreviewWithGenerator(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownloadReport(report.student.id, report.id, false)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                <Button onClick={() => handleDownloadClassReports(selectedClass, false)} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print All Class Reports
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Preview Dialog */}
      <Dialog open={isBulkPreviewOpen} onOpenChange={setIsBulkPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Report Cards Preview</DialogTitle>
            <DialogDescription>
              {bulkPreviewData && `${bulkPreviewData.totalCount} report cards selected`}
            </DialogDescription>
          </DialogHeader>
          {bulkPreviewData && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Applied Filters:</h4>
                <div className="grid gap-2 text-sm">
                  {bulkPreviewData.filters.academicYear && (
                    <div>
                      Academic Year:{" "}
                      <strong>{academicYears.find((y) => y.id === bulkPreviewData.filters.academicYear)?.year}</strong>
                    </div>
                  )}
                  {bulkPreviewData.filters.term && (
                    <div>
                      Term: <strong>{terms.find((t) => t.id === bulkPreviewData.filters.term)?.name}</strong>
                    </div>
                  )}
                  {bulkPreviewData.filters.class && (
                    <div>
                      Class: <strong>{classes.find((c) => c.id === bulkPreviewData.filters.class)?.name}</strong>
                    </div>
                  )}
                  {bulkPreviewData.filters.status && (
                    <div>
                      Status: <strong>{bulkPreviewData.filters.status}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-lg font-semibold">Total Report Cards: {bulkPreviewData.totalCount}</div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkPreviewData.reportCards.slice(0, 10).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.student.photo || "/placeholder.svg"} />
                            <AvatarFallback>
                              {report.student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{report.student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{report.student.class.name}</TableCell>
                      <TableCell>{report.term.name}</TableCell>
                      <TableCell>
                        <Badge variant={report.isApproved ? "default" : "secondary"}>
                          {report.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handlePreviewWithGenerator(report)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {bulkPreviewData.totalCount > 10 && (
                <div className="text-center text-muted-foreground">
                  ... and {bulkPreviewData.totalCount - 10} more report cards
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button onClick={() => handleBulkDownload(false)} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print All {bulkPreviewData.totalCount} Reports
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
