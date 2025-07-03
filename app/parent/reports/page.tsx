"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Download, Eye, FileText, AlertCircle } from "lucide-react"
import { generateReportCard } from "@/lib/report-card-generator"

interface Student {
  id: string
  name: string
  class: {
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
}

interface ReportCard {
  id: string
  student: Student
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

interface Mark {
  id: string
  subject: {
    id: string
    name: string
    category: string
  }
  homework?: number
  bot?: number
  midterm?: number
  eot?: number
  total?: number
  grade?: string
}

export default function ParentReportsPage() {
  const { data: session } = useSession()
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role === "PARENT") {
      fetchReportCards()
    }
  }, [session])

  const fetchReportCards = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/parent/reports")
      if (response.ok) {
        const data = await response.json()
        // Filter only reports where parent access is enabled
        const accessibleReports = data.filter(
          (report: ReportCard) => report.headteacherComment?.includes("[PARENT_ACCESS_ENABLED_") || false,
        )
        setReportCards(accessibleReports)
      } else {
        toast.error("Failed to load report cards")
      }
    } catch (error) {
      console.error("Error fetching report cards:", error)
      toast.error("Failed to load report cards")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentMarks = async (studentId: string): Promise<Mark[]> => {
    try {
      const response = await fetch(`/api/students/${studentId}/marks`)
      if (response.ok) {
        return await response.json()
      }
      return []
    } catch (error) {
      console.error("Error fetching student marks:", error)
      return []
    }
  }

  const handleViewReport = async (reportCard: ReportCard) => {
    setGeneratingReport(reportCard.id)
    try {
      // Fetch student marks
      const marks = await fetchStudentMarks(reportCard.student.id)

      // Transform data for report generator
      const reportData = {
        student: {
          name: reportCard.student.name,
          class: reportCard.student.class.name,
          term: reportCard.student.term?.name || "Current Term",
          academicYear: reportCard.student.academicYear?.year || new Date().getFullYear().toString(),
        },
        subjects: marks.map((mark) => ({
          name: mark.subject.name,
          category: mark.subject.category,
          homework: mark.homework || 0,
          bot: mark.bot || 0,
          midterm: mark.midterm || 0,
          eot: mark.eot || 0,
          total: mark.total || 0,
          grade: mark.grade || "N/A",
        })),
        personalAssessment: {
          discipline: reportCard.discipline || "N/A",
          cleanliness: reportCard.cleanliness || "N/A",
          classWorkPresentation: reportCard.classWorkPresentation || "N/A",
          adherenceToSchool: reportCard.adherenceToSchool || "N/A",
          coCurricularActivities: reportCard.coCurricularActivities || "N/A",
          considerationToOthers: reportCard.considerationToOthers || "N/A",
          speakingEnglish: reportCard.speakingEnglish || "N/A",
        },
        comments: {
          classTeacher: reportCard.classTeacherComment || "",
          headteacher: reportCard.headteacherComment?.replace(/\[PARENT_ACCESS_ENABLED_[^\]]*\]/g, "").trim() || "",
        },
      }

      // Generate and display the report card
      const reportHtml = generateReportCard(reportData)

      // Open in new window for viewing
      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(reportHtml)
        newWindow.document.close()
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report card")
    } finally {
      setGeneratingReport(null)
    }
  }

  const handleDownloadReport = async (reportCard: ReportCard) => {
    setGeneratingReport(reportCard.id)
    try {
      // Fetch student marks
      const marks = await fetchStudentMarks(reportCard.student.id)

      // Transform data for report generator
      const reportData = {
        student: {
          name: reportCard.student.name,
          class: reportCard.student.class.name,
          term: reportCard.student.term?.name || "Current Term",
          academicYear: reportCard.student.academicYear?.year || new Date().getFullYear().toString(),
        },
        subjects: marks.map((mark) => ({
          name: mark.subject.name,
          category: mark.subject.category,
          homework: mark.homework || 0,
          bot: mark.bot || 0,
          midterm: mark.midterm || 0,
          eot: mark.eot || 0,
          total: mark.total || 0,
          grade: mark.grade || "N/A",
        })),
        personalAssessment: {
          discipline: reportCard.discipline || "N/A",
          cleanliness: reportCard.cleanliness || "N/A",
          classWorkPresentation: reportCard.classWorkPresentation || "N/A",
          adherenceToSchool: reportCard.adherenceToSchool || "N/A",
          coCurricularActivities: reportCard.coCurricularActivities || "N/A",
          considerationToOthers: reportCard.considerationToOthers || "N/A",
          speakingEnglish: reportCard.speakingEnglish || "N/A",
        },
        comments: {
          classTeacher: reportCard.classTeacherComment || "",
          headteacher: reportCard.headteacherComment?.replace(/\[PARENT_ACCESS_ENABLED_[^\]]*\]/g, "").trim() || "",
        },
      }

      // Generate the report card HTML
      const reportHtml = generateReportCard(reportData)

      // Create a blob and download
      const blob = new Blob([reportHtml], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportCard.student.name}_Report_Card.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Report card downloaded successfully")
    } catch (error) {
      console.error("Error downloading report:", error)
      toast.error("Failed to download report card")
    } finally {
      setGeneratingReport(null)
    }
  }

  if (!session || session.user.role !== "PARENT") {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Access denied. Parent privileges required.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Child's Reports</h1>
          <p className="text-muted-foreground">View and download your child's report cards</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reportCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Report Cards Available</h3>
            <p className="text-muted-foreground text-center">
              No report cards have been made available for viewing yet. Please contact the school administration if you
              believe this is an error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportCards.map((reportCard) => (
            <Card key={reportCard.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {reportCard.student.name}
                      <Badge variant={reportCard.isApproved ? "default" : "secondary"}>
                        {reportCard.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Class: {reportCard.student.class.name} | Term: {reportCard.student.term?.name || "Current Term"} |
                      Academic Year: {reportCard.student.academicYear?.year || new Date().getFullYear()}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(reportCard)}
                      disabled={generatingReport === reportCard.id}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownloadReport(reportCard)}
                      disabled={generatingReport === reportCard.id}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Assessment</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Discipline:</strong> {reportCard.discipline || "N/A"}
                      </p>
                      <p>
                        <strong>Cleanliness:</strong> {reportCard.cleanliness || "N/A"}
                      </p>
                      <p>
                        <strong>Class Work Presentation:</strong> {reportCard.classWorkPresentation || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Comments</h4>
                    <div className="space-y-2 text-sm">
                      {reportCard.classTeacherComment && (
                        <div>
                          <strong>Class Teacher:</strong>
                          <p className="text-muted-foreground">{reportCard.classTeacherComment}</p>
                        </div>
                      )}
                      {reportCard.headteacherComment && (
                        <div>
                          <strong>Head Teacher:</strong>
                          <p className="text-muted-foreground">
                            {reportCard.headteacherComment.replace(/\[PARENT_ACCESS_ENABLED_[^\]]*\]/g, "").trim()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Report generated on: {new Date(reportCard.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
