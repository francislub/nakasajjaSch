import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !["ADMIN", "HEADTEACHER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const reportId = searchParams.get("reportId")

    if (!studentId || !reportId) {
      return NextResponse.json({ error: "Student ID and Report ID are required" }, { status: 400 })
    }

    // Get report card with all related data
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportId },
      include: {
        student: {
          include: {
            class: true,
            parent: true,
            marks: {
              include: {
                subject: true,
                term: true,
                createdBy: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            term: true,
            academicYear: true,
          },
        },
      },
    })

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 })
    }

    // Get grading system
    const gradingSystem = await prisma.gradingSystem.findMany({
      orderBy: {
        minMark: "desc",
      },
    })

    // Generate HTML for the report card
    const htmlContent = generateReportCardHTML(reportCard, gradingSystem)

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="report-card-${studentId}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating report card:", error)
    return NextResponse.json({ error: "Failed to generate report card" }, { status: 500 })
  }
}

function generateReportCardHTML(reportCard: any, gradingSystem: any[]) {
  const student = reportCard.student
  const marks = student?.marks || []

  // Group marks by subject for the current term
  const subjectMarks = marks.reduce((acc: any, mark: any) => {
    const subjectName = mark.subject?.name || "Unknown"
    if (!acc[subjectName]) {
      acc[subjectName] = {
        homework: mark.homework || 0,
        bot: mark.bot || 0,
        midterm: mark.midterm || 0,
        eot: mark.eot || 0,
        total: mark.total || 0,
        grade: mark.grade || "",
        teacherInitial: mark.createdBy?.name?.charAt(0) || "",
        remarks: mark.remarks || "",
      }
    }
    return acc
  }, {})

  // Calculate totals
  const subjects = ["ENGLISH", "MATHEMATICS", "SCIENCE", "S.ST AND R.E"]
  let totalHomework = 0
  let totalBot = 0
  let totalMidterm = 0
  let totalEot = 0
  let grandTotal = 0

  subjects.forEach((subject) => {
    if (subjectMarks[subject]) {
      totalHomework += subjectMarks[subject].homework
      totalBot += subjectMarks[subject].bot
      totalMidterm += subjectMarks[subject].midterm
      totalEot += subjectMarks[subject].eot
      grandTotal += subjectMarks[subject].total
    }
  })

  // Generate grading scale from database
  const gradingScaleHTML = gradingSystem
    .map((grade) => `${grade.minMark}-${grade.maxMark}-${grade.grade}`)
    .join(" &nbsp;&nbsp;&nbsp; ")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Card - ${student?.name || "Student"}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .report-card { 
                page-break-inside: avoid;
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .report-card {
            max-width: 800px;
            margin: 0 auto;
            border: 3px solid #000;
            padding: 15px;
            background: white;
            min-height: 95vh;
            position: relative;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
            position: relative;
        }
        
        .logo-left {
            position: absolute;
            left: 10px;
            top: 10px;
            width: 60px;
            height: 60px;
        }
        
        .photo-right {
            position: absolute;
            right: 10px;
            top: 10px;
            width: 60px;
            height: 80px;
            border: 1px solid #000;
            background: #f9f9f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
        }
        
        .school-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .motto {
            font-size: 12px;
            font-style: italic;
            margin-bottom: 3px;
        }
        
        .contact-info {
            font-size: 9px;
            margin-bottom: 8px;
        }
        
        .report-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
        }
        
        .student-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 11px;
        }
        
        .student-info div {
            flex: 1;
        }
        
        .main-content {
            display: flex;
            gap: 15px;
            flex: 1;
        }
        
        .personal-assessment {
            width: 180px;
        }
        
        .academic-section {
            flex: 1;
        }
        
        .assessment-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 9px;
        }
        
        .assessment-table th,
        .assessment-table td {
            border: 1px solid #000;
            padding: 3px;
            text-align: center;
            vertical-align: middle;
        }
        
        .assessment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .personal-item {
            border: 1px solid #000;
            padding: 6px;
            margin-bottom: 1px;
            font-size: 9px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .personal-header {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            padding: 6px;
            border: 1px solid #000;
            margin-bottom: 1px;
            font-size: 10px;
        }
        
        .grading-section {
            margin-top: 15px;
            text-align: center;
        }
        
        .grading-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .grading-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 8px;
            margin-bottom: 8px;
        }
        
        .grading-table th,
        .grading-table td {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
        }
        
        .grading-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .grade-key {
            font-size: 9px;
            margin-bottom: 8px;
        }
        
        .comments-section {
            margin-top: 15px;
            font-size: 10px;
        }
        
        .comment-line {
            border-bottom: 1px solid #000;
            margin-bottom: 8px;
            padding-bottom: 3px;
            min-height: 15px;
        }
        
        .footer-info {
            margin-top: 15px;
            font-size: 9px;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #0056b3;
        }
        
        .pdf-button {
            position: fixed;
            top: 70px;
            right: 20px;
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        .pdf-button:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Print Report Card</button>
    <button class="pdf-button no-print" onclick="generatePDF()">Save as PDF</button>
    
    <div class="report-card">
        <div class="header">
            <div class="logo-left">
                <img src="/images/school-logo.png" alt="School Logo" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'">
            </div>
            <div class="photo-right">
                ${
                  student?.photo
                    ? `<img src="${student.photo}" alt="Student Photo" style="width: 100%; height: 100%; object-fit: cover;">`
                    : "PHOTO"
                }
            </div>
            <div class="school-name">HOLY FAMILY JUNIOR SCHOOL-NAKASAJJA</div>
            <div class="motto">"TIMOR DEI PRINCIPUM SAPIENTIAE"</div>
            <div class="contact-info">
                P.O BOX 25258, KAMPALA 'U'<br>
                TE: 0774-305717 / 0704-305747 / 0784-450896/0709-986390
            </div>
            <div class="report-title">PROGRESSIVE REPORT</div>
        </div>
        
        <div class="student-info">
            <div>NAME: <strong>${student?.name || "_".repeat(50)}</strong></div>
            <div>DIVISION: <strong>${student?.class?.name || "_".repeat(15)}</strong></div>
        </div>
        
        <div class="student-info">
            <div>CLASS: <strong>${student?.class?.name || "_".repeat(15)}</strong></div>
            <div>TERM: <strong>${student?.term?.name || "_".repeat(15)}</strong></div>
            <div>DATE: <strong>${new Date().toLocaleDateString() || "_".repeat(20)}</strong></div>
        </div>
        
        <div class="main-content">
            <div class="personal-assessment">
                <div class="personal-header">Personal Assessment</div>
                <div class="personal-item">
                    <span>Discipline</span>
                    <span><strong>${reportCard.discipline || ""}</strong></span>
                </div>
                <div class="personal-item">
                    <span>Cleanliness</span>
                    <span><strong>${reportCard.cleanliness || ""}</strong></span>
                </div>
                <div class="personal-item">
                    <span>Class work Presentation</span>
                    <span><strong>${reportCard.classWorkPresentation || ""}</strong></span>
                </div>
                <div class="personal-item">
                    <span>Adherence to School</span>
                    <span><strong>${reportCard.adherenceToSchool || ""}</strong></span>
                </div>
                <div class="personal-item">
                    <span>Co-curricular Activities</span>
                    <span><strong>${reportCard.coCurricularActivities || ""}</strong></span>
                </div>
                <div class="personal-item">
                    <span>Consideration to others</span>
                    <span><strong>${reportCard.considerationToOthers || ""}</strong></span>
                </div>
                <div class="personal-item">
                    <span>Speaking English</span>
                    <span><strong>${reportCard.speakingEnglish || ""}</strong></span>
                </div>
            </div>
            
            <div class="academic-section">
                <table class="assessment-table">
                    <thead>
                        <tr>
                            <th rowspan="2">GRADE</th>
                            <th rowspan="2">SUBJECT ASSESSED</th>
                            <th rowspan="2">OUT OF</th>
                            <th rowspan="2">H.P</th>
                            <th rowspan="2">B.O.T</th>
                            <th rowspan="2">AG</th>
                            <th rowspan="2">MID TERM</th>
                            <th rowspan="2">AG</th>
                            <th rowspan="2">E.O.T</th>
                            <th rowspan="2">AG</th>
                            <th rowspan="2">REMARKS</th>
                            <th rowspan="2">INITIAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${subjectMarks["ENGLISH"]?.grade || ""}</strong></td>
                            <td><strong>ENGLISH</strong></td>
                            <td><strong>100</strong></td>
                            <td>${subjectMarks["ENGLISH"]?.homework || ""}</td>
                            <td>${subjectMarks["ENGLISH"]?.bot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["ENGLISH"]?.midterm || ""}</td>
                            <td></td>
                            <td>${subjectMarks["ENGLISH"]?.eot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["ENGLISH"]?.remarks || ""}</td>
                            <td><strong>${subjectMarks["ENGLISH"]?.teacherInitial || ""}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${subjectMarks["MATHEMATICS"]?.grade || ""}</strong></td>
                            <td><strong>MATHEMATICS</strong></td>
                            <td><strong>100</strong></td>
                            <td>${subjectMarks["MATHEMATICS"]?.homework || ""}</td>
                            <td>${subjectMarks["MATHEMATICS"]?.bot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["MATHEMATICS"]?.midterm || ""}</td>
                            <td></td>
                            <td>${subjectMarks["MATHEMATICS"]?.eot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["MATHEMATICS"]?.remarks || ""}</td>
                            <td><strong>${subjectMarks["MATHEMATICS"]?.teacherInitial || ""}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${subjectMarks["SCIENCE"]?.grade || ""}</strong></td>
                            <td><strong>SCIENCE</strong></td>
                            <td><strong>100</strong></td>
                            <td>${subjectMarks["SCIENCE"]?.homework || ""}</td>
                            <td>${subjectMarks["SCIENCE"]?.bot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["SCIENCE"]?.midterm || ""}</td>
                            <td></td>
                            <td>${subjectMarks["SCIENCE"]?.eot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["SCIENCE"]?.remarks || ""}</td>
                            <td><strong>${subjectMarks["SCIENCE"]?.teacherInitial || ""}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${subjectMarks["S.ST AND R.E"]?.grade || ""}</strong></td>
                            <td><strong>S.ST AND R.E</strong></td>
                            <td><strong>100</strong></td>
                            <td>${subjectMarks["S.ST AND R.E"]?.homework || ""}</td>
                            <td>${subjectMarks["S.ST AND R.E"]?.bot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["S.ST AND R.E"]?.midterm || ""}</td>
                            <td></td>
                            <td>${subjectMarks["S.ST AND R.E"]?.eot || ""}</td>
                            <td></td>
                            <td>${subjectMarks["S.ST AND R.E"]?.remarks || ""}</td>
                            <td><strong>${subjectMarks["S.ST AND R.E"]?.teacherInitial || ""}</strong></td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td></td>
                            <td><strong>TOTAL</strong></td>
                            <td><strong>400</strong></td>
                            <td><strong>${totalHomework}</strong></td>
                            <td><strong>${totalBot}</strong></td>
                            <td></td>
                            <td><strong>${totalMidterm}</strong></td>
                            <td></td>
                            <td><strong>${totalEot}</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="grading-section">
            <div class="grading-title">GRADING MARKS</div>
            <table class="grading-table">
                <thead>
                    <tr>
                        ${gradingSystem.map((grade) => `<th>${grade.minMark}-${grade.maxMark}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${gradingSystem.map((grade) => `<td><strong>${grade.grade}</strong></td>`).join("")}
                    </tr>
                </tbody>
            </table>
            <div class="grade-key">
                <strong>KEY:</strong> &nbsp;&nbsp;&nbsp; ${gradingScaleHTML}
            </div>
            <div style="font-size: 9px;">
                <strong>A-VERY GOOD &nbsp;&nbsp;&nbsp; B-GOOD &nbsp;&nbsp;&nbsp; C-FAIR &nbsp;&nbsp;&nbsp; D-NEEDS IMPROVEMENT</strong>
            </div>
        </div>
        
        <div class="comments-section">
            <div style="margin-bottom: 12px;">
                <strong>CLASS TEACHER'S REPORT:</strong>
                <div class="comment-line">${reportCard.classTeacherComment || ""}</div>
                <div style="text-align: right; margin-top: 3px;">SIGN_____________</div>
            </div>
            
            <div style="margin-bottom: 12px;">
                <strong>HEADTEACHER'S COMMENT:</strong>
                <div class="comment-line">${reportCard.headteacherComment || ""}</div>
                <div style="text-align: right; margin-top: 3px;">SIGN_____________</div>
            </div>
        </div>
        
        <div class="footer-info">
            <div style="margin-bottom: 8px;">
                <strong>NEXT TERM BEGINS ON:</strong>_________________________________
                <strong>ENDS ON:</strong>_______________________________________________
            </div>
            
            <div style="text-align: center; margin-bottom: 8px;">
                At least 50% of the school fees should be paid before the Term Begins
            </div>
            
            <div style="text-align: center; font-weight: bold;">
                NOTE: This report is not valid without a school stamp.
            </div>
        </div>
    </div>
    
    <script>
        function generatePDF() {
            // Use browser's print to PDF functionality
            window.print();
        }
        
        // Auto-focus for better user experience
        window.onload = function() {
            document.body.focus();
        }
    </script>
</body>
</html>
  `
}
