import express from 'express'
import rateLimit from 'express-rate-limit'
import { authenticateToken } from '../middleware/auth.js'
import * as authCtrl from '../controllers/auth.controller.js'
import * as empCtrl from '../controllers/employee.controller.js'
import * as deptCtrl from '../controllers/department.controller.js'
import * as attCtrl from '../controllers/attendance.controller.js'
import * as leaveCtrl from '../controllers/leave.controller.js'
import * as salesCtrl from '../controllers/sales.controller.js'
import * as fieldCtrl from '../controllers/field.controller.js'
import * as monCtrl from '../controllers/monitoring.controller.js'
import * as recCtrl from '../controllers/recruitment.controller.js'
import * as onbCtrl from '../controllers/onboarding.controller.js'
import * as perfCtrl from '../controllers/performance.controller.js'
import * as workCtrl from '../controllers/workforce.controller.js'
import * as payCtrl from '../controllers/payroll.controller.js'
import * as docCtrl from '../controllers/document.controller.js'
import * as commCtrl from '../controllers/communication.controller.js'
import * as repCtrl from '../controllers/report.controller.js'
import * as aiCtrl from '../controllers/ai.controller.js'
import * as setCtrl from '../controllers/settings.controller.js'
import * as agtAdminCtrl from '../controllers/agentadmin.controller.js'
import * as compCtrl from '../controllers/company.controller.js'

// EdgeWForce Enterprise Modules
import accountingRoutes from '../src/routes/accountingRoutes.js'
import adminRoutes from '../src/routes/adminRoutes.js'
import aiEwfRoutes from '../src/routes/aiRoutes.js'
import authEwfRoutes from '../src/routes/authRoutes.js'
import customerRoutes from '../src/routes/customerRoutes.js'
import deliveryRoutes from '../src/routes/deliveryRoutes.js'
import employeeEwfRoutes from '../src/routes/employeeRoutes.js'
import executiveRoutes from '../src/routes/executiveRoutes.js'
import fieldEwfRoutes from '../src/routes/fieldRoutes.js'
import hrEwfRoutes from '../src/routes/hrRoutes.js'
import inventoryRoutes from '../src/routes/inventoryRoutes.js'
import locationRoutes from '../src/routes/locationRoutes.js'
import notificationRoutes from '../src/routes/notificationRoutes.js'
import salesEwfRoutes from '../src/routes/salesRoutes.js'
import taskRoutes from '../src/routes/taskRoutes.js'
import workforceEwfRoutes from '../src/routes/workforceRoutes.js'
import businessOpsRoutes from '../src/routes/businessOpsRoutes.js'
import commercialRoutes from '../src/routes/commercialRoutes.js'
import retailRoutes from '../src/routes/retailRoutes.js'
import warehouseRoutes from '../src/routes/warehouseRoutes.js'
import scheduleRoutes from '../src/routes/scheduleRoutes.js'
import collaborationRoutes from '../src/routes/collaborationRoutes.js'
import activityRoutes from '../src/routes/activityRoutes.js'
import workplaceAccessRoutes from '../src/routes/workplaceAccessRoutes.js'
import executiveReportRoutes from '../src/routes/executiveReportRoutes.js'
import hrDailyReportRoutes from '../src/routes/hrDailyReportRoutes.js'
import nexusRoutes from '../src/routes/nexusRoutes.js'
import subscriptionPricingRoutes from './subscription-pricing.js'
import photoAttendanceRoutes from './photo-attendance.js'
import { requireAuth } from '../src/middleware/auth.js'
import { hasRole } from '../src/middleware/rbac.js'
import { employeeService } from '../src/services/employeeService.js'

const router = express.Router()
router.use('/subscription-pricing', subscriptionPricingRoutes)
router.use('/photo-attendance', photoAttendanceRoutes)
const superAdminOnly = (req, res, next) => req.user?.isSuperAdmin || req.user?.role_code === 'SUPER_ADMIN'
  ? next() : res.status(403).json({ success: false, message: 'Super administrator access required.' })
router.use(['/companies', '/saas'], authenticateToken, superAdminOnly)

// Health Check
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    success: true,
    service: 'NexFieldForce Unified Workforce, Commerce & Field Operations Platform',
    version: '4.0.0',
    nodeEnv: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  })
})

// ==========================================
// 0. MULTI-COMPANY SAAS PLATFORM ADMINISTRATION (SUPER ADMIN)
// ==========================================
router.get('/companies', authenticateToken, compCtrl.listCompanies)
router.get('/companies/:id', authenticateToken, compCtrl.getCompanyDetails)
router.put('/companies/:id', authenticateToken, compCtrl.updateCompanyProfile)
router.patch('/companies/:id', authenticateToken, compCtrl.updateCompanyProfile)
router.post('/companies/onboard', authenticateToken, compCtrl.onboardCompany)
router.patch('/companies/:id/modules', authenticateToken, compCtrl.updateCompanyModules)
router.patch('/companies/:id/status', authenticateToken, compCtrl.updateCompanyStatus)
router.post('/companies/:id/reset-admin', authenticateToken, compCtrl.resetCompanyAdmin)
router.get('/saas/dashboard', authenticateToken, compCtrl.getSaaSDashboard)

// ==========================================
// 1. AUTHENTICATION & ACCESS
// ==========================================
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please try again later.' } })
router.post('/auth/login', authLimiter, authCtrl.login)
router.post('/auth/register', authLimiter, authCtrl.register)
router.post('/auth/request-password-reset', authCtrl.requestPasswordReset)
router.post('/auth/reset-password', authCtrl.resetPassword)
router.post('/auth/self-reset-password', authCtrl.selfResetPassword)
router.get('/auth/me', authenticateToken, authCtrl.getMe)
router.post('/auth/change-password', authenticateToken, authCtrl.changeUserPassword)

// Admin Registration Approvals
const registrationApprovers = hasRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'MANAGER')
router.get('/auth/registrations', authenticateToken, registrationApprovers, authCtrl.listRegistrationRequests)
router.post('/auth/registrations/:id/approve', authenticateToken, registrationApprovers, authCtrl.approveRegistrationRequest)
router.post('/auth/registrations/:id/reject', authenticateToken, registrationApprovers, authCtrl.rejectRegistrationRequest)

// ==========================================
// 2. AGENTADMIN DEDICATED FIELD FORCE API
// ==========================================
router.get('/agent-admin/dashboard/kpis', authenticateToken, agtAdminCtrl.getDashboardKpis)
router.get('/agent-admin/field-agents', authenticateToken, agtAdminCtrl.listFieldAgents)
router.get('/agent-admin/field-agents/:id', authenticateToken, agtAdminCtrl.getFieldAgentProfile)
router.get('/agent-admin/live-tracking', authenticateToken, agtAdminCtrl.listLiveTracking)
router.get('/agent-admin/attendance', authenticateToken, agtAdminCtrl.listAttendance)
router.get('/agent-admin/visits', authenticateToken, agtAdminCtrl.listVisits)
router.get('/agent-admin/expenses', authenticateToken, agtAdminCtrl.listExpenses)
router.post('/agent-admin/expenses', authenticateToken, agtAdminCtrl.createExpense)
router.post('/agent-admin/expenses/:id/review', authenticateToken, agtAdminCtrl.reviewExpense)
router.get('/agent-admin/red-flags', authenticateToken, agtAdminCtrl.listRedFlags)
router.post('/agent-admin/red-flags/:id/resolve', authenticateToken, agtAdminCtrl.resolveRedFlag)
router.get('/agent-admin/requests', authenticateToken, agtAdminCtrl.listRequests)
router.patch('/agent-admin/requests/:id/status', authenticateToken, agtAdminCtrl.updateRequestStatus)
router.get('/agent-admin/schedules', authenticateToken, agtAdminCtrl.listSchedules)
router.post('/agent-admin/schedules', authenticateToken, agtAdminCtrl.createSchedule)
router.get('/agent-admin/groups', authenticateToken, agtAdminCtrl.listGroups)
router.post('/agent-admin/groups', authenticateToken, agtAdminCtrl.createGroup)

// ==========================================
// 3. EMPLOYEES & ORGANIZATION
// ==========================================
router.get('/employees', authenticateToken, empCtrl.listEmployees)
router.post('/employees', authenticateToken, empCtrl.createEmployee)
router.get('/employees/org-chart', authenticateToken, empCtrl.getOrgChart)
router.get('/employees/:id', authenticateToken, empCtrl.getEmployee)
router.put('/employees/:id', authenticateToken, empCtrl.updateEmployee)
router.delete('/employees/:id', authenticateToken, empCtrl.archiveEmployee)

router.get('/departments', authenticateToken, deptCtrl.listDepartments)
router.post('/departments', authenticateToken, deptCtrl.createDepartment)
router.get('/positions', authenticateToken, deptCtrl.listPositions)
router.post('/positions', authenticateToken, deptCtrl.createPosition)
router.get('/locations', authenticateToken, deptCtrl.listLocations)

// ==========================================
// 4. TIME & ATTENDANCE
// ==========================================
router.get('/attendance', authenticateToken, attCtrl.listAttendance)
router.get('/attendance/summary', authenticateToken, attCtrl.getAttendanceSummary)
router.post('/attendance/clock-in', authenticateToken, attCtrl.clockIn)
router.post('/attendance/clock-out', authenticateToken, attCtrl.clockOut)

// ==========================================
// 5. LEAVE MANAGEMENT
// ==========================================
router.get('/leave/types', authenticateToken, leaveCtrl.listLeaveTypes)
router.get('/leave/balances', authenticateToken, leaveCtrl.getLeaveBalances)
router.get('/leave/requests', authenticateToken, leaveCtrl.listLeaveRequests)
router.post('/leave/requests', authenticateToken, leaveCtrl.createLeaveRequest)
router.post('/leave/requests/:id/review', authenticateToken, leaveCtrl.reviewLeaveRequest)
router.post('/leave/requests/:id/cancel', authenticateToken, leaveCtrl.cancelLeaveRequest)

// ==========================================
// 6. SALES FORCE MANAGEMENT
// ==========================================
router.get('/sales/overview', authenticateToken, salesCtrl.getSalesSummary)
router.get('/sales/summary', authenticateToken, salesCtrl.getSalesSummary)
router.get('/sales/markets', authenticateToken, salesCtrl.listMarkets)
router.post('/sales/markets', authenticateToken, salesCtrl.createMarket)
router.delete('/sales/markets/:id', authenticateToken, salesCtrl.deleteMarket)
router.get('/sales/products', authenticateToken, salesCtrl.listProducts)
router.post('/sales/products', authenticateToken, salesCtrl.createProduct)
router.get('/sales/customers', authenticateToken, salesCtrl.listCustomers)
router.post('/sales/customers', authenticateToken, salesCtrl.createCustomer)
router.get('/sales/orders', authenticateToken, salesCtrl.listOrders)
router.post('/sales/orders', authenticateToken, salesCtrl.createOrder)
router.get('/sales/targets', authenticateToken, salesCtrl.listSalesTargets)
router.post('/sales/targets', authenticateToken, salesCtrl.createSalesTarget)
router.get('/sales/commissions', authenticateToken, salesCtrl.listCommissions)
router.get('/sales/competitor-intel', authenticateToken, salesCtrl.listCompetitorIntel)
router.get('/sales/competitors', authenticateToken, salesCtrl.listCompetitorIntel)
router.post('/sales/competitor-intel', authenticateToken, salesCtrl.createCompetitorIntel)
router.get('/sales/leads', authenticateToken, salesCtrl.listLeads)
router.post('/sales/leads', authenticateToken, salesCtrl.createLead)
router.patch('/sales/leads/:id', authenticateToken, salesCtrl.updateLead)
router.post('/sales/payments', authenticateToken, salesCtrl.recordPayment)
router.get('/sales/my-report', authenticateToken, salesCtrl.getMySalesReport)

// ==========================================
// 7. FIELD FORCE OPERATIONS
// ==========================================
router.get('/field/dashboard', authenticateToken, fieldCtrl.getFieldDashboard)
router.get('/field/cockpit', authenticateToken, fieldCtrl.getFieldDashboard)
router.get('/field/assignments', authenticateToken, fieldCtrl.listAssignments)
router.post('/field/assignments', authenticateToken, fieldCtrl.createAssignment)
router.patch('/field/assignments/:id/status', authenticateToken, fieldCtrl.updateAssignmentStatus)
router.get('/field/visits', authenticateToken, fieldCtrl.listVisits)
router.post('/field/visits', authenticateToken, fieldCtrl.recordVisit)
router.get('/field/routes', authenticateToken, fieldCtrl.listRoutes)
router.post('/field/routes', authenticateToken, fieldCtrl.createRoute)
router.get('/field/vehicles', authenticateToken, fieldCtrl.listVehicles)
router.post('/field/vehicles', authenticateToken, fieldCtrl.createVehicle)
router.get('/field/tasks', authenticateToken, commCtrl.listTasks)
router.get('/field/agents', authenticateToken, agtAdminCtrl.listFieldAgents)

// Agent Admin Aliases
router.get('/agent-admin/dashboard', authenticateToken, agtAdminCtrl.getDashboardKpis)

// ==========================================
// 8. REAL-TIME MONITORING
// ==========================================
router.get('/monitoring/live', authenticateToken, monCtrl.getLiveMonitoringData)
router.get('/monitoring/alerts', authenticateToken, monCtrl.listAlerts)

// ==========================================
// 9. RECRUITMENT (ATS) & ONBOARDING
// ==========================================
router.get('/recruitment/jobs', authenticateToken, recCtrl.listJobs)
router.post('/recruitment/jobs', authenticateToken, recCtrl.createJob)
router.delete('/recruitment/jobs/:id', authenticateToken, recCtrl.deleteJob)
router.get('/recruitment/candidates', authenticateToken, recCtrl.listCandidates)
router.post('/recruitment/candidates', authenticateToken, recCtrl.createCandidate)
router.patch('/recruitment/applications/:id/stage', authenticateToken, recCtrl.updateApplicationStage)
router.post('/recruitment/screen-ai', authenticateToken, recCtrl.screenCandidateWithAI)

router.get('/onboarding', authenticateToken, onbCtrl.listOnboardings)
router.get('/onboarding/:id', authenticateToken, onbCtrl.getOnboardingDetails)
router.patch('/onboarding/:id/progress', authenticateToken, onbCtrl.updateOnboardingProgress)

// ==========================================
// 10. PERFORMANCE & WORKFORCE
// ==========================================
router.get('/performance/goals', authenticateToken, perfCtrl.listGoals)
router.post('/performance/goals', authenticateToken, perfCtrl.createGoal)
router.patch('/performance/goals/:id/progress', authenticateToken, perfCtrl.updateGoalProgress)
router.delete('/performance/goals/:id', authenticateToken, perfCtrl.deleteGoal)
router.get('/performance/reviews', authenticateToken, perfCtrl.listReviews)

router.get('/workforce/assignments', authenticateToken, workCtrl.listAssignments)
router.post('/workforce/assignments', authenticateToken, workCtrl.createAssignment)
router.patch('/workforce/assignments/:id/status', authenticateToken, workCtrl.updateAssignmentStatus)
router.get('/workforce/visits', authenticateToken, workCtrl.listFieldVisits)
router.get('/workforce/vehicles', authenticateToken, workCtrl.listVehicles)

// ==========================================
// 11. PAYROLL & DOCUMENTS
// ==========================================
router.get('/payroll', authenticateToken, payCtrl.listSalaryRecords)
router.get('/payroll/salaries', authenticateToken, payCtrl.listSalaryRecords)
router.get('/payroll/periods', authenticateToken, payCtrl.listPayrollPeriods)
router.post('/payroll/periods', authenticateToken, payCtrl.createPayrollPeriod)
router.get('/payroll/payslips', authenticateToken, payCtrl.listPayslips)

router.get('/documents', authenticateToken, docCtrl.listDocuments)
router.post('/documents', authenticateToken, docCtrl.createDocument)
router.get('/documents/expiring', authenticateToken, docCtrl.getExpiringDocuments)

// ==========================================
// 12. COMMUNICATION & NOTIFICATIONS
// ==========================================
router.get('/communication/announcements', authenticateToken, commCtrl.listAnnouncements)
router.post('/communication/announcements', authenticateToken, commCtrl.createAnnouncement)
router.get('/communication/notifications', authenticateToken, commCtrl.listNotifications)
router.patch('/communication/notifications/:id/read', authenticateToken, commCtrl.markNotificationRead)
router.get('/communication/tasks', authenticateToken, commCtrl.listTasks)
router.post('/communication/tasks', authenticateToken, commCtrl.createTask)
router.patch('/communication/tasks/:id/status', authenticateToken, commCtrl.updateTaskStatus)
router.post('/communication/tasks/remind', authenticateToken, commCtrl.sendTaskReminder)
router.get('/communication/tasks/due-reminders', authenticateToken, commCtrl.getDueReminders)

// ==========================================
// 13. REPORTS & EXPORTS
// ==========================================
router.get('/reports/headcount', authenticateToken, repCtrl.getHeadcountReport)
router.get('/reports/attendance', authenticateToken, repCtrl.getAttendanceReport)

// ==========================================
// 14. AI INTELLIGENCE COMMAND CENTER
// ==========================================
router.post('/ai/chat', authenticateToken, aiCtrl.chat)
router.post('/ai/execute-tool', authenticateToken, aiCtrl.executeToolAction)
router.get('/ai/automations', authenticateToken, aiCtrl.listAutomations)

// ==========================================
// 15. SETTINGS, SYSTEM & AUDIT LOGS
// ==========================================
router.get('/settings/company', authenticateToken, setCtrl.getCompanySettings)
router.get('/settings/roles', authenticateToken, setCtrl.listRoles)
router.get('/settings/audit-logs', authenticateToken, setCtrl.listAuditLogs)

router.get('/system/health', authenticateToken, (_req, res) => {
  res.json({
    success: true,
    status: 'operational',
    service: 'NexFieldForce Unified Enterprise API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})
router.get('/system/config', authenticateToken, setCtrl.getCompanySettings)
router.get('/system/audit-logs', authenticateToken, setCtrl.listAuditLogs)

// ==========================================
// 16. EDGEWFORCE COMMERCIAL OPERATING SYSTEM INTEGRATED MODULES
// ==========================================
router.use('/accounting', accountingRoutes)
router.use('/admin', adminRoutes)
router.use('/customers', customerRoutes)
router.use('/delivery', deliveryRoutes)
router.use('/employee', employeeEwfRoutes)
router.use('/executive', executiveRoutes)
router.use('/hr', hrEwfRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/locations', locationRoutes)
router.use('/work-locations', locationRoutes)
router.use('/notifications', notificationRoutes)
router.use('/push', notificationRoutes)
router.use('/tasks', taskRoutes)
router.use('/workforce', workforceEwfRoutes)
router.use('/business', businessOpsRoutes)
router.use('/commercial', commercialRoutes)
router.use('/retail', retailRoutes)
router.use('/warehouse', warehouseRoutes)
router.use('/schedules', scheduleRoutes)
router.use('/collaboration', collaborationRoutes)
router.use('/activity', activityRoutes)
router.use('/workplace-access', workplaceAccessRoutes)
router.use('/executive-reports', executiveReportRoutes)
router.use('/hr-reports', hrDailyReportRoutes)
router.use('/nexus', nexusRoutes)

// Explicit namespaced mounts for direct EWF client calls
router.use('/ewf/auth', authEwfRoutes)
router.use('/ewf/sales', salesEwfRoutes)
router.use('/ewf/field', fieldEwfRoutes)
router.use('/ewf/ai', aiEwfRoutes)

// Inactivity and Idle Telemetry
router.post('/telemetry/idle', requireAuth, async (req, res) => {
  try {
    const empId = req.user.employee?.id || req.user.id
    const alert = await employeeService.logIdleEvent(empId, req.body, req)
    res.json({ success: true, data: alert })
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } })
  }
})

export default router
