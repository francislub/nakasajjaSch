"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react"
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
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import { format } from "date-fns"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

interface AttendanceRecord {
  id: string
  date: string
  status: "PRESENT" | "ABSENT" | "LATE"
  student: {
    id: string
    name: string
    photo?: string
    class: {
      id: string
      name: string
    }
  }
}

interface AttendanceStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendanceRate: number
  weeklyTrend: Array<{
    date: string
    present: number
    absent: number
    late: number
  }>
  classAttendance: Array<{
    classId: string
    className: string
    present: number
    absent: number
    late: number
    total: number
    rate: number
  }>
  monthlyStats: Array<{
    month: string
    rate: number
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

export default function AdminAttendanceReportsPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchAttendanceRecords()
      fetchStats()
    }
  }, [selectedClass, selectedDate, searchTerm, selectedAcademicYear, selectedTerm])

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

  const fetchAttendanceRecords = async () => {
    if (!selectedAcademicYear) return

    try {
      const params = new URLSearchParams()
      params.append("academicYearId", selectedAcademicYear)
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      if (searchTerm) params.append("search", searchTerm)
      params.append("date", selectedDate.toISOString().split("T")[0])

      const response = await fetch(`/api/admin/reports/attendance?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(data.records || [])
      } else {
        console.error("Failed to fetch attendance records")
        setAttendanceRecords([])
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      setAttendanceRecords([])
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
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      params.append("from", dateRange.from.toISOString().split("T")[0])
      params.append("to", dateRange.to.toISOString().split("T")[0])
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass)

      const response = await fetch(`/api/admin/reports/attendance/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error("Failed to fetch stats")
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const generateAttendancePDF = () => {
    if (!stats) return ""

    const currentDate = new Date().toLocaleDateString()
    const academicYear = academicYears.find((y) => y.id === selectedAcademicYear)?.year || ""
    const term = selectedTerm !== "all" ? terms.find((t) => t.id === selectedTerm)?.name || "" : "All Terms"
    const className = selectedClass !== "all" ? classes.find((c) => c.id === selectedClass)?.name || "" : "All Classes"

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Attendance Report</title>
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
            display: flex;
            justify-content: space-between;
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
          
          .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          
          .attendance-table th,
          .attendance-table td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: center;
          }
          
          .attendance-table th {
            background-color: #3b82f6;
            color: white;
            font-weight: bold;
          }
          
          .attendance-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .attendance-table tr:hover {
            background-color: #e3f2fd;
          }
          
          .total-row {
            background-color: #e3f2fd !important;
            font-weight: bold;
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
          <div class="report-title">ATTENDANCE REPORT</div>
        </div>

        <div class="report-info">
          <div class="info-section">
            <div><span class="info-label">Academic Year:</span> ${academicYear}</div>
            <div><span class="info-label">Term:</span> ${term}</div>
          </div>
          <div class="info-section">
            <div><span class="info-label">Class:</span> ${className}</div>
            <div><span class="info-label">Date:</span> ${format(selectedDate, "PPP")}</div>
          </div>
          <div class="info-section">
            <div><span class="info-label">Report Generated:</span> ${currentDate}</div>
            <div><span class="info-label">Period:</span> ${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}</div>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-number">${stats.totalStudents}</div>
            <div class="stat-label">Total Students</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.presentToday}</div>
            <div class="stat-label">Present Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.absentToday}</div>
            <div class="stat-label">Absent Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.attendanceRate}%</div>
            <div class="stat-label">Attendance Rate</div>
          </div>
        </div>

        <table class="attendance-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Total Students</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            ${stats.classAttendance
              .map(
                (classData) => `
              <tr>
                <td>${classData.className}</td>
                <td>${classData.total}</td>
                <td>${classData.present}</td>
                <td>${classData.absent}</td>
                <td>${classData.late}</td>
                <td>${classData.rate}%</td>
              </tr>
            `,
              )
              .join("")}
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td><strong>${stats.classAttendance.reduce((sum, c) => sum + c.total, 0)}</strong></td>
              <td><strong>${stats.classAttendance.reduce((sum, c) => sum + c.present, 0)}</strong></td>
              <td><strong>${stats.classAttendance.reduce((sum, c) => sum + c.absent, 0)}</strong></td>
              <td><strong>${stats.classAttendance.reduce((sum, c) => sum + c.late, 0)}</strong></td>
              <td><strong>${Math.round(stats.classAttendance.reduce((sum, c) => sum + c.rate, 0) / stats.classAttendance.length)}%</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">CLASS TEACHER</div>
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
      const htmlContent = generateAttendancePDF()
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
        description: "Attendance report opened for printing",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate attendance report",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ABSENT":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "LATE":
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case "LATE":
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  // Chart data
  const weeklyTrendData = stats
    ? {
        labels: stats.weeklyTrend.map((item) => format(new Date(item.date), "MMM dd")),
        datasets: [
          {
            label: "Present",
            data: stats.weeklyTrend.map((item) => item.present),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
          },
          {
            label: "Absent",
            data: stats.weeklyTrend.map((item) => item.absent),
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
          {
            label: "Late",
            data: stats.weeklyTrend.map((item) => item.late),
            borderColor: "#F59E0B",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.4,
          },
        ],
      }
    : null

  const classAttendanceData = stats
    ? {
        labels: stats.classAttendance.map((item) => item.className),
        datasets: [
          {
            label: "Attendance Rate (%)",
            data: stats.classAttendance.map((item) => item.rate),
            backgroundColor: "#3B82F6",
            borderColor: "#1D4ED8",
            borderWidth: 1,
          },
        ],
      }
    : null

  const todayStatusData = stats
    ? {
        labels: ["Present", "Absent", "Late"],
        datasets: [
          {
            data: [stats.presentToday, stats.absentToday, stats.lateToday],
            backgroundColor: ["#10B981", "#EF4444", "#F59E0B"],
            borderWidth: 0,
          },
        ],
      }
    : null

  const filteredRecords = attendanceRecords.filter((record) =>
    record.student.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600 mt-2">Monitor and analyze student attendance patterns</p>
        </div>
        <Button
          onClick={handleDownloadReport}
          className="bg-green-600 hover:bg-green-700"
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-48 bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* No Data Message */}
      {!selectedAcademicYear && (
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Select Academic Year</h3>
            <p className="text-gray-500">Please select an academic year to view attendance reports.</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <CheckCircle className="w-4 h-4 mr-2" />
                Present Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Absent Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalStudents > 0 ? Math.round((stats.absentToday / stats.totalStudents) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Late Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lateToday}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalStudents > 0 ? Math.round((stats.lateToday / stats.totalStudents) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Attendance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
              <div className="flex items-center mt-1">
                {stats.attendanceRate >= 90 ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <p className="text-xs text-gray-500">Overall rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Current day attendance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {todayStatusData && (
                <div className="h-64">
                  <Doughnut
                    data={todayStatusData}
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

          <Card className="bg-white shadow-lg border-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
              <CardDescription>Attendance patterns over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyTrendData && (
                <div className="h-64">
                  <Line
                    data={weeklyTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
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

      {/* Class Attendance Chart */}
      {stats && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Attendance by Class</CardTitle>
            <CardDescription>Attendance rates across different classes</CardDescription>
          </CardHeader>
          <CardContent>
            {classAttendanceData && (
              <div className="h-64">
                <Bar
                  data={classAttendanceData}
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
      )}

      {/* Attendance Records Table */}
      {selectedAcademicYear && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Showing attendance for {format(selectedDate, "PPPP")} - {filteredRecords.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={record.student.photo || "/placeholder.svg"} alt={record.student.name} />
                          <AvatarFallback>
                            {record.student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.student.class.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        {getStatusBadge(record.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{format(new Date(record.date), "HH:mm")}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRecords.length === 0 && selectedAcademicYear && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Attendance Records</h3>
                <p className="text-gray-500">No attendance records found for the selected date and filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
