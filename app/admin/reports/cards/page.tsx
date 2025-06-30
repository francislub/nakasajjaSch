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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface ReportCard {
  id: string
  student: {
    id: string
    name: string
    photo?: string
    class: {
      name: string
    }
    parent?: {
      name: string
      email: string
    }
    marks: Array<{
      subject: {
        name: string
        code: string
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
        name: string
      }
    }>
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
    name: string
  }
  academicYear: {
    name: string
  }
  gradingSystem?: Array<{
    grade: string
    minMark: number
    maxMark: number
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
    grade: string
    minMark: number
    maxMark: number
  }>
}

interface BulkPreviewData {
  reportCards: ReportCard[]
  totalCount: number
  gradingSystem?: Array<{
    grade: string
    minMark: number
    maxMark: number
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
      await Promise.all([fetchClasses(), fetchAcademicYears()])
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
      const response = await fetch(`/api/admin/reports/download?studentId=${studentId}&reportId=${reportId}`)
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
        throw new Error("Failed to generate report card")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report card",
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
        throw new Error("Failed to generate class reports")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate class reports",
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
                        <Button size="sm" variant="outline" onClick={() => fetchReportCardPreview(report.id)}>
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
              {/* Report Card Preview */}
              <div className="border-2 border-black p-4 bg-white text-black font-mono text-xs">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-2 mb-4 relative">
                  <div className="absolute left-2 top-2 w-12 h-12 border border-black bg-gray-100 flex items-center justify-center text-xs">
                    LOGO
                  </div>
                  <div className="absolute right-2 top-2 w-12 h-16 border border-black bg-gray-100 flex items-center justify-center text-xs">
                    PHOTO
                  </div>
                  <div className="text-lg font-bold mb-1">HOLY FAMILY JUNIOR SCHOOL-NAKASAJJA</div>
                  <div className="text-xs italic mb-1">"TIMOR DEI PRINCIPUM SAPIENTIAE"</div>
                  <div className="text-xs mb-2">
                    P.O BOX 25258, KAMPALA 'U'
                    <br />
                    TE: 0774-305717 / 0704-305747 / 0784-450896/0709-986390
                  </div>
                  <div className="text-sm font-bold underline">PROGRESSIVE REPORT</div>
                </div>

                {/* Student Info */}
                <div className="flex justify-between mb-4 text-xs">
                  <div>
                    NAME: <strong>{selectedReportCard.student.name}</strong>
                  </div>
                  <div>
                    DIVISION: <strong>{selectedReportCard.student.class.name}</strong>
                  </div>
                </div>
                <div className="flex justify-between mb-4 text-xs">
                  <div>
                    CLASS: <strong>{selectedReportCard.student.class.name}</strong>
                  </div>
                  <div>
                    TERM: <strong>{selectedReportCard.term.name}</strong>
                  </div>
                  <div>
                    DATE: <strong>{new Date().toLocaleDateString()}</strong>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex gap-4">
                  {/* Personal Assessment */}
                  <div className="w-48">
                    <div className="bg-gray-100 font-bold text-center p-2 border border-black mb-1 text-xs">
                      Personal Assessment
                    </div>
                    {[
                      { label: "Discipline", value: selectedReportCard.discipline },
                      { label: "Cleanliness", value: selectedReportCard.cleanliness },
                      { label: "Class work Presentation", value: selectedReportCard.classWorkPresentation },
                      { label: "Adherence to School", value: selectedReportCard.adherenceToSchool },
                      { label: "Co-curricular Activities", value: selectedReportCard.coCurricularActivities },
                      { label: "Consideration to others", value: selectedReportCard.considerationToOthers },
                      { label: "Speaking English", value: selectedReportCard.speakingEnglish },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="border border-black p-2 mb-1 flex justify-between items-center text-xs"
                      >
                        <span>{item.label}</span>
                        <span>
                          <strong>{item.value || ""}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Academic Section */}
                  <div className="flex-1">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="border border-black p-1 bg-gray-100">GRADE</th>
                          <th className="border border-black p-1 bg-gray-100">SUBJECT ASSESSED</th>
                          <th className="border border-black p-1 bg-gray-100">OUT OF</th>
                          <th className="border border-black p-1 bg-gray-100">H.P</th>
                          <th className="border border-black p-1 bg-gray-100">B.O.T</th>
                          <th className="border border-black p-1 bg-gray-100">AG</th>
                          <th className="border border-black p-1 bg-gray-100">MID TERM</th>
                          <th className="border border-black p-1 bg-gray-100">AG</th>
                          <th className="border border-black p-1 bg-gray-100">E.O.T</th>
                          <th className="border border-black p-1 bg-gray-100">AG</th>
                          <th className="border border-black p-1 bg-gray-100">REMARKS</th>
                          <th className="border border-black p-1 bg-gray-100">INITIAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {["ENGLISH", "MATHEMATICS", "SCIENCE", "S.ST AND R.E"].map((subject) => {
                          const mark = selectedReportCard.student.marks.find((m) => m.subject.name === subject)
                          return (
                            <tr key={subject}>
                              <td className="border border-black p-1 text-center">
                                <strong>{mark?.grade || ""}</strong>
                              </td>
                              <td className="border border-black p-1 text-center">
                                <strong>{subject}</strong>
                              </td>
                              <td className="border border-black p-1 text-center">
                                <strong>100</strong>
                              </td>
                              <td className="border border-black p-1 text-center">{mark?.homework || ""}</td>
                              <td className="border border-black p-1 text-center">{mark?.bot || ""}</td>
                              <td className="border border-black p-1 text-center"></td>
                              <td className="border border-black p-1 text-center">{mark?.midterm || ""}</td>
                              <td className="border border-black p-1 text-center"></td>
                              <td className="border border-black p-1 text-center">{mark?.eot || ""}</td>
                              <td className="border border-black p-1 text-center"></td>
                              <td className="border border-black p-1 text-center">{mark?.remarks || ""}</td>
                              <td className="border border-black p-1 text-center">
                                <strong>{mark?.createdBy?.name?.charAt(0) || ""}</strong>
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="bg-gray-100">
                          <td className="border border-black p-1 text-center"></td>
                          <td className="border border-black p-1 text-center">
                            <strong>TOTAL</strong>
                          </td>
                          <td className="border border-black p-1 text-center">
                            <strong>400</strong>
                          </td>
                          <td className="border border-black p-1 text-center">
                            <strong>
                              {selectedReportCard.student.marks.reduce((sum, mark) => sum + (mark.homework || 0), 0)}
                            </strong>
                          </td>
                          <td className="border border-black p-1 text-center">
                            <strong>
                              {selectedReportCard.student.marks.reduce((sum, mark) => sum + (mark.bot || 0), 0)}
                            </strong>
                          </td>
                          <td className="border border-black p-1 text-center"></td>
                          <td className="border border-black p-1 text-center">
                            <strong>
                              {selectedReportCard.student.marks.reduce((sum, mark) => sum + (mark.midterm || 0), 0)}
                            </strong>
                          </td>
                          <td className="border border-black p-1 text-center"></td>
                          <td className="border border-black p-1 text-center">
                            <strong>
                              {selectedReportCard.student.marks.reduce((sum, mark) => sum + (mark.eot || 0), 0)}
                            </strong>
                          </td>
                          <td className="border border-black p-1 text-center"></td>
                          <td className="border border-black p-1 text-center"></td>
                          <td className="border border-black p-1 text-center"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grading Section */}
                <div className="mt-4 text-center">
                  <div className="font-bold underline mb-2 text-sm">GRADING MARKS</div>
                  {selectedReportCard.gradingSystem && (
                    <table className="w-full border-collapse text-xs mb-2">
                      <thead>
                        <tr>
                          {selectedReportCard.gradingSystem.map((grade, index) => (
                            <th key={index} className="border border-black p-1 bg-gray-100">
                              {grade.minMark}-{grade.maxMark}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {selectedReportCard.gradingSystem.map((grade, index) => (
                            <td key={index} className="border border-black p-1 text-center">
                              <strong>{grade.grade}</strong>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  )}
                  <div className="text-xs mb-2">
                    <strong>KEY:</strong>{" "}
                    {selectedReportCard.gradingSystem
                      ?.map((grade) => `${grade.minMark}-${grade.maxMark}-${grade.grade}`)
                      .join(" ")}
                  </div>
                  <div className="text-xs">
                    <strong>A-VERY GOOD B-GOOD C-FAIR D-NEEDS IMPROVEMENT</strong>
                  </div>
                </div>

                {/* Comments */}
                <div className="mt-4 text-xs">
                  <div className="mb-3">
                    <strong>CLASS TEACHER'S REPORT:</strong>
                    <div className="border-b border-black mt-1 pb-1 min-h-[20px]">
                      {selectedReportCard.classTeacherComment || ""}
                    </div>
                    <div className="text-right mt-1">SIGN_____________</div>
                  </div>
                  <div className="mb-3">
                    <strong>HEADTEACHER'S COMMENT:</strong>
                    <div className="border-b border-black mt-1 pb-1 min-h-[20px]">
                      {selectedReportCard.headteacherComment || ""}
                    </div>
                    <div className="text-right mt-1">SIGN_____________</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-xs">
                  <div className="mb-2">
                    <strong>NEXT TERM BEGINS ON:</strong>_________________________________
                    <strong>ENDS ON:</strong>_______________________________________________
                  </div>
                  <div className="text-center mb-2">
                    At least 50% of the school fees should be paid before the Term Begins
                  </div>
                  <div className="text-center font-bold">NOTE: This report is not valid without a school stamp.</div>
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
                          <Button size="sm" variant="outline" onClick={() => fetchReportCardPreview(report.id)}>
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
                        <Button size="sm" variant="outline" onClick={() => fetchReportCardPreview(report.id)}>
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
