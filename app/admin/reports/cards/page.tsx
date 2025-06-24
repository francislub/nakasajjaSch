"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Search, Download, Eye, FileText, CheckCircle, XCircle, Calendar, BarChart3 } from "lucide-react"
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
}

interface Class {
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

export default function AdminReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchReportCards()
    fetchClasses()
    fetchStats()
  }, [selectedClass, searchTerm, statusFilter])

  const fetchReportCards = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedClass) params.append("classId", selectedClass)
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter) params.append("status", statusFilter)

      const response = await fetch(`/api/admin/reports/cards?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportCards(data.reportCards)
      }
    } catch (error) {
      console.error("Error fetching report cards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/reports/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
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

  const handleDownloadReport = async (studentId: string, reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/download?studentId=${studentId}&reportId=${reportId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-card-${studentId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report card",
        variant: "destructive",
      })
    }
  }

  const handleBulkDownload = async () => {
    try {
      const response = await fetch("/api/admin/reports/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          status: statusFilter,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-cards-bulk.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Bulk download started",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download reports",
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Cards Management</h1>
          <p className="text-gray-600 mt-2">View, approve, and download student report cards</p>
        </div>
        <Button onClick={handleBulkDownload} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Bulk Download
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedReports}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalReports > 0 ? Math.round((stats.approvedReports / stats.totalReports) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingReports}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalReports > 0 ? Math.round((stats.pendingReports / stats.totalReports) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalReports > 0 ? Math.round((stats.approvedReports / stats.totalReports) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall approval rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Distribution of grades across all report cards</CardDescription>
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
              <CardTitle>Reports by Class</CardTitle>
              <CardDescription>Number of report cards per class</CardDescription>
            </CardHeader>
            <CardContent>
              {classDistributionData && (
                <div className="h-64">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Cards Table */}
      <Card className="bg-white shadow-lg border-0">
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
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={report.student.photo || "/placeholder.svg"} alt={report.student.name} />
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
                    <Badge variant="secondary">{report.student.class.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {report.student.parent ? (
                      <div>
                        <div className="font-medium">{report.student.parent.name}</div>
                        <div className="text-sm text-gray-500">{report.student.parent.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No parent assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={report.isApproved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                    >
                      {report.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!report.isApproved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveReport(report.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(report.student.id, report.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
