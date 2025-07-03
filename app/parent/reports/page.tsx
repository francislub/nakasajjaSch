"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Eye, Download, FileText, Calendar, GraduationCap, Loader2 } from "lucide-react"
import { generateReportCardHTML } from "@/lib/report-card-generator"

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
  student: {
    id: string
    name: string
    photo?: string
    class?: {
      id: string
      name: string
      subjects?: Array<{
        id: string
        name: string
        code: string
        category: string
      }>
    }
    term?: {
      id: string
      name: string
    }
    academicYear?: {
      id: string
      year: string
    }
    marks?: Array<{
      id: string
      subject: {
        id: string
        name: string
        code: string
        category: string
      }
      total: number
      grade: string
      homework: number
      bot: number
      midterm: number
      eot: number
      term?: {
        id: string
        name: string
      }
      academicYear?: {
        id: string
        year: string
      }
    }>
  }
}

interface Child {
  id: string
  name: string
  photo?: string
  class?: {
    id: string
    name: string
  }
  term?: {
    id: string
    name: string
  }
  academicYear?: {
    id: string
    year: string
  }
  reportCards: ReportCard[]
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

export default function ParentReportsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [selectedChild, setSelectedChild] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
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
      fetchReports()
      fetchTerms(selectedAcademicYear)
    }
  }, [selectedAcademicYear, selectedTerm, selectedChild])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([fetchAcademicYears(), fetchGradingSystem()])
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
        }
      }
    } catch (error) {
      console.error("Error fetching academic years:", error)
    }
  }

  const fetchTerms = async (academicYearId: string) => {
    try {
      const response = await fetch(`/api/terms?academicYearId=${academicYearId}`)
      if (response.ok) {
        const data = await response.json()
        setTerms(data || [])
      }
    } catch (error) {
      console.error("Error fetching terms:", error)
    }
  }

  const fetchReports = async () => {
    if (!selectedAcademicYear) return

    try {
      const params = new URLSearchParams()
      params.append("academicYearId", selectedAcademicYear)
      if (selectedTerm && selectedTerm !== "all") params.append("termId", selectedTerm)
      if (selectedChild && selectedChild !== "all") params.append("studentId", selectedChild)

      const response = await fetch(`/api/parent/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children || [])
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch reports",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      })
    }
  }

  const calculateDivision = (marks: any[] = []) => {
    if (marks.length === 0) return "DIVISION IV"

    const totalMarks = marks.reduce((sum, mark) => sum + (mark?.total || 0), 0)
    const averageMarks = totalMarks / marks.length

    if (averageMarks >= 80) return "DIVISION I"
    if (averageMarks >= 65) return "DIVISION II"
    if (averageMarks >= 50) return "DIVISION III"
    return "DIVISION IV"
  }

  const calculateAggregate = (marks: any[] = []) => {
    return marks.reduce((sum, mark) => sum + (mark?.total || 0), 0)
  }

  const transformMarksData = (marks: any[] = []) => {
    const generalSubjects = marks.filter((mark) => mark?.subject?.category === "GENERAL")
    const allSubjects = marks

    const generalSubjectsData = generalSubjects.map((mark) => ({
      subject: mark?.subject?.name || "Unknown Subject",
      homework: mark?.homework || 0,
      bot: mark?.bot || 0,
      midterm: mark?.midterm || 0,
      eot: mark?.eot || 0,
      total: mark?.total || 0,
      grade: mark?.grade || "F",
      remarks: "Good",
    }))

    const allSubjectsData = allSubjects.map((mark) => ({
      subject: mark?.subject?.name || "Unknown Subject",
      homework: mark?.homework || 0,
      bot: mark?.bot || 0,
      midterm: mark?.midterm || 0,
      eot: mark?.eot || 0,
      total: mark?.total || 0,
      grade: mark?.grade || "F",
      remarks: "Good",
    }))

    const totals = {
      homework: marks.reduce((sum, mark) => sum + (mark?.homework || 0), 0),
      bot: marks.reduce((sum, mark) => sum + (mark?.bot || 0), 0),
      midterm: marks.reduce((sum, mark) => sum + (mark?.midterm || 0), 0),
      eot: marks.reduce((sum, mark) => sum + (mark?.eot || 0), 0),
      total: marks.reduce((sum, mark) => sum + (mark?.total || 0), 0),
    }

    return { generalSubjectsData, allSubjectsData, totals }
  }

  const handleViewReport = (reportCard: ReportCard) => {
    setIsGenerating(true)
    try {
      const marks = reportCard.student?.marks || []
      const { generalSubjectsData, allSubjectsData, totals } = transformMarksData(marks)
      const division = calculateDivision(marks)
      const aggregate = calculateAggregate(marks)

      // Create term and academic year objects with fallbacks
      const term = reportCard.student?.term || { id: "", name: "Unknown Term" }
      const academicYear = reportCard.student?.academicYear || { id: "", year: "Unknown Year" }

      const htmlContent = generateReportCardHTML({
        reportCard,
        student: reportCard.student,
        gradingSystem,
        division,
        aggregate,
        generalSubjectsData,
        allSubjectsData,
        totals,
        term,
        academicYear,
      })

      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
      }

      toast({
        title: "Success",
        description: "Report card opened in new window",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report card",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = (reportCard: ReportCard) => {
    setIsGenerating(true)
    try {
      const marks = reportCard.student?.marks || []
      const { generalSubjectsData, allSubjectsData, totals } = transformMarksData(marks)
      const division = calculateDivision(marks)
      const aggregate = calculateAggregate(marks)

      // Create term and academic year objects with fallbacks
      const term = reportCard.student?.term || { id: "", name: "Unknown Term" }
      const academicYear = reportCard.student?.academicYear || { id: "", year: "Unknown Year" }

      const htmlContent = generateReportCardHTML({
        reportCard,
        student: reportCard.student,
        gradingSystem,
        division,
        aggregate,
        generalSubjectsData,
        allSubjectsData,
        totals,
        term,
        academicYear,
      })

      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportCard.student?.name || "Student"}_Report_Card_${term.name}_${academicYear.year}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Report card downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Error",
        description: "Failed to download report card",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const allReportCards = children.flatMap((child) =>
    (child.reportCards || []).map((report) => ({
      ...report,
      childName: child.name,
      // Add fallback data from child if not present in report
      student: {
        ...report.student,
        class: report.student?.class || child.class,
        term: report.student?.term || child.term,
        academicYear: report.student?.academicYear || child.academicYear,
      },
    })),
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Children's Reports</h1>
            <p className="text-muted-foreground">View and download your children's report cards</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-3xl font-bold tracking-tight">My Children's Reports</h1>
          <p className="text-muted-foreground">View and download your children's report cards</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
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

      {selectedAcademicYear && allReportCards.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Report Cards Available</h3>
              <p className="text-muted-foreground">
                No report cards are currently available for viewing. Please contact the school administration if you
                believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Cards Grid */}
      {allReportCards.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allReportCards.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={report.student?.photo || "/placeholder.svg"} />
                    <AvatarFallback>
                      {(report.student?.name || "Student")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{report.student?.name || "Unknown Student"}</CardTitle>
                    <CardDescription>{report.student?.class?.name || "Unknown Class"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{report.student?.term?.name || "Unknown Term"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{report.student?.academicYear?.year || "Unknown Year"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={report.isApproved ? "default" : "secondary"}>
                      {report.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subjects:</span>
                    <span className="text-sm font-medium">{report.student?.marks?.length || 0} subjects</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Marks:</span>
                    <span className="text-sm font-medium">
                      {(report.student?.marks || []).reduce((sum, mark) => sum + (mark?.total || 0), 0)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleViewReport(report)} disabled={isGenerating} className="flex-1">
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownloadReport(report)}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of your children's academic progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{children.length}</div>
                <div className="text-sm text-muted-foreground">Children</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{allReportCards.length}</div>
                <div className="text-sm text-muted-foreground">Available Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {allReportCards.filter((report) => report.isApproved).length}
                </div>
                <div className="text-sm text-muted-foreground">Approved Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
