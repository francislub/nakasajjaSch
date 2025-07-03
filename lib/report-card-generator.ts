export interface ReportCardData {
    student: any
    reportCard: any
    gradingSystem: any[]
    division: string
    aggregate: number
    generalSubjectsData: any[]
    allSubjectsData: any[]
    totals: any
    term: any
    academicYear: any
    nextTermSchedule?: any
  }
  
  export function generateReportCardHTML(data: ReportCardData): string {
    const { student, reportCard, gradingSystem, division, aggregate, allSubjectsData, totals, nextTermSchedule } = data
  
    console.log("=== REPORT CARD GENERATOR ===")
    console.log("Student:", student?.name)
    console.log("Division:", division)
    console.log("Aggregate:", aggregate)
    console.log("General subjects:", data.generalSubjectsData?.length)
    console.log("All subjects:", allSubjectsData?.length)
    console.log("Next term schedule:", nextTermSchedule)
  
    if (!allSubjectsData || !Array.isArray(allSubjectsData)) {
      console.error("❌ allSubjectsData is not available or not an array")
      return generateErrorHTML("No subject data available for this student")
    }
  
    const currentTerm = data.term || student?.term
    const currentAcademicYear = data.academicYear || student?.academicYear
  
    // Calculate student age
    const calculateAge = (dateOfBirth: string | Date) => {
      if (!dateOfBirth) return ""
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }
  
    const studentAge = student?.dateOfBirth ? calculateAge(student.dateOfBirth) : ""
  
    // Generate grading scale from database
    const gradingScaleHTML = gradingSystem
      .map((grade: any) => `${grade.minMark}-${grade.maxMark}-${grade.grade}`)
      .join(" &nbsp;&nbsp;&nbsp; ")
  
    // Generate subject rows for all subjects (without H.P column)
    const subjectRows = allSubjectsData
      .map((subject: any) => {
        console.log(`Generating row for ${subject.name}:`, subject)
  
        return `
        <tr>
          <td style="text-align: left; padding: 3px; font-size: 12px; font-weight: bold; border: 1px solid #000;">${subject.name.toUpperCase()}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">100</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.bot || ""}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.botGrade || ""}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.midterm || ""}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.midtermGrade || ""}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.eot || ""}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.eotGrade || ""}</td>
          <td style="text-align: left; padding: 3px; font-size: 12px; font-weight: bold; border: 1px solid #000;">${subject.remarks || ""}</td>
          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${subject.teacherInitials || ""}</td>
        </tr>
      `
      })
      .join("")
  
    // Calculate totals for display (without homework)
    const totalBot = allSubjectsData.reduce((sum, s) => sum + (Number(s.bot) || 0), 0)
    const totalMidterm = allSubjectsData.reduce((sum, s) => sum + (Number(s.midterm) || 0), 0)
    const totalEot = allSubjectsData.reduce((sum, s) => sum + (Number(s.eot) || 0), 0)
  
    // Format next term dates with underlines
    const nextTermStartDate = nextTermSchedule?.nextTermStartDate
      ? new Date(nextTermSchedule.nextTermStartDate).toLocaleDateString()
      : "_".repeat(25)
  
    const nextTermEndDate = nextTermSchedule?.nextTermEndDate
      ? new Date(nextTermSchedule.nextTermEndDate).toLocaleDateString()
      : "_".repeat(25)
  
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report Card - ${student?.name || "Student"}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
          @page {
              size: A4;
              margin: 0.5in;
          }
          
          @media print {
              * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              
              html, body { 
                  margin: 0 !important; 
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  font-family: 'Times New Roman', serif !important;
                  font-size: 12px !important;
                  line-height: 1.2 !important;
              }
              
              .no-print { 
                  display: none !important; 
              }
              
              .report-card { 
                  width: 100% !important;
                  height: auto !important;
                  max-width: none !important;
                  margin: 0 !important;
                  padding: 15px !important;
                  box-sizing: border-box !important;
                  border: 3px solid #000 !important;
                  background: white !important;
                  page-break-inside: avoid !important;
                  position: relative !important;
              }
              
              .report-card::before {
                  content: '' !important;
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  background-image: url('/images/logo.jpg') !important;
                  background-repeat: no-repeat !important;
                  background-position: center center !important;
                  background-size: 300px 300px !important;
                  opacity: 0.03 !important;
                  z-index: -1 !important;
                  pointer-events: none !important;
              }
              
              .header {
                  text-align: center !important;
                  border-bottom: 2px solid #000 !important;
                  padding-bottom: 10px !important;
                  margin-bottom: 15px !important;
                  position: relative !important;
                  background: rgba(255, 255, 255, 0.98) !important;
              }
              
              .school-name {
                  font-size: 18px !important;
                  margin-bottom: 3px !important;
                  font-weight: bold !important;
              }
              
              .motto {
                  font-size: 14px !important;
                  margin-bottom: 3px !important;
                  font-weight: bold !important;
                  font-style: italic !important;
              }
              
              .contact-info {
                  font-size: 12px !important;
                  margin-bottom: 5px !important;
                  font-weight: bold !important;
              }
              
              .report-title {
                  font-size: 16px !important;
                  font-weight: bold !important;
                  text-decoration: underline !important;
              }
              
              .student-info {
                  margin-bottom: 10px !important;
                  font-size: 14px !important;
                  background: rgba(255, 255, 255, 0.98) !important;
                  padding: 5px !important;
                  display: flex !important;
                  justify-content: space-between !important;
              }
              
              .main-content {
                  background: rgba(255, 255, 255, 0.98) !important;
                  padding: 5px !important;
              }
              
              .assessment-table {
                  font-size: 12px !important;
                  width: 100% !important;
                  border-collapse: collapse !important;
                  margin-bottom: 15px !important;
              }
              
              .assessment-table th,
              .assessment-table td {
                  padding: 3px !important;
                  border: 1px solid #000 !important;
                  font-weight: bold !important;
                  text-align: center !important;
              }
              
              .assessment-table th {
                  background-color: #f0f0f0 !important;
                  font-size: 11px !important;
              }
              
              .personal-assessment-table {
                  font-size: 12px !important;
                  width: 100% !important;
                  border-collapse: collapse !important;
                  margin-bottom: 15px !important;
              }
              
              .personal-assessment-table th,
              .personal-assessment-table td {
                  padding: 4px !important;
                  border: 1px solid #000 !important;
                  font-weight: bold !important;
              }
              
              .personal-assessment-table th {
                  background-color: #f0f0f0 !important;
                  text-align: center !important;
                  font-size: 11px !important;
              }
              
              .personal-assessment-header {
                  font-size: 14px !important;
                  margin-bottom: 8px !important;
                  font-weight: bold !important;
                  text-align: center !important;
                  text-decoration: underline !important;
              }
              
              .personal-assessment-key {
                  font-size: 11px !important;
                  margin-top: 5px !important;
                  text-align: center !important;
                  font-weight: bold !important;
              }
              
              .grading-section {
                  margin-top: 10px !important;
                  text-align: center !important;
                  background: rgba(255, 255, 255, 0.98) !important;
                  padding: 5px !important;
              }
              
              .grading-title {
                  font-size: 14px !important;
                  margin-bottom: 5px !important;
                  font-weight: bold !important;
                  text-decoration: underline !important;
              }
              
              .grading-table {
                  font-size: 11px !important;
                  margin-bottom: 5px !important;
                  border-collapse: collapse !important;
                  width: 100% !important;
              }
              
              .grading-table th,
              .grading-table td {
                  padding: 2px !important;
                  border: 1px solid #000 !important;
                  font-weight: bold !important;
                  text-align: center !important;
              }
              
              .grading-table th {
                  background-color: #f0f0f0 !important;
              }
              
              .grade-key {
                  font-size: 10px !important;
                  margin-bottom: 3px !important;
                  font-weight: bold !important;
              }
              
              .grade-description {
                  font-size: 9px !important;
                  margin-bottom: 5px !important;
                  font-weight: bold !important;
              }
              
              .comments-section {
                  margin-top: 10px !important;
                  font-size: 12px !important;
                  background: rgba(255, 255, 255, 0.98) !important;
                  padding: 5px !important;
              }
              
              .comment-line {
                  min-height: 12px !important;
                  margin-bottom: 5px !important;
                  border-bottom: 1px solid #000 !important;
                  padding-bottom: 2px !important;
              }
              
              .signature-line {
                  text-align: right !important;
                  margin-top: 2px !important;
                  font-size: 11px !important;
                  font-weight: bold !important;
              }
              
              .footer-info {
                  margin-top: 10px !important;
                  font-size: 11px !important;
                  background: rgba(255, 255, 255, 0.98) !important;
                  padding: 5px !important;
              }
              
              .logo-left, .photo-right {
                  width: 50px !important;
                  height: 50px !important;
              }
              
              .photo-right {
                  height: 60px !important;
              }
              
              .underline-field {
                  border-bottom: 1px solid #000 !important;
                  display: inline-block !important;
                  min-width: 100px !important;
                  text-align: center !important;
                  padding-bottom: 1px !important;
                  font-weight: normal !important;
              }
          }
          
          body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              font-size: 14px;
          }
          
          .report-card {
              max-width: 800px;
              margin: 0 auto;
              border: 3px solid #000;
              padding: 20px;
              background: white;
              min-height: 95vh;
              position: relative;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .report-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: url('/images/logo.jpg');
              background-repeat: no-repeat;
              background-position: center center;
              background-size: 400px 400px;
              opacity: 0.02;
              z-index: -1;
              pointer-events: none;
          }
          
          .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
              position: relative;
              background: rgba(255, 255, 255, 0.98);
              border-radius: 5px;
              padding: 15px;
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
              border: 2px solid #000;
              background: #f9f9f9;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
          }
          
          .school-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
          }
          
          .motto {
              font-size: 16px;
              font-style: italic;
              font-weight: bold;
              margin-bottom: 5px;
          }
          
          .contact-info {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
          }
          
          .report-title {
              font-size: 18px;
              font-weight: bold;
              text-decoration: underline;
          }
          
          .student-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.98);
              padding: 10px;
              border-radius: 5px;
          }
          
          .student-info div {
              flex: 1;
              font-weight: bold;
          }
          
          .main-content {
              background: rgba(255, 255, 255, 0.98);
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
          }
          
          .assessment-table {
              border-collapse: collapse;
              width: 100%;
              font-size: 14px;
              margin-bottom: 20px;
          }
          
          .assessment-table th,
          .assessment-table td {
              border: 2px solid #000;
              padding: 6px;
              text-align: center;
              vertical-align: middle;
              font-weight: bold;
          }
          
          .assessment-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              font-size: 12px;
          }
          
          /* Column widths without H.P column */
          .assessment-table th:nth-child(1) { width: 18%; }
          .assessment-table th:nth-child(2) { width: 8%; }
          .assessment-table th:nth-child(3) { width: 8%; }
          .assessment-table th:nth-child(4) { width: 7%; }
          .assessment-table th:nth-child(5) { width: 8%; }
          .assessment-table th:nth-child(6) { width: 7%; }
          .assessment-table th:nth-child(7) { width: 8%; }
          .assessment-table th:nth-child(8) { width: 7%; }
          .assessment-table th:nth-child(9) { width: 22%; }
          .assessment-table th:nth-child(10) { width: 7%; }
          
          .personal-assessment {
              background: rgba(255, 255, 255, 0.98);
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
          }
          
          .personal-assessment-table {
              border-collapse: collapse;
              width: 100%;
              font-size: 14px;
          }
          
          .personal-assessment-table th,
          .personal-assessment-table td {
              border: 2px solid #000;
              padding: 8px;
              text-align: left;
              font-weight: bold;
          }
          
          .personal-assessment-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
              font-size: 12px;
          }
          
          .personal-assessment-table th:nth-child(1),
          .personal-assessment-table th:nth-child(3) { width: 35%; }
          .personal-assessment-table th:nth-child(2),
          .personal-assessment-table th:nth-child(4) { width: 15%; }
          
          .personal-assessment-header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              text-decoration: underline;
          }
          
          .personal-assessment-key {
              text-align: center;
              font-size: 12px;
              margin-top: 8px;
              font-weight: bold;
          }
          
          .grading-section {
              text-align: center;
              background: rgba(255, 255, 255, 0.98);
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
          }
          
          .grading-title {
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 8px;
              font-size: 16px;
          }
          
          .grading-table {
              border-collapse: collapse;
              width: 100%;
              font-size: 12px;
              margin-bottom: 8px;
          }
          
          .grading-table th,
          .grading-table td {
              border: 2px solid #000;
              padding: 4px;
              text-align: center;
              font-weight: bold;
          }
          
          .grading-table th {
              background-color: #f0f0f0;
              font-weight: bold;
          }
          
          .grade-key {
              font-size: 12px;
              margin-bottom: 8px;
              font-weight: bold;
          }
          
          .grade-description {
              font-size: 11px;
              margin-bottom: 10px;
              font-weight: bold;
          }
          
          .comments-section {
              font-size: 14px;
              background: rgba(255, 255, 255, 0.98);
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
          }
          
          .comment-line {
              border-bottom: 2px solid #000;
              margin-bottom: 8px;
              padding-bottom: 4px;
              min-height: 18px;
          }
          
          .signature-line {
              text-align: right;
              margin-top: 4px;
              font-size: 13px;
              font-weight: bold;
          }
          
          .footer-info {
              font-size: 13px;
              background: rgba(255, 255, 255, 0.98);
              padding: 15px;
              border-radius: 5px;
              font-weight: bold;
          }
          
          .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #007bff;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              font-weight: bold;
          }
          
          .print-button:hover {
              background: #0056b3;
              transform: translateY(-1px);
          }
          
          .pdf-button {
              position: fixed;
              top: 80px;
              right: 20px;
              background: #28a745;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              font-weight: bold;
          }
          
          .pdf-button:hover {
              background: #218838;
              transform: translateY(-1px);
          }
  
          .underline-field {
              border-bottom: 2px solid #000;
              display: inline-block;
              min-width: 120px;
              text-align: center;
              padding-bottom: 2px;
              font-weight: normal;
          }
      </style>
  </head>
  <body>
      <button class="print-button no-print" onclick="printReport()">🖨️ Print Report</button>
      <button class="pdf-button no-print" onclick="generatePDF()">📄 Save as PDF</button>
      
      <div class="report-card" id="report-card">
          <div class="header">
              <div class="logo-left">
                  <img src="/images/logo.jpg" alt="School Logo" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'">
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
                  TEL: 0774-305717 / 0704-305747 / 0784-450896/0709-986390
              </div>
              <div class="report-title">PROGRESSIVE REPORT</div>
          </div>
          
          <div class="student-info">
              <div>NAME: <span class="underline-field">${student?.name || ""}</span></div>
              <div>DIVISION: <span class="underline-field">${division || ""}</span></div>
              <div>AGE: <span class="underline-field">${studentAge ? `${studentAge} years` : ""}</span></div>
          </div>
          
          <div class="student-info">
              <div>CLASS: <span class="underline-field">${student?.class?.name || ""}</span></div>
              <div>TERM: <span class="underline-field">${currentTerm?.name || ""}</span></div>
              <div>DATE: <span class="underline-field">${new Date().toLocaleDateString()}</span></div>
          </div>
          
          <div class="main-content">
              <table class="assessment-table">
                  <thead>
                      <tr>
                          <th rowspan="2">SUBJECT ASSESSED</th>
                          <th rowspan="2">OUT OF</th>
                          <th rowspan="2">B.O.T</th>
                          <th rowspan="2">AG</th>
                          <th rowspan="2">M.O.T</th>
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
                          <td style="text-align: left; padding: 3px; font-size: 12px; font-weight: bold; border: 1px solid #000;">TOTAL</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${allSubjectsData.length * 100}</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${totalBot || ""}</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${totals?.botAggregates < 4 ? "X" : totals?.botAggregates || ""}</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${totalMidterm || ""}</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${totals?.midtermAggregates < 4 ? "X" : totals?.midtermAggregates || ""}</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${totalEot || ""}</td>
                          <td style="font-size: 12px; font-weight: bold; text-align: center; border: 1px solid #000;">${totals?.eotAggregates < 4 ? "X" : totals?.eotAggregates || ""}</td>
                          <td style="border: 1px solid #000;"></td>
                          <td style="border: 1px solid #000;"></td>
                      </tr>
                  </tbody>
              </table>
          </div>
          
          <div class="personal-assessment">
              <div class="personal-assessment-header">Personal Assessment</div>
              <table class="personal-assessment-table">
                  <thead>
                      <tr>
                          <th>Assessment</th>
                          <th>Grade</th>
                          <th>Assessment</th>
                          <th>Grade</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td>Discipline</td>
                          <td><strong>${reportCard?.discipline || ""}</strong></td>
                          <td>Co-curricular Activities</td>
                          <td><strong>${reportCard?.coCurricularActivities || ""}</strong></td>
                      </tr>
                      <tr>
                          <td>Cleanliness</td>
                          <td><strong>${reportCard?.cleanliness || ""}</strong></td>
                          <td>Consideration to others</td>
                          <td><strong>${reportCard?.considerationToOthers || ""}</strong></td>
                      </tr>
                      <tr>
                          <td>Class work Presentation</td>
                          <td><strong>${reportCard?.classWorkPresentation || ""}</strong></td>
                          <td>Speaking English</td>
                          <td><strong>${reportCard?.speakingEnglish || ""}</strong></td>
                      </tr>
                      <tr>
                          <td>Adherence to School</td>
                          <td><strong>${reportCard?.adherenceToSchool || ""}</strong></td>
                          <td></td>
                          <td></td>
                      </tr>
                  </tbody>
              </table>
              <div class="personal-assessment-key">
               <strong>KEY:</strong> &nbsp;&nbsp;&nbsp;
                  <strong>A-VERY GOOD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; B-GOOD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; C-FAIR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; D-NEEDS IMPROVEMENT</strong>
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
          </div>
          
          <div class="comments-section">
              <div style="margin-bottom: 10px;">
                  <strong>CLASS TEACHER'S REPORT:</strong>
                  <div class="comment-line">${reportCard?.classTeacherComment || ""}</div>
                  <div class="signature-line">SIGN_________________________</div>
              </div>
              
              <div style="margin-bottom: 10px;">
                  <strong>HEADTEACHER'S COMMENT:</strong>
                  <div class="comment-line">${reportCard?.headteacherComment || ""}</div>
                  <div class="signature-line">SIGN_________________________</div>
              </div>
          </div>
          
          <div class="footer-info">
              <div style="margin-bottom: 6px;">
                  <strong>NEXT TERM BEGINS ON:</strong> <span class="underline-field">${nextTermStartDate}</span>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>ENDS ON:</strong> <span class="underline-field">${nextTermEndDate}</span>
              </div>
              
              <div style="text-align: center; margin-bottom: 6px;">
                  At least 50% of the school fees should be paid before the Term Begins
              </div>
              
              <div style="text-align: center; font-weight: bold;">
                  NOTE: This report is not valid without a school stamp.
              </div>
          </div>
      </div>
      
      <script>
          function printReport() {
              // Hide buttons before printing
              const buttons = document.querySelectorAll('.no-print');
              buttons.forEach(btn => btn.style.display = 'none');
              
              // Print the page
              window.print();
              
              // Show buttons after printing
              setTimeout(() => {
                  buttons.forEach(btn => btn.style.display = 'block');
              }, 1000);
          }
          
          async function generatePDF() {
              const element = document.getElementById('report-card');
              const studentName = '${student?.name || "Student"}';
              const className = '${student?.class?.name || "Class"}';
              const termName = '${currentTerm?.name || "Term"}';
              
              // Show loading indicator
              const pdfButton = document.querySelector('.pdf-button');
              const originalText = pdfButton.innerHTML;
              pdfButton.innerHTML = '⏳ Generating PDF...';
              pdfButton.disabled = true;
              
              try {
                  // Hide buttons during PDF generation
                  const buttons = document.querySelectorAll('.no-print');
                  buttons.forEach(btn => btn.style.display = 'none');
                  
                  // Wait for images to load
                  await waitForImages();
                  
                  // Generate canvas from the report card element
                  const canvas = await html2canvas(element, {
                      scale: 2,
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: '#ffffff',
                      logging: false,
                      width: element.offsetWidth,
                      height: element.offsetHeight,
                      scrollX: 0,
                      scrollY: 0
                  });
                  
                  // Create PDF
                  const { jsPDF } = window.jspdf;
                  const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                  });
                  
                  // Calculate dimensions to fit A4
                  const imgWidth = 210; // A4 width in mm
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  // Add image to PDF
                  const imgData = canvas.toDataURL('image/jpeg', 1.0);
                  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                  
                  // Save PDF
                  const filename = \`Report_Card_\${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_\${className.replace(/[^a-zA-Z0-9]/g, '_')}_\${termName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`;
                  pdf.save(filename);
                  
                  // Restore buttons
                  buttons.forEach(btn => btn.style.display = 'block');
                  pdfButton.innerHTML = originalText;
                  pdfButton.disabled = false;
                  
              } catch (error) {
                  console.error('PDF generation failed:', error);
                  
                  // Restore buttons even on error
                  const buttons = document.querySelectorAll('.no-print');
                  buttons.forEach(btn => btn.style.display = 'block');
                  pdfButton.innerHTML = originalText;
                  pdfButton.disabled = false;
                  
                  alert('PDF generation failed. Please try again or use the print function.');
              }
          }
          
          function waitForImages() {
              return new Promise((resolve) => {
                  const images = document.querySelectorAll('img');
                  let loadedImages = 0;
                  const totalImages = images.length;
                  
                  if (totalImages === 0) {
                      resolve();
                      return;
                  }
                  
                  images.forEach(img => {
                      if (img.complete) {
                          loadedImages++;
                          if (loadedImages === totalImages) {
                              resolve();
                          }
                      } else {
                          img.onload = img.onerror = () => {
                              loadedImages++;
                              if (loadedImages === totalImages) {
                                  resolve();
                              }
                          };
                      }
                  });
              });
          }
          
          // Ensure all content is loaded before enabling interactions
          window.addEventListener('load', function() {
              // Pre-load images
              const images = document.querySelectorAll('img');
              images.forEach(img => {
                  if (!img.complete) {
                      img.addEventListener('load', function() {
                          console.log('Image loaded:', img.src);
                      });
                      img.addEventListener('error', function() {
                          console.log('Image failed to load:', img.src);
                      });
                  }
              });
              
              // Focus the document
              document.body.focus();
          });
      </script>
  </body>
  </html>
    `
  }
  
  function generateErrorHTML(message: string): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report Card Error</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 40px;
              background: #f5f5f5;
          }
          .error-container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
          }
          .error-icon {
              font-size: 48px;
              color: #e74c3c;
              margin-bottom: 20px;
          }
          .error-message {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
          }
          .error-details {
              font-size: 14px;
              color: #666;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              margin-top: 20px;
          }
      </style>
  </head>
  <body>
      <div class="error-container">
          <div class="error-icon">⚠️</div>
          <div class="error-message">${message}</div>
          <div class="error-details">
              Please ensure that:
              <ul style="text-align: left; display: inline-block;">
                  <li>The student has marks entered for the selected term</li>
                  <li>The academic year and term are properly configured</li>
                  <li>The student is assigned to a class with subjects</li>
              </ul>
          </div>
      </div>
  </body>
  </html>
    `
  }
  
  export function generateBulkReportCardsHTML(reportCardsData: ReportCardData[]): string {
    if (!reportCardsData || reportCardsData.length === 0) {
      return generateErrorHTML("No report cards data provided")
    }
  
    const className = reportCardsData[0]?.student?.class?.name || "Unknown Class"
  
    const reportCardsHTML = reportCardsData
      .map((reportData, index) => {
        const singleReportHTML = generateReportCardHTML(reportData)
  
        // Extract just the report card content without the full HTML structure
        const reportCardContent = singleReportHTML
          .replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, "")
          .replace(/<\/body>[\s\S]*?<\/html>/, "")
          .replace(/<button[^>]*>[\s\S]*?<\/button>/g, "")
          .replace(/<script[\s\S]*?<\/script>/g, "")
  
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
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
          @page {
              size: A4;
              margin: 0.5in;
          }
          
          @media print {
              * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              
              html, body { 
                  margin: 0 !important; 
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
              }
              
              .no-print { 
                  display: none !important; 
              }
              
              .report-card-page { 
                  page-break-after: always !important; 
                  page-break-inside: avoid !important;
                  width: 100% !important;
                  height: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-sizing: border-box !important;
              }
              
              .report-card-page:last-child { 
                  page-break-after: avoid !important; 
              }
          }
          
          body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
          }
          
          .print-button, .pdf-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #007bff;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              font-weight: bold;
          }
          
          .pdf-button {
              top: 80px;
              background: #28a745;
          }
          
          .print-button:hover {
              background: #0056b3;
              transform: translateY(-1px);
          }
          
          .pdf-button:hover {
              background: #218838;
              transform: translateY(-1px);
          }
          
          .summary-info {
              position: fixed;
              top: 20px;
              left: 20px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 15px;
              border-radius: 5px;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .report-card-page {
              margin-bottom: 30px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
      </style>
  </head>
  <body>
      <div class="summary-info no-print">
          <strong>📊 ${className} Report Cards</strong><br>
          📋 Total: ${reportCardsData.length} students<br>
          📅 Generated: ${new Date().toLocaleDateString()}<br>
          ⏰ Time: ${new Date().toLocaleTimeString()}
      </div>
      
      <button class="print-button no-print" onclick="printAllReports()">🖨️ Print All Reports</button>
      <button class="pdf-button no-print" onclick="generateBulkPDF()">📄 Save All as PDF</button>
      
      <div id="bulk-reports">
          ${reportCardsHTML}
      </div>
      
      <script>
          function printAllReports() {
              // Hide buttons before printing
              const buttons = document.querySelectorAll('.no-print');
              buttons.forEach(btn => btn.style.display = 'none');
              
              // Print the page
              window.print();
              
              // Show buttons after printing
              setTimeout(() => {
                  buttons.forEach(btn => btn.style.display = 'block');
              }, 1000);
          }
          
          async function generateBulkPDF() {
              const element = document.getElementById('bulk-reports');
              const className = '${className}';
              
              // Show loading indicator
              const pdfButton = document.querySelector('.pdf-button');
              const originalText = pdfButton.innerHTML;
              pdfButton.innerHTML = '⏳ Generating Bulk PDF...';
              pdfButton.disabled = true;
              
              try {
                  // Hide buttons during PDF generation
                  const buttons = document.querySelectorAll('.no-print');
                  buttons.forEach(btn => btn.style.display = 'none');
                  
                  // Wait for images to load
                  await waitForImages();
                  
                  // Generate canvas from the bulk reports element
                  const canvas = await html2canvas(element, {
                      scale: 2,
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: '#ffffff',
                      logging: false,
                      width: element.scrollWidth,
                      height: element.scrollHeight
                  });
                  
                  // Create PDF
                  const { jsPDF } = window.jspdf;
                  const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                  });
                  
                  // Calculate dimensions to fit A4
                  const imgWidth = 210; // A4 width in mm
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  // Add image to PDF
                  const imgData = canvas.toDataURL('image/jpeg', 1.0);
                  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                  
                  // Save PDF
                  const filename = \`Bulk_Report_Cards_\${className.replace(/[^a-zA-Z0-9]/g, '_')}_\${new Date().toISOString().split('T')[0]}.pdf\`;
                  pdf.save(filename);
                  
                  // Restore buttons
                  buttons.forEach(btn => btn.style.display = 'block');
                  pdfButton.innerHTML = originalText;
                  pdfButton.disabled = false;
                  
              } catch (error) {
                  console.error('Bulk PDF generation failed:', error);
                  
                  // Restore buttons even on error
                  const buttons = document.querySelectorAll('.no-print');
                  buttons.forEach(btn => btn.style.display = 'block');
                  pdfButton.innerHTML = originalText;
                  pdfButton.disabled = false;
                  
                  alert('Bulk PDF generation failed. Please try again or use the print function.');
              }
          }
          
          function waitForImages() {
              return new Promise((resolve) => {
                  const images = document.querySelectorAll('img');
                  let loadedImages = 0;
                  const totalImages = images.length;
                  
                  if (totalImages === 0) {
                      resolve();
                      return;
                  }
                  
                  images.forEach(img => {
                      if (img.complete) {
                          loadedImages++;
                          if (loadedImages === totalImages) {
                              resolve();
                          }
                      } else {
                          img.onload = img.onerror = () => {
                              loadedImages++;
                              if (loadedImages === totalImages) {
                                  resolve();
                              }
                          };
                      }
                  });
              });
          }
          
          // Ensure all content is loaded
          window.addEventListener('load', function() {
              const images = document.querySelectorAll('img');
              let loadedImages = 0;
              
              if (images.length === 0) {
                  document.body.focus();
                  return;
              }
              
              images.forEach(img => {
                  if (img.complete) {
                      loadedImages++;
                  } else {
                      img.onload = img.onerror = () => {
                          loadedImages++;
                          if (loadedImages === images.length) {
                              document.body.focus();
                          }
                      };
                  }
              });
              
              if (loadedImages === images.length) {
                  document.body.focus();
              }
          });
      </script>
  </body>
  </html>
    `
  }
  