import { getGradeFromSystem, getGradeComment } from "@/lib/grading"

export interface ReportCardData {
  reportCard: any
  student: any
  gradingSystem: any[]
}

export function generateReportCardHTML(data: ReportCardData): string {
  const { reportCard, student, gradingSystem } = data

  console.log("=== REPORT CARD GENERATOR DEBUG ===")
  console.log("Generating report card for:", student?.name)
  console.log("Student ID:", student?.id)
  console.log("Term ID:", student?.termId)
  console.log("Academic Year ID:", student?.academicYearId)
  console.log("Class ID:", student?.classId)

  // Try to find marks from multiple possible sources
  let marks = []

  // Primary source: student.marks
  if (student?.marks && Array.isArray(student.marks)) {
    marks = student.marks
    console.log("✅ Found marks in student.marks:", marks.length)
  }

  // Secondary source: reportCard.marks
  else if (reportCard?.marks && Array.isArray(reportCard.marks)) {
    marks = reportCard.marks
    console.log("✅ Found marks in reportCard.marks:", marks.length)
  }

  // Tertiary source: student.reportCard.marks
  else if (student?.reportCard?.marks && Array.isArray(student.reportCard.marks)) {
    marks = student.reportCard.marks
    console.log("✅ Found marks in student.reportCard.marks:", marks.length)
  }

  // Quaternary source: nested in student data
  else if (student?.class?.marks && Array.isArray(student.class.marks)) {
    marks = student.class.marks.filter((mark: any) => mark.studentId === student.id)
    console.log("✅ Found marks in student.class.marks (filtered):", marks.length)
  }

  // Check if marks are in the top-level data object
  else if (data?.marks && Array.isArray(data.marks)) {
    marks = data.marks
    console.log("✅ Found marks in data.marks:", marks.length)
  } else {
    console.log("❌ No marks found in any expected location")
    console.log("Available student properties:", Object.keys(student || {}))
    console.log("Available reportCard properties:", Object.keys(reportCard || {}))
    console.log("Available data properties:", Object.keys(data || {}))
  }

  console.log("Final marks array length:", marks.length)
  console.log("Raw marks data:", JSON.stringify(marks, null, 2))

  const classSubjects = student?.class?.subjects || []
  const currentTerm = student?.term
  const currentAcademicYear = student?.academicYear

  console.log("Current term:", currentTerm)
  console.log("Current academic year:", currentAcademicYear)
  console.log(
    "Class subjects:",
    classSubjects.map((s) => ({ id: s.id, name: s.name, category: s.category })),
  )

  // Filter marks for the current term and academic year
  const currentTermMarks = marks.filter((mark: any) => {
    const markTermId = mark.term?.id || mark.termId
    const markAcademicYearId = mark.academicYear?.id || mark.academicYearId
    const currentTermId = currentTerm?.id || student?.termId
    const currentAcademicYearId = currentAcademicYear?.id || student?.academicYearId

    const matchesTerm = currentTermId ? markTermId === currentTermId : true
    const matchesYear = currentAcademicYearId ? markAcademicYearId === currentAcademicYearId : true

    console.log(`Mark for ${mark.subject?.name || "Unknown Subject"}:`)
    console.log(`  - Mark Term ID: ${markTermId}`)
    console.log(`  - Current Term ID: ${currentTermId}`)
    console.log(`  - Term Match: ${matchesTerm}`)
    console.log(`  - Mark Academic Year ID: ${markAcademicYearId}`)
    console.log(`  - Current Academic Year ID: ${currentAcademicYearId}`)
    console.log(`  - Year Match: ${matchesYear}`)
    console.log(`  - Overall Match: ${matchesTerm && matchesYear}`)
    console.log(`  - Mark data:`, {
      homework: mark.homework,
      bot: mark.bot,
      midterm: mark.midterm,
      eot: mark.eot,
      total: mark.total,
      grade: mark.grade,
    })

    return matchesTerm && matchesYear
  })

  console.log("Filtered current term marks:", currentTermMarks.length)
  console.log(
    "Filtered marks details:",
    currentTermMarks.map((m) => ({
      subject: m.subject?.name,
      homework: m.homework,
      bot: m.bot,
      midterm: m.midterm,
      eot: m.eot,
      total: m.total,
      grade: m.grade,
    })),
  )

  // Group marks by subject for the current term
  const subjectMarks = currentTermMarks.reduce((acc: any, mark: any) => {
    const subjectName = mark.subject?.name || "Unknown"
    console.log(`Processing mark for subject: ${subjectName}`)
    console.log(`Mark details:`, {
      homework: mark.homework,
      bot: mark.bot,
      midterm: mark.midterm,
      eot: mark.eot,
      total: mark.total,
      grade: mark.grade,
      remarks: mark.remarks,
    })

    if (!acc[subjectName]) {
      // Get subject teacher initials - try multiple sources
      let teacherInitials = ""

      // Try to get from subject teachers
      const subjectTeacher = mark.subject?.subjectTeachers?.find((st: any) => st.classId === student?.class?.id)
      if (subjectTeacher?.teacher?.name) {
        teacherInitials = subjectTeacher.teacher.name
          .split(" ")
          .map((n: string) => n.charAt(0))
          .join("")
      }

      // Fallback to mark creator
      if (!teacherInitials && mark.createdBy?.name) {
        teacherInitials = mark.createdBy.name
          .split(" ")
          .map((n: string) => n.charAt(0))
          .join("")
      }

      // Fallback to mark teacher field if exists
      if (!teacherInitials && mark.teacher?.name) {
        teacherInitials = mark.teacher.name
          .split(" ")
          .map((n: string) => n.charAt(0))
          .join("")
      }

      // Convert to numbers and handle null/undefined values
      const homework = mark.homework !== null && mark.homework !== undefined ? Number(mark.homework) : 0
      const bot = mark.bot !== null && mark.bot !== undefined ? Number(mark.bot) : 0
      const midterm = mark.midterm !== null && mark.midterm !== undefined ? Number(mark.midterm) : 0
      const eot = mark.eot !== null && mark.eot !== undefined ? Number(mark.eot) : 0
      const total =
        mark.total !== null && mark.total !== undefined ? Number(mark.total) : homework + bot + midterm + eot

      console.log(`Converted values for ${subjectName}:`, { homework, bot, midterm, eot, total })

      // Calculate aggregates (grades based on individual scores)
      const botGrade = bot > 0 ? getGradeFromSystem(bot, gradingSystem) : ""
      const midtermGrade = midterm > 0 ? getGradeFromSystem(midterm, gradingSystem) : ""
      const eotGrade = eot > 0 ? getGradeFromSystem(eot, gradingSystem) : ""
      const overallGrade = mark.grade || (total > 0 ? getGradeFromSystem(total, gradingSystem) : "")

      console.log(`Calculated grades for ${subjectName}:`, { botGrade, midtermGrade, eotGrade, overallGrade })

      // Get remarks based on EOT performance or overall grade
      let remarks = ""
      if (mark.remarks) {
        remarks = mark.remarks
      } else if (eot > 0) {
        remarks = getGradeComment(eotGrade, gradingSystem) || ""
      } else if (total > 0) {
        remarks = getGradeComment(overallGrade, gradingSystem) || ""
      }

      acc[subjectName] = {
        homework: homework > 0 ? homework : "",
        bot: bot > 0 ? bot : "",
        botGrade,
        midterm: midterm > 0 ? midterm : "",
        midtermGrade,
        eot: eot > 0 ? eot : "",
        eotGrade,
        total: total > 0 ? total : "",
        grade: overallGrade,
        teacherInitials,
        remarks,
        category: mark.subject?.category || "GENERAL",
      }

      console.log(`Final processed data for ${subjectName}:`, acc[subjectName])
    }
    return acc
  }, {})

  console.log("Subject marks grouped:", Object.keys(subjectMarks))
  console.log("All subject marks data:", subjectMarks)

  // Get only general subjects for totals calculation
  const generalSubjects = classSubjects.filter((subject: any) => subject.category === "GENERAL")
  console.log(
    "General subjects for totals:",
    generalSubjects.map((s) => s.name),
  )

  // Calculate totals for general subjects only
  let totalHomework = 0
  let totalBot = 0
  let totalMidterm = 0
  let totalEot = 0
  let totalBotAggregates = 0
  let totalMidtermAggregates = 0
  let totalEotAggregates = 0

  generalSubjects.forEach((subject: any) => {
    const subjectData = subjectMarks[subject.name]
    if (subjectData) {
      totalHomework += Number(subjectData.homework) || 0
      totalBot += Number(subjectData.bot) || 0
      totalMidterm += Number(subjectData.midterm) || 0
      totalEot += Number(subjectData.eot) || 0

      // Calculate aggregate points (D1=1, D2=2, C3=3, C4=4, C5=5, C6=6, P7=7, P8=8, F9=9)
      const getAggregatePoints = (grade: string) => {
        const gradeUpper = grade.toUpperCase()
        if (gradeUpper.includes("D1")) return 1
        if (gradeUpper.includes("D2")) return 2
        if (gradeUpper.includes("C3")) return 3
        if (gradeUpper.includes("C4")) return 4
        if (gradeUpper.includes("C5")) return 5
        if (gradeUpper.includes("C6")) return 6
        if (gradeUpper.includes("P7")) return 7
        if (gradeUpper.includes("P8")) return 8
        if (gradeUpper.includes("F9")) return 9
        return 9 // Default to worst grade
      }

      totalBotAggregates += getAggregatePoints(subjectData.botGrade || "F9")
      totalMidtermAggregates += getAggregatePoints(subjectData.midtermGrade || "F9")
      totalEotAggregates += getAggregatePoints(subjectData.eotGrade || "F9")
    }
  })

  console.log("Totals calculated:", {
    totalHomework,
    totalBot,
    totalMidterm,
    totalEot,
    totalBotAggregates,
    totalMidtermAggregates,
    totalEotAggregates,
  })

  // Calculate division based on EOT aggregates
  const averageEotAggregate = generalSubjects.length > 0 ? totalEotAggregates / generalSubjects.length : 9
  let division = ""

  if (averageEotAggregate <= 2.5) {
    division = "DIVISION I"
  } else if (averageEotAggregate <= 4.5) {
    division = "DIVISION II"
  } else if (averageEotAggregate <= 6.5) {
    division = "DIVISION III"
  } else if (averageEotAggregate <= 8.5) {
    division = "DIVISION IV"
  } else {
    division = "FAIL"
  }

  console.log("Division calculated:", division, "from average:", averageEotAggregate)

  // Generate grading scale from database
  const gradingScaleHTML = gradingSystem
    .map((grade: any) => `${grade.minMark}-${grade.maxMark}-${grade.grade}`)
    .join(" &nbsp;&nbsp;&nbsp; ")

  // Generate subject rows dynamically from class subjects
  const subjectRows = classSubjects
    .map((subject: any) => {
      const subjectData = subjectMarks[subject.name] || {
        homework: "",
        bot: "",
        botGrade: "",
        midterm: "",
        midtermGrade: "",
        eot: "",
        eotGrade: "",
        grade: "",
        teacherInitials: "",
        remarks: "",
      }

      console.log(`Generating table row for ${subject.name}:`, subjectData)

      return `
      <tr>
        <td style="text-align: left; padding-left: 5px;"><strong>${subject.name.toUpperCase()}</strong></td>
        <td><strong>100</strong></td>
        <td>${subjectData.homework || ""}</td>
        <td>${subjectData.bot || ""}</td>
        <td><strong>${subjectData.botGrade || ""}</strong></td>
        <td>${subjectData.midterm || ""}</td>
        <td><strong>${subjectData.midtermGrade || ""}</strong></td>
        <td>${subjectData.eot || ""}</td>
        <td><strong>${subjectData.eotGrade || ""}</strong></td>
        <td style="text-align: left; padding-left: 5px;">${subjectData.remarks || ""}</td>
        <td><strong>${subjectData.teacherInitials || ""}</strong></td>
      </tr>
    `
    })
    .join("")

  // Create debug information
  const debugInfo =
    marks.length === 0
      ? `
    <div class="debug-info no-print">
        <strong>⚠️ DEBUG: No marks data found for this student</strong><br>
        Student: ${student?.name}<br>
        Student ID: ${student?.id}<br>
        Term: ${currentTerm?.name} (ID: ${currentTerm?.id})<br>
        Academic Year: ${currentAcademicYear?.year} (ID: ${currentAcademicYear?.id})<br>
        Class: ${student?.class?.name} (ID: ${student?.class?.id})<br>
        Subjects: ${classSubjects.map((s) => s.name).join(", ")}<br>
        <strong>Data Sources Checked:</strong><br>
        - student.marks: ${student?.marks ? `Array(${student.marks.length})` : "Not found"}<br>
        - reportCard.marks: ${reportCard?.marks ? `Array(${reportCard.marks.length})` : "Not found"}<br>
        - student.reportCard.marks: ${student?.reportCard?.marks ? `Array(${student.reportCard.marks.length})` : "Not found"}<br>
        - student.class.marks: ${student?.class?.marks ? `Array(${student.class.marks.length})` : "Not found"}<br>
        <em>Please ensure marks have been entered for this student in the selected term and academic year.</em><br>
        <em>The API endpoint may need to include marks data in the response.</em>
    </div>
  `
      : ""

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Card - ${student?.name || "Student"}</title>
    <style>
        @media print {
            body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .no-print { display: none; }
            .report-card { 
                page-break-inside: avoid;
                height: 100vh;
                max-height: 100vh;
                overflow: hidden;
                margin: 0;
                padding: 8px;
                box-sizing: border-box;
            }
            .header {
                margin-bottom: 6px;
                padding-bottom: 4px;
            }
            .student-info {
                margin-bottom: 6px;
            }
            .main-content {
                flex: 1;
                min-height: 0;
            }
            .assessment-table {
                font-size: 6px;
            }
            .assessment-table th,
            .assessment-table td {
                padding: 1px;
            }
            .personal-assessment-table {
                font-size: 6px;
            }
            .personal-assessment-table th,
            .personal-assessment-table td {
                padding: 2px;
            }
            .grading-section {
                margin-top: 6px;
            }
            .comments-section {
                margin-top: 6px;
            }
            .footer-info {
                margin-top: 6px;
            }
            .grading-table {
                font-size: 6px;
            }
            .debug-info {
                display: none;
            }
        }
        
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            background: white;
            font-size: 12px;
        }
        
        .report-card {
            max-width: 800px;
            margin: 0 auto;
            border: 3px solid #000;
            padding: 15px;
            background: white;
            min-height: 95vh;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
            position: relative;
            flex-shrink: 0;
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
            flex-shrink: 0;
        }
        
        .student-info div {
            flex: 1;
        }
        
        .main-content {
            display: flex;
            gap: 15px;
            flex: 1;
            min-height: 0;
        }
        
        .personal-assessment {
            width: 180px;
            flex-shrink: 0;
        }
        
        .academic-section {
            flex: 1;
            min-width: 0;
        }
        
        .assessment-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 9px;
        }
        
        .assessment-table th,
        .assessment-table td {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
            vertical-align: middle;
        }
        
        .assessment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .personal-assessment-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 9px;
        }
        
        .personal-assessment-table th,
        .personal-assessment-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
        }
        
        .personal-assessment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .grading-section {
            margin-top: 10px;
            text-align: center;
            flex-shrink: 0;
        }
        
        .grading-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 5px;
            font-size: 12px;
        }
        
        .grading-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 8px;
            margin-bottom: 5px;
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
            margin-bottom: 5px;
        }
        
        .comments-section {
            margin-top: 10px;
            font-size: 10px;
            flex-shrink: 0;
        }
        
        .comment-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            padding-bottom: 2px;
            min-height: 12px;
        }
        
        .footer-info {
            margin-top: 10px;
            font-size: 9px;
            flex-shrink: 0;
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
        
        .debug-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-size: 10px;
            color: #856404;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="showPrintPreview()">Print Preview</button>
    <button class="pdf-button no-print" onclick="generatePDF()">Save as PDF</button>
    
    ${debugInfo}
    
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
            <div>DIVISION: <strong>${division}</strong></div>
        </div>
        
        <div class="student-info">
            <div>CLASS: <strong>${student?.class?.name || "_".repeat(15)}</strong></div>
            <div>TERM: <strong>${currentTerm?.name || "_".repeat(15)}</strong></div>
            <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
        </div>
        
        <div class="main-content">
            <div class="personal-assessment">
                <table class="personal-assessment-table">
                    <thead>
                        <tr>
                            <th colspan="2">Personal Assessment</th>
                        </tr>
                        <tr>
                            <th>Assessment</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Discipline</td>
                            <td><strong>${reportCard.discipline || ""}</strong></td>
                        </tr>
                        <tr>
                            <td>Cleanliness</td>
                            <td><strong>${reportCard.cleanliness || ""}</strong></td>
                        </tr>
                        <tr>
                            <td>Class work Presentation</td>
                            <td><strong>${reportCard.classWorkPresentation || ""}</strong></td>
                        </tr>
                        <tr>
                            <td>Adherence to School</td>
                            <td><strong>${reportCard.adherenceToSchool || ""}</strong></td>
                        </tr>
                        <tr>
                            <td>Co-curricular Activities</td>
                            <td><strong>${reportCard.coCurricularActivities || ""}</strong></td>
                        </tr>
                        <tr>
                            <td>Consideration to others</td>
                            <td><strong>${reportCard.considerationToOthers || ""}</strong></td>
                        </tr>
                        <tr>
                            <td>Speaking English</td>
                            <td><strong>${reportCard.speakingEnglish || ""}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="academic-section">
                <table class="assessment-table">
                    <thead>
                        <tr>
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
                        ${subjectRows}
                        <tr style="background-color: #f0f0f0;">
                            <td style="text-align: left; padding-left: 5px;"><strong>TOTAL</strong></td>
                            <td><strong>${generalSubjects.length * 100}</strong></td>
                            <td><strong>${totalHomework || ""}</strong></td>
                            <td><strong>${totalBot || ""}</strong></td>
                            <td><strong>${totalBotAggregates || ""}</strong></td>
                            <td><strong>${totalMidterm || ""}</strong></td>
                            <td><strong>${totalMidtermAggregates || ""}</strong></td>
                            <td><strong>${totalEot || ""}</strong></td>
                            <td><strong>${totalEotAggregates || ""}</strong></td>
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
                        ${gradingSystem.map((grade: any) => `<th>${grade.minMark}-${grade.maxMark}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${gradingSystem.map((grade: any) => `<td><strong>${grade.grade}</strong></td>`).join("")}
                    </tr>
                </tbody>
            </table>
            <div class="grade-key">
                <strong>KEY:</strong> &nbsp;&nbsp;&nbsp; ${gradingScaleHTML}
            </div>
            <div style="font-size: 9px;">
                <strong>D1-EXCELLENT &nbsp;&nbsp;&nbsp; D2-VERY GOOD &nbsp;&nbsp;&nbsp; C3-GOOD &nbsp;&nbsp;&nbsp; C4-Q.GOOD &nbsp;&nbsp;&nbsp; C5-TRIED &nbsp;&nbsp;&nbsp; C6-FAIR &nbsp;&nbsp;&nbsp; P7-MORE EFFORT &nbsp;&nbsp;&nbsp; P8-MORE EFFORT NEEDED &nbsp;&nbsp;&nbsp; F9-FAILED</strong>
            </div>
        </div>
        
        <div class="comments-section">
            <div style="margin-bottom: 8px;">
                <strong>CLASS TEACHER'S REPORT:</strong>
                <div class="comment-line">${reportCard.classTeacherComment || ""}</div>
                <div style="text-align: right; margin-top: 2px;">SIGN_____________</div>
            </div>
            
            <div style="margin-bottom: 8px;">
                <strong>HEADTEACHER'S COMMENT:</strong>
                <div class="comment-line">${reportCard.headteacherComment || ""}</div>
                <div style="text-align: right; margin-top: 2px;">SIGN_____________</div>
            </div>
        </div>
        
        <div class="footer-info">
            <div style="margin-bottom: 5px;">
                <strong>NEXT TERM BEGINS ON:</strong>_________________________________
                <strong>ENDS ON:</strong>_______________________________________________
            </div>
            
            <div style="text-align: center; margin-bottom: 5px;">
                At least 50% of the school fees should be paid before the Term Begins
            </div>
            
            <div style="text-align: center; font-weight: bold;">
                NOTE: This report is not valid without a school stamp.
            </div>
        </div>
    </div>
    
    <script>
        function showPrintPreview() {
            window.print();
        }
        
        function generatePDF() {
            window.print();
        }
        
        window.onload = function() {
            document.body.focus();
        }
    </script>
</body>
</html>
  `
}

export function generateBulkReportCardsHTML(reportCards: any[], gradingSystem: any[]): string {
  const gradingScaleHTML = gradingSystem
    .map((grade: any) => `${grade.minMark}-${grade.maxMark}-${grade.grade}`)
    .join(" &nbsp;&nbsp;&nbsp; ")

  const className = reportCards[0]?.student?.class?.name || "Unknown Class"

  const reportCardsHTML = reportCards
    .map((reportCard, index) => {
      const singleReportHTML = generateReportCardHTML({
        reportCard,
        student: reportCard.student,
        gradingSystem,
      })

      // Extract just the report card content without the full HTML structure
      const reportCardContent = singleReportHTML
        .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, "")
        .replace(/<\/body>[\s\S]*?<\/html>/, "")
        .replace(/<button[^>]*>[\s\S]*?<\/button>/g, "")
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<div class="debug-info[^>]*>[\s\S]*?<\/div>/g, "")

      return `
        <div class="report-card-page" ${index > 0 ? 'style="page-break-before: always;"' : ""}>
          ${reportCardContent}
        </div>
      `
    })
    .join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class Report Cards - ${className}</title>
    <style>
        @media print {
            body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .no-print { display: none; }
            .report-card-page { 
                page-break-after: always; 
                page-break-inside: avoid;
                height: 100vh;
                max-height: 100vh;
                overflow: hidden;
                margin: 0;
                padding: 8px;
                box-sizing: border-box;
            }
            .report-card-page:last-child { page-break-after: avoid; }
            .report-card {
                height: 100%;
                max-height: 100%;
                margin: 0;
                padding: 10px;
            }
            .header {
                margin-bottom: 6px;
                padding-bottom: 4px;
            }
            .student-info {
                margin-bottom: 6px;
            }
            .main-content {
                flex: 1;
                min-height: 0;
            }
            .assessment-table {
                font-size: 6px;
            }
            .assessment-table th,
            .assessment-table td {
                padding: 1px;
            }
            .personal-assessment-table {
                font-size: 6px;
            }
            .personal-assessment-table th,
            .personal-assessment-table td {
                padding: 2px;
            }
            .grading-section {
                margin-top: 6px;
            }
            .comments-section {
                margin-top: 6px;
            }
            .footer-info {
                margin-top: 6px;
            }
            .grading-table {
                font-size: 6px;
            }
            .debug-info {
                display: none;
            }
        }
        
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .report-card {
            max-width: 800px;
            margin: 0 auto 40px auto;
            border: 3px solid #000;
            padding: 15px;
            background: white;
            min-height: 95vh;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
            position: relative;
            flex-shrink: 0;
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
            flex-shrink: 0;
        }
        
        .student-info div {
            flex: 1;
        }
        
        .main-content {
            display: flex;
            gap: 15px;
            flex: 1;
            min-height: 0;
        }
        
        .personal-assessment {
            width: 180px;
            flex-shrink: 0;
        }
        
        .academic-section {
            flex: 1;
            min-width: 0;
        }
        
        .assessment-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 9px;
        }
        
        .assessment-table th,
        .assessment-table td {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
            vertical-align: middle;
        }
        
        .assessment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .personal-assessment-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 9px;
        }
        
        .personal-assessment-table th,
        .personal-assessment-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
        }
        
        .personal-assessment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .grading-section {
            margin-top: 10px;
            text-align: center;
            flex-shrink: 0;
        }
        
        .grading-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 5px;
            font-size: 12px;
        }
        
        .grading-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 8px;
            margin-bottom: 5px;
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
            margin-bottom: 5px;
        }
        
        .comments-section {
            margin-top: 10px;
            font-size: 10px;
            flex-shrink: 0;
        }
        
        .comment-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            padding-bottom: 2px;
            min-height: 12px;
        }
        
        .footer-info {
            margin-top: 10px;
            font-size: 9px;
            flex-shrink: 0;
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
        
        .summary-info {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="summary-info no-print">
        <strong>${className} Report Cards</strong><br>
        Total: ${reportCards.length} students<br>
        Generated: ${new Date().toLocaleDateString()}
    </div>
    
    <button class="print-button no-print" onclick="showPrintPreview()">Print Preview</button>
    
    ${reportCardsHTML}
    
    <script>
        function showPrintPreview() {
            window.print();
        }
        
        window.onload = function() {
            // Auto-show print preview when page loads
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>
  `
}
