import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Cleanly format and sanitize cell values
 */
const formatCellValue = (val) => {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') {
    // If it looks like a currency amount (> 1000 and has no decimals or 2 decimals)
    if (val >= 1000) {
      return val.toLocaleString('en-NG')
    }
    return String(val)
  }
  return String(val).trim()
}

/**
 * 1. Export Data to CSV
 */
export const exportToCsv = (filename, rows, headers) => {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to export')
  }

  const keys = Object.keys(headers)
  const headerLabels = Object.values(headers)

  const headerRow = headerLabels.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',')
  const dataRows = rows.map((row) =>
    keys
      .map((k) => {
        const val = formatCellValue(row[k])
        return `"${val.replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csvString = '\uFEFF' + [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 2. Export Data to Excel (.xls XML / HTML Format with proper Styling)
 */
export const exportToExcel = (filename, rows, headers, sheetTitle = 'Data Export') => {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to export')
  }

  const keys = Object.keys(headers)
  const headerLabels = Object.values(headers)

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${sheetTitle.replace(/[\\/?*:[\]]/g, '')}</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      h2 { color: #0369a1; margin-bottom: 4px; }
      p { color: #64748b; font-size: 11px; margin-top: 0; margin-bottom: 12px; }
      table { border-collapse: collapse; width: 100%; font-size: 11px; }
      th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #0369a1; padding: 8px 10px; text-align: left; }
      td { border: 1px solid #cbd5e1; padding: 6px 10px; color: #1e293b; }
      tr:nth-child(even) { background-color: #f8fafc; }
    </style>
  </head>
  <body>
    <h2>NexFieldForce Enterprise - ${sheetTitle}</h2>
    <p>Generated on: ${new Date().toLocaleString()} | Total Records: ${rows.length}</p>
    <table>
      <thead>
        <tr>${headerLabels.map((h) => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) =>
              `<tr>${keys
                .map((k) => `<td>${formatCellValue(r[k])}</td>`)
                .join('')}</tr>`
          )
          .join('')}
      </tbody>
    </table>
  </body>
  </html>`

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 3. Export Data to PDF with Branded Styling
 */
export const exportToPdf = (filename, rows, headers, docTitle = 'Data Export Report') => {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to export')
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Top Brand Banner
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageWidth, 52, 'F')

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('NexFieldForce Enterprise', 30, 28)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(56, 189, 248) // sky-400
  doc.text(docTitle, 30, 43)

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(
    `Export Date: ${new Date().toLocaleString()}  |  Total Records: ${rows.length}`,
    pageWidth - 30,
    35,
    { align: 'right' }
  )

  // 2. Data Table
  const keys = Object.keys(headers)
  const headerLabels = Object.values(headers)
  const tableData = rows.map((r) => keys.map((k) => formatCellValue(r[k]) || '—'))

  const applyTable = doc.autoTable || autoTable.default || autoTable
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      head: [headerLabels],
      body: tableData,
      startY: 68,
      theme: 'grid',
      headStyles: {
        fillColor: [2, 132, 199], // sky-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 4,
      },
      styles: {
        fontSize: 7,
        cellPadding: 3.5,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 25, right: 25, bottom: 35 },
    })
  } else {
    applyTable(doc, {
      head: [headerLabels],
      body: tableData,
      startY: 68,
      theme: 'grid',
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 4,
      },
      styles: {
        fontSize: 7,
        cellPadding: 3.5,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 25, right: 25, bottom: 35 },
    })
  }

  // 3. Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Page ${i} of ${pageCount}  •  NexFieldForce Enterprise Confidential Record`,
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    )
  }

  doc.save(`${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * 4. Generate Official Verified Monthly Payslip PDF Voucher
 */
export const generateOfficialPayslipPdf = (opts = {}) => {
  const {
    employeeName = 'Staff Member',
    employeeCode = 'NEX-0007',
    role = 'Corporate Staff Member',
    department = 'Operations & Administration',
    period = 'August 2026',
    companyName = 'NexFieldForce Enterprise Platform',
    baseSalary = 350000,
    housing = 120000,
    transport = 60000,
    utility = 30000,
    commission = 0,
    taxPaye = 42000,
    pension = 28000,
    nhf = 5000,
  } = opts

  const grossPay = Number(baseSalary) + Number(housing) + Number(transport) + Number(utility) + Number(commission)
  const totalDeductions = Number(taxPaye) + Number(pension) + Number(nhf)
  const netPay = grossPay - totalDeductions

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Top Header Banner
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageWidth, 75, 'F')

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(companyName, 35, 36)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(56, 189, 248) // sky-400
  doc.text(`Official Monthly Salary Disbursement Voucher — ${period}`, 35, 56)

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Disbursed: ${new Date().toLocaleDateString()} | Ref: SLIP-${Date.now().toString().slice(-6)}`, pageWidth - 35, 45, { align: 'right' })

  // Employee Metadata Box
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.roundedRect(35, 90, pageWidth - 70, 75, 6, 6, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Employee Name:', 45, 110)
  doc.text('Staff Code:', 45, 128)
  doc.text('Department:', 45, 146)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(employeeName, 140, 110)
  doc.text(employeeCode, 140, 128)
  doc.text(department, 140, 146)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Designation:', 320, 110)
  doc.text('Payment Mode:', 320, 128)
  doc.text('Pay Period:', 320, 146)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(role, 410, 110)
  doc.text('Direct Electronic Transfer', 410, 128)
  doc.text(period, 410, 146)

  // Earnings & Deductions Tables
  const earningsData = [
    ['Basic Monthly Salary', `NGN ${Number(baseSalary).toLocaleString()}`],
    ['Housing & Accommodation Allowance', `NGN ${Number(housing).toLocaleString()}`],
    ['Transport & Transit Allowance', `NGN ${Number(transport).toLocaleString()}`],
    ['Meal & Utility Subsidy', `NGN ${Number(utility).toLocaleString()}`],
    ['Sales / Field Performance Commission', `NGN ${Number(commission).toLocaleString()}`],
  ]

  const deductionsData = [
    ['PAYE Direct Assessment Income Tax', `NGN ${Number(taxPaye).toLocaleString()}`],
    ['Contributory Pension Scheme (8%)', `NGN ${Number(pension).toLocaleString()}`],
    ['National Housing Fund (NHF)', `NGN ${Number(nhf).toLocaleString()}`],
    ['Total Statutory Deductions', `NGN ${Number(totalDeductions).toLocaleString()}`],
  ]

  const applyTable = doc.autoTable || autoTable.default || autoTable

  // Left: Earnings Table
  applyTable(doc, {
    head: [['Earnings & Allowances', 'Amount']],
    body: earningsData,
    startY: 180,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: 100, halign: 'right', fontStyle: 'bold' } },
    margin: { left: 35 },
  })

  // Right: Deductions Table
  applyTable(doc, {
    head: [['Deductions & Withholdings', 'Amount']],
    body: deductionsData,
    startY: 180,
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 0: { cellWidth: 145 }, 1: { cellWidth: 95, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] } },
    margin: { left: 300 },
  })

  // Net Pay Callout Box
  const summaryY = 330
  doc.setFillColor(240, 253, 244) // emerald-50
  doc.setDrawColor(34, 197, 94) // emerald-500
  doc.roundedRect(35, summaryY, pageWidth - 70, 70, 6, 6, 'FD')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61) // emerald-700
  doc.text('TOTAL NET REMUNERATION DISBURSED', 50, summaryY + 28)

  doc.setFontSize(20)
  doc.setTextColor(22, 101, 52)
  doc.text(`NGN ${netPay.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 50, summaryY + 54)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Gross Pay: NGN ${grossPay.toLocaleString()}`, pageWidth - 50, summaryY + 28, { align: 'right' })
  doc.text(`Total Deductions: -NGN ${totalDeductions.toLocaleString()}`, pageWidth - 50, summaryY + 45, { align: 'right' })
  doc.text('Status: DISBURSED & SETTLED', pageWidth - 50, summaryY + 60, { align: 'right' })

  // Signatures & Official Seal
  const signY = 440
  doc.setDrawColor(203, 213, 225)
  doc.line(50, signY + 45, 200, signY + 45)
  doc.line(pageWidth - 200, signY + 45, pageWidth - 50, signY + 45)

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Authorized Finance Officer / Payroll Director', 50, signY + 58)
  doc.text('Employee Digital Acknowledgment Seal', pageWidth - 200, signY + 58)

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Digitally generated & certified by NexFieldForce Enterprise Payroll Intelligence Engine.', pageWidth / 2, pageHeight - 20, { align: 'center' })

  doc.save(`NexFieldForce_Payslip_${period.replace(/\s+/g, '_')}_${employeeCode}.pdf`)
}

/**
 * 5. Generate Official Employment Agreement & Non-Disclosure Agreement (NDA) PDF
 */
export const generateEmploymentAgreementPdf = (opts = {}) => {
  const {
    employeeName = 'Staff Member',
    employeeCode = 'NEX-0007',
    role = 'Corporate Staff Member',
    department = 'Operations & Administration',
    startDate = '2026-01-15',
    companyName = 'NexFieldForce Enterprise Platform Ltd',
  } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header Banner
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 75, 'F')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('EMPLOYMENT CONTRACT & MUTUAL NDA', 35, 36)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(56, 189, 248)
  doc.text(`${companyName} • Confidential Service Terms`, 35, 56)

  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Doc ID: AGR-${Date.now().toString().slice(-6)} | Signed: ${startDate}`, pageWidth - 35, 45, { align: 'right' })

  // Summary Card
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(35, 90, pageWidth - 70, 60, 6, 6, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(`Employee Name: ${employeeName}`, 45, 110)
  doc.text(`Staff ID: ${employeeCode}`, 45, 130)

  doc.text(`Position Title: ${role}`, 300, 110)
  doc.text(`Department: ${department}`, 300, 130)

  // Contract Terms Content
  const clauses = [
    {
      title: '1. Appointment & Operational Duties',
      text: `The Employer hereby appoints the Employee to serve in the capacity of ${role} within the ${department} department, commencing on ${startDate}. The Employee agrees to perform all duties diligently and comply with standard operational procedures.`,
    },
    {
      title: '2. Remuneration, Allowances & Benefits',
      text: 'The Employee is entitled to monthly salary disbursement as scheduled by the Employer, subject to applicable statutory deductions (PAYE, Pension, NHF) and verified key performance metrics.',
    },
    {
      title: '3. Non-Disclosure & Confidentiality Obligations (NDA)',
      text: 'The Employee shall not disclose, publish, or disseminate proprietary commercial information, merchant client directories, pricing matrices, technical source codes, or operational data to any third party during or following the tenure of employment.',
    },
    {
      title: '4. Intellectual Property & Work Product Assignment',
      text: 'All field logs, merchant records, telemetry data, reports, and innovations generated by the Employee during the course of employment remain the sole and exclusive intellectual property of the Employer.',
    },
    {
      title: '5. GPS Telemetry, Geofence Verification & Compliance',
      text: 'The Employee consents to active geolocation attendance tracking and route verification via the NexFieldForce enterprise application for field accountability and proof of presence.',
    },
  ]

  let curY = 175
  clauses.forEach((c) => {
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(3, 105, 161) // sky-700
    doc.text(c.title, 35, curY)

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85) // slate-700
    const lines = doc.splitTextToSize(c.text, pageWidth - 70)
    doc.text(lines, 35, curY + 15)

    curY += 22 + lines.length * 10
  })

  // Signatures Section
  const sigY = curY + 25
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(35, sigY, pageWidth - 70, 95, 6, 6, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('EXECUTED AND DIGITALLY RECORDED', 45, sigY + 20)

  doc.setDrawColor(148, 163, 184)
  doc.line(45, sigY + 65, 220, sigY + 65)
  doc.line(pageWidth - 220, sigY + 65, pageWidth - 45, sigY + 65)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Signed for and on behalf of Employer', 45, sigY + 78)
  doc.text(`Signed by Employee: ${employeeName}`, pageWidth - 220, sigY + 78)

  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Official legally binding agreement generated via NexFieldForce Human Resources OS.', pageWidth / 2, pageHeight - 20, { align: 'center' })

  doc.save(`NexFieldForce_Employment_Agreement_${employeeCode}.pdf`)
}

