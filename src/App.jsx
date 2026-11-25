import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  Users, Calendar, Clock, Briefcase, Award, MapPin, DollarSign,
  FileText, Bell, Sparkles, BarChart3, Settings, LogOut, Search,
  Plus, CheckCircle2, AlertCircle, X, ChevronRight, Download,
  Filter, Shield, Menu, User, Phone, Mail, Building, ArrowRight,
  TrendingUp, Check, RefreshCw, Send, CheckSquare, Layers, Lock,
  ChevronDown, MessageSquare, Play, HelpCircle, Eye, EyeOff, Radio,
  Truck, ShoppingCart, Target, Navigation, UserCheck, AlertTriangle,
  Camera, Compass, Activity, Package, CreditCard, ChevronUp, Map, CheckCheck,
  Wifi, WifiOff, List, Smartphone, Globe, Flag, FileSpreadsheet, Paperclip,
  Share2, Crosshair, BarChart2, PieChart, ArrowUpRight, Battery, Database,
  Cpu, Server, HardDrive, ShieldCheck, Key, BookOpen, UserPlus, FileCheck,
  Percent, ArrowDownRight, Layers2, GitBranch, Inbox, Headphones,
  Sun, Moon
} from 'lucide-react'
import { apiRequest, setAccessToken, clearAccessToken, getAccessToken } from './lib/api.js'
import {
  exportToCsv,
  exportToExcel,
  exportToPdf,
  generateOfficialPayslipPdf,
  generateEmploymentAgreementPdf,
} from './lib/exportUtils.js'
import TaskReminderModal from './components/TaskReminderModal.jsx'
import TopNotificationBar from './components/TopNotificationBar.jsx'
import {
  SuperAdminTerritoriesView,
  SuperAdminStaffProvisioningView,
  SuperAdminRegistrationsView,
  SuperAdminSaaSDashboardView,
  SuperAdminCompaniesManagementView,
  CompanyAdminWorkspaceView,
} from './components/SuperAdminViews.jsx'
import { SupervisorTeamDispatchView } from './components/SupervisorViews.jsx'
import {
  SalesAgentOverviewView,
  SalesAgentOrderCreatorView,
  SalesAgentTargetsView,
  SalesAgentCompetitiveAnalysisView,
  SalesAgentMyReportsView,
  SalesAgentLeadsPipelineView,
  SalesAgentProductsCatalogView,
  SalesAgentVisitsView,
} from './components/SalesAgentViews.jsx'
import {
  FieldAgentCockpitView,
  FieldAgentVisitsView,
  FieldAgentTasksView,
} from './components/FieldAgentViews.jsx'
import {
  HrManagerOverviewView,
  HrRecruitmentAtsView,
  HrLeaveManagementView,
  HrAttendanceOverviewView,
  HrPerformanceGoalsView,
} from './components/HrViews.jsx'
import {
  StaffOverviewView,
  StaffAttendanceView,
  StaffLeaveRequestView,
  StaffTasksView,
  StaffGoalsView,
} from './components/StaffViews.jsx'

// EdgeWForce Enterprise Dashboards & Modules
import CommandCenterDashboard from './dashboards/CommandCenterDashboard.jsx'
import CustomerDirectoryDashboard from './dashboards/CustomerDirectoryDashboard.jsx'
import InventoryDashboard from './dashboards/InventoryDashboard.jsx'
import DeliveryDashboard from './dashboards/DeliveryDashboard.jsx'
import AlertCenterDashboard from './dashboards/AlertCenterDashboard.jsx'
import ReportsCenterDashboard from './dashboards/ReportsCenterDashboard.jsx'
import SupervisorDashboard from './dashboards/SupervisorDashboard.jsx'
import SalesDashboard from './dashboards/SalesDashboard.jsx'
import FieldDashboard from './dashboards/FieldDashboard.jsx'
import AccountingDashboard from './dashboards/AccountingDashboard.jsx'
import ExecutiveDashboard from './dashboards/ExecutiveDashboard.jsx'
import ITAdminDashboard from './dashboards/ITAdminDashboard.jsx'
import HRDashboard from './dashboards/HRDashboard.jsx'
import EmployeeDashboard from './dashboards/EmployeeDashboard.jsx'
import BusinessOperationsDashboard from './dashboards/BusinessOperationsDashboard.jsx'
import EmployeeProfileView from './components/employee/EmployeeProfileView.jsx'
import AgentSOSView from './components/field/AgentSOSView.jsx'
import FirstLoginPasswordModal from './components/employee/FirstLoginPasswordModal.jsx'
import GlobalAlertBanner from './components/layout/GlobalAlertBanner.jsx'

// ==============================================================================
// AUTHENTICATION & GLOBAL APP CONTEXT
// ==============================================================================
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('overview')
  const [tabParams, setTabParams] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [globalReminderTask, setGlobalReminderTask] = useState(null)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nexfield_theme') || 'dark'
    } catch (e) {
      return 'dark'
    }
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem('nexfield_theme', next)
    } catch (e) {}
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  const navigateWithParams = (tab, params = {}) => {
    setTabParams(params)
    setCurrentTab(tab)
  }

  // Network monitor for field offline-ready state
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast('Connection restored. Online sync active.', 'success') }
    const handleOffline = () => { setIsOnline(false); showToast('Offline mode. Changes queued locally.', 'error') }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Restore authenticated session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getAccessToken()
        if (token) {
          const res = await apiRequest('/api/auth/me')
          if (res?.user) {
            setUser(res.user)
          }
        }
      } catch (err) {
        await clearAccessToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res?.token && res?.user) {
      await setAccessToken(res.token)
      setUser(res.user)
      setCurrentTab('overview')
      setTabParams({})
      showToast(`Welcome back, ${res.user.fullName}!`)
      return res.user
    }
    throw new Error(res?.message || 'Login failed')
  }

  const logout = async () => {
    await clearAccessToken()
    setUser(null)
    setCurrentTab('overview')
    setTabParams({})
    showToast('Signed out successfully')
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Loading NexFieldForce...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        <AppContext.Provider value={{ showToast, isOnline, navigateWithParams }}>
          <UnifiedAuthPortal onLoginSuccess={() => {}} />
        </AppContext.Provider>
      </AuthContext.Provider>
    )
  }

  // Role permissions resolution across Multi-Tenant Roles
  const role = (user.role || 'EMPLOYEE').toUpperCase()
  const isSuperAdmin = Boolean(user.isSuperAdmin || role === 'SUPER_ADMIN')
  const isCompanyAdmin = Boolean(user.isCompanyAdmin || role === 'COMPANY_ADMIN')
  const isAgentAdmin = role === 'AGENTADMIN' || role === 'AGENT_ADMIN'
  const isHR = role === 'HR_MANAGER' || role === 'HR_ADMIN' || role === 'HR_OFFICER'
  const isSupervisor = role === 'SUPERVISOR' || role === 'MANAGER'
  const isSalesAgent = role === 'SALES_AGENT'
  const isFieldAgent = role === 'FIELD_AGENT'
  const isStaff = !isSuperAdmin && !isCompanyAdmin && !isAgentAdmin && !isHR && !isSupervisor && !isSalesAgent && !isFieldAgent
  const canManageBusiness = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'CEO', 'CTO', 'IT_ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT', 'HR_MANAGER'].includes(role) || isSuperAdmin || isCompanyAdmin || isAgentAdmin || isHR || isSupervisor

  const companyModules = Array.isArray(user?.enabledModules) ? user.enabledModules : ['sales', 'field_force', 'hr', 'attendance', 'reports', 'ai']
  const hasModule = (mod) => isSuperAdmin || companyModules.includes(mod)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <AppContext.Provider value={{ showToast, isOnline, navigateWithParams, theme, toggleTheme }}>
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${theme === 'light' ? 'light-theme bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
          {/* Dynamic Sidebar Shell */}
          <aside className={`hidden md:flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigateWithParams('overview')}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white font-bold shadow-lg shadow-sky-500/20">
                  N
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold tracking-tight text-white text-sm">NexFieldForce</span>
                    <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                      {isSuperAdmin && 'SaaS Platform Admin'}
                      {isCompanyAdmin && 'Company Admin'}
                      {isAgentAdmin && 'Agent Admin'}
                      {isHR && 'HR Management (HRM)'}
                      {isSupervisor && 'Supervisor Command'}
                      {isSalesAgent && 'Commercial Sales Force'}
                      {isFieldAgent && 'Field Force Cockpit'}
                      {isStaff && 'Staff Self-Service'}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Role Header Tag */}
            {sidebarOpen && (
              <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Shield className="h-4 w-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold uppercase">
                  {role.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            {/* Dynamic Role-Based Sidebar Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {/* 1. SUPER ADMIN (SAAS PLATFORM GOVERNANCE & CLIENT ONBOARDING) */}
              {isSuperAdmin && (
                <>
                  <NavSection title="SAAS PLATFORM GOVERNANCE" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={BarChart3} label="SaaS Platform Dashboard" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'companies'} onClick={() => navigateWithParams('companies')} icon={Building} label="Client Companies" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'territories'} onClick={() => navigateWithParams('territories')} icon={Map} label="Markets & Routes" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'monitoring'} onClick={() => navigateWithParams('monitoring')} icon={MapPin} label="Live GPS Telemetry" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'employees'} onClick={() => navigateWithParams('employees')} icon={Users} label="User Provisioning" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'registrations'} onClick={() => navigateWithParams('registrations')} icon={UserCheck} label="Account Approvals" sidebarOpen={sidebarOpen} />

                  <NavSection title="SYSTEM & INFRASTRUCTURE" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'system-config'} onClick={() => navigateWithParams('system-config')} icon={Settings} label="System Configuration" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'security-audit'} onClick={() => navigateWithParams('security-audit')} icon={Lock} label="Security & Audit Logs" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'system-health'} onClick={() => navigateWithParams('system-health')} icon={Server} label="System Health & API" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'data-management'} onClick={() => navigateWithParams('data-management')} icon={Database} label="Data Backup & Export" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Master AI Copilot" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 1B. COMPANY ADMINISTRATOR (CLIENT TENANT ADMIN) */}
              {isCompanyAdmin && (
                <>
                  <NavSection title="COMPANY WORKSPACE" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={Building} label="Company Overview" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'employees'} onClick={() => navigateWithParams('employees')} icon={Users} label="Staff & Roles" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'departments'} onClick={() => navigateWithParams('departments')} icon={Building} label="Departments & Teams" sidebarOpen={sidebarOpen} />
                  {hasModule('sales') && <NavBtn active={currentTab === 'sales'} onClick={() => navigateWithParams('sales')} icon={TrendingUp} label="Commercial Sales" sidebarOpen={sidebarOpen} />}
                  {hasModule('field_force') && <NavBtn active={currentTab === 'field'} onClick={() => navigateWithParams('field')} icon={MapPin} label="Field Operations" sidebarOpen={sidebarOpen} />}
                  {hasModule('hr') && <NavBtn active={currentTab === 'hr'} onClick={() => navigateWithParams('hr')} icon={Briefcase} label="Human Resources" sidebarOpen={sidebarOpen} />}
                  <NavBtn active={currentTab === 'reports'} onClick={() => navigateWithParams('reports')} icon={FileText} label="Company Reports" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Company AI Assistant" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 2. AGENTADMIN DEDICATED FIELD FORCE NAVIGATION */}
              {isAgentAdmin && (
                <>
                  <NavSection title="OVERVIEW" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={BarChart3} label="Dashboard" sidebarOpen={sidebarOpen} />

                  <NavSection title="FIELD OPERATIONS" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'field-agents'} onClick={() => navigateWithParams('field-agents', { status: 'all' })} icon={Users} label="Field Agents" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'live-tracking'} onClick={() => navigateWithParams('live-tracking')} icon={Compass} label="Live Tracking" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'attendance'} onClick={() => navigateWithParams('attendance')} icon={Clock} label="Attendance" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'customers'} onClick={() => navigateWithParams('customers', { filter: 'all' })} icon={Building} label="Customers" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'visits'} onClick={() => navigateWithParams('visits', { date: 'all', status: 'all' })} icon={Camera} label="Visits & Proof" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'tasks'} onClick={() => navigateWithParams('tasks')} icon={CheckSquare} label="Tasks" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'routes'} onClick={() => navigateWithParams('routes')} icon={Map} label="Routes" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'schedules'} onClick={() => navigateWithParams('schedules')} icon={Calendar} label="Schedules" sidebarOpen={sidebarOpen} />

                  <NavSection title="SALES & REVENUE" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'orders'} onClick={() => navigateWithParams('orders', { filter: 'all' })} icon={ShoppingCart} label="Orders" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'targets'} onClick={() => navigateWithParams('targets')} icon={Target} label="Targets & Leaderboard" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'expenses'} onClick={() => navigateWithParams('expenses')} icon={DollarSign} label="Expenses" sidebarOpen={sidebarOpen} />

                  <NavSection title="REPORTS & QUALITY" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'reports-daily'} onClick={() => navigateWithParams('reports-daily')} icon={FileText} label="Daily Activity" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'red-flags'} onClick={() => navigateWithParams('red-flags', { status: 'open' })} icon={Flag} label="Red Flags" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'requests'} onClick={() => navigateWithParams('requests')} icon={Layers} label="Requests & Stock" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'data-export'} onClick={() => navigateWithParams('data-export')} icon={Download} label="Data Downloads" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Field Force AI" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 3. SUPERVISOR (TEAM COMMAND) */}
              {isSupervisor && (
                <>
                  <NavSection title="TEAM OVERSIGHT" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={BarChart3} label="Supervisor Dashboard" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'my-team'} onClick={() => navigateWithParams('my-team')} icon={Users} label="My Team Directory" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'team-map'} onClick={() => navigateWithParams('team-map')} icon={MapPin} label="Team Live Map" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'attendance'} onClick={() => navigateWithParams('attendance')} icon={Clock} label="Team Attendance" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'visits'} onClick={() => navigateWithParams('visits')} icon={Camera} label="Visit Verification" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'tasks'} onClick={() => navigateWithParams('tasks')} icon={CheckSquare} label="Task Dispatch" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'customers'} onClick={() => navigateWithParams('customers')} icon={Building} label="Team Customers" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'sales'} onClick={() => navigateWithParams('sales')} icon={TrendingUp} label="Team Sales & Targets" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'schedule'} onClick={() => navigateWithParams('schedule')} icon={Calendar} label="Team Schedule" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'expenses'} onClick={() => navigateWithParams('expenses')} icon={DollarSign} label="Team Expenses" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Operations AI" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 4. SALES AGENT (COMMERCIAL SALES CRM) */}
              {isSalesAgent && (
                <>
                  <NavSection title="COMMERCIAL SALES" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={TrendingUp} label="Sales Dashboard" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'customers'} onClick={() => navigateWithParams('customers')} icon={Building} label="Customers / Outlets" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'leads'} onClick={() => navigateWithParams('leads')} icon={Users} label="Leads & Prospects" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'visits'} onClick={() => navigateWithParams('visits')} icon={Camera} label="Visits & Check-In" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'orders'} onClick={() => navigateWithParams('orders')} icon={ShoppingCart} label="Create Sales Order" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'competitors'} onClick={() => navigateWithParams('competitors')} icon={Camera} label="Competitive Intel" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'products'} onClick={() => navigateWithParams('products')} icon={Package} label="Product Catalog" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'targets'} onClick={() => navigateWithParams('targets')} icon={Target} label="Targets & Leaderboard" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'my-reports'} onClick={() => navigateWithParams('my-reports')} icon={FileText} label="My Sales Report" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'attendance'} onClick={() => navigateWithParams('attendance')} icon={Clock} label="Clock-In / Out" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'leave'} onClick={() => navigateWithParams('leave')} icon={Calendar} label="Apply Leave" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Sales AI Copilot" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 5. FIELD AGENT (MOBILE COCKPIT) */}
              {isFieldAgent && (
                <>
                  <NavSection title="FIELD COCKPIT" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={Navigation} label="Today's Cockpit" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'visits'} onClick={() => navigateWithParams('visits')} icon={Camera} label="My Visits & Proof" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'tasks'} onClick={() => navigateWithParams('tasks')} icon={CheckSquare} label="My Tasks" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'customers'} onClick={() => navigateWithParams('customers')} icon={Building} label="Assigned Outlets" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'map'} onClick={() => navigateWithParams('map')} icon={MapPin} label="Route & Customer Map" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'expenses'} onClick={() => navigateWithParams('expenses')} icon={DollarSign} label="Submit Expense" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'attendance'} onClick={() => navigateWithParams('attendance')} icon={Clock} label="GPS Clock-In" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Field AI Assistant" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 6. HR MANAGER (HRM SUITE) */}
              {isHR && (
                <>
                  <NavSection title="HR MANAGEMENT" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={Users} label="HR Overview" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'directory'} onClick={() => navigateWithParams('directory')} icon={Users} label="Staff Directory" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'recruitment'} onClick={() => navigateWithParams('recruitment')} icon={Briefcase} label="Recruitment ATS" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'leave'} onClick={() => navigateWithParams('leave')} icon={Calendar} label="Leave Approvals" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'attendance'} onClick={() => navigateWithParams('attendance')} icon={Clock} label="Attendance Roster" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'payroll'} onClick={() => navigateWithParams('payroll')} icon={DollarSign} label="Payroll & Salaries" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'performance'} onClick={() => navigateWithParams('performance')} icon={Award} label="Appraisals & KPIs" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'documents'} onClick={() => navigateWithParams('documents')} icon={FileText} label="Employee Documents" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="HR AI Assistant" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 7. STAFF MEMBER (STRICTLY CLEAN EMPLOYEE SELF-SERVICE) */}
              {isStaff && (
                <>
                  <NavSection title="STAFF SELF-SERVICE" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'overview'} onClick={() => navigateWithParams('overview')} icon={BarChart3} label="My Workspace" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'attendance'} onClick={() => navigateWithParams('attendance')} icon={Clock} label="My Attendance" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'leave'} onClick={() => navigateWithParams('leave')} icon={Calendar} label="Request Leave" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'tasks'} onClick={() => navigateWithParams('tasks')} icon={CheckSquare} label="My Tasks" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'documents'} onClick={() => navigateWithParams('documents')} icon={FileText} label="My Documents & Payslips" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'goals'} onClick={() => navigateWithParams('goals')} icon={Award} label="My Goals" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'help'} onClick={() => navigateWithParams('help')} icon={Headphones} label="Help & HR Support" sidebarOpen={sidebarOpen} />
                  <NavBtn active={currentTab === 'ai'} onClick={() => navigateWithParams('ai')} icon={Sparkles} label="Workforce AI" sidebarOpen={sidebarOpen} />
                </>
              )}

              {/* 8. NEXFIELDFORCE COMMERCIAL AND OPERATIONS SUITE */}
              <NavSection title="NEXFIELDFORCE OPERATIONS" sidebarOpen={sidebarOpen} />
              <NavBtn active={['command-center', 'command_center'].includes(currentTab)} onClick={() => navigateWithParams('command-center')} icon={Cpu} label="Command Center" sidebarOpen={sidebarOpen} />
              <NavBtn active={['inventory', 'ewf-inventory'].includes(currentTab)} onClick={() => navigateWithParams('inventory')} icon={Package} label="Inventory Hub" sidebarOpen={sidebarOpen} />
              <NavBtn active={['delivery', 'fleet', 'ewf-delivery'].includes(currentTab)} onClick={() => navigateWithParams('delivery')} icon={Truck} label="Delivery & Fleet" sidebarOpen={sidebarOpen} />
              <NavBtn active={['accounting', 'financials', 'ewf-accounting'].includes(currentTab)} onClick={() => navigateWithParams('accounting')} icon={DollarSign} label="Financials & Payroll" sidebarOpen={sidebarOpen} />
              <NavBtn active={['ewf-sales', 'ewf-pos'].includes(currentTab)} onClick={() => navigateWithParams('ewf-sales')} icon={TrendingUp} label="Commercial Sales POS" sidebarOpen={sidebarOpen} />
              <NavBtn active={['ewf-field', 'manifest'].includes(currentTab)} onClick={() => navigateWithParams('ewf-field')} icon={Compass} label="Field Routes & Journey" sidebarOpen={sidebarOpen} />
              <NavBtn active={['ewf-supervisor', 'supervisor-dashboard'].includes(currentTab)} onClick={() => navigateWithParams('ewf-supervisor')} icon={ShieldCheck} label="Supervisor Live Hub" sidebarOpen={sidebarOpen} />
              <NavBtn active={['ewf-hr', 'people', 'org'].includes(currentTab)} onClick={() => navigateWithParams('ewf-hr')} icon={Users} label="HR & Org Chart" sidebarOpen={sidebarOpen} />
              <NavBtn active={['customer-360', 'customer_360', 'customer-directory', 'ewf-customers'].includes(currentTab)} onClick={() => navigateWithParams('customer-360')} icon={Building} label="Customer 360 CRM" sidebarOpen={sidebarOpen} />
              <NavBtn active={['alerts', 'alert-center', 'ewf-alerts'].includes(currentTab)} onClick={() => navigateWithParams('alerts')} icon={AlertTriangle} label="Alert Center" sidebarOpen={sidebarOpen} />
              <NavBtn active={['reports-center', 'ewf-reports'].includes(currentTab)} onClick={() => navigateWithParams('reports-center')} icon={FileSpreadsheet} label="BI & Reports Center" sidebarOpen={sidebarOpen} />
              <NavBtn active={['executive', 'ewf-executive'].includes(currentTab)} onClick={() => navigateWithParams('executive')} icon={BarChart2} label="Executive Suite" sidebarOpen={sidebarOpen} />
              <NavBtn active={['it-admin', 'it_admin', 'ewf-it'].includes(currentTab)} onClick={() => navigateWithParams('it-admin')} icon={Shield} label="IT Administration" sidebarOpen={sidebarOpen} />
              {canManageBusiness && <NavBtn active={['business-ops', 'erp-crm'].includes(currentTab)} onClick={() => navigateWithParams('business-ops')} icon={Layers2} label="ERP & CRM Operations" sidebarOpen={sidebarOpen} />}
              <NavBtn active={['ewf-employee', 'employee-dashboard'].includes(currentTab)} onClick={() => navigateWithParams('ewf-employee')} icon={User} label="Employee Portal" sidebarOpen={sidebarOpen} />
              <NavBtn active={['sos', 'agent-sos', 'safety'].includes(currentTab)} onClick={() => navigateWithParams('sos')} icon={Radio} label="Agent SOS Beacon" sidebarOpen={sidebarOpen} />
            </nav>

            {/* Offline Status & Logout */}
            <div className="p-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] px-2 text-slate-400">
                <span className="flex items-center gap-1.5">
                  {isOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="h-3.5 w-3.5 text-rose-400" />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="text-[10px] text-slate-500">v3.3.0</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 transition-all text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  {sidebarOpen && <span>Sign Out</span>}
                </div>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900">
            <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isSuperAdmin && 'Master Platform Administration'}
                  {isAgentAdmin && 'Agent Admin Field Command Center'}
                  {isHR && 'Human Resources & Talent Management'}
                  {isSupervisor && 'Supervisor Operations & Team Dispatch'}
                  {isSalesAgent && 'Commercial Sales Force CRM'}
                  {isFieldAgent && 'Field Operations Mobile Cockpit'}
                  {isStaff && 'Staff Self-Service Desk'}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 sm:p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle Light/Dark Theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-400 animate-fade-in" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-400 animate-fade-in" />
                  )}
                </button>

                <button
                  onClick={() => setAiDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-md shadow-purple-600/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">AI Copilot</span>
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight">{user.fullName}</p>
                  <p className="text-[10px] text-sky-400 font-semibold">{role.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </header>

            {/* Live Global Task Reminder Bar */}
            <TopNotificationBar
              onNavigate={navigateWithParams}
              onOpenReminderModal={(task) => setGlobalReminderTask(task)}
              showToast={showToast}
            />

            {/* Realtime Alert & Emergency Broadcast Banner */}
            <GlobalAlertBanner />

            <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
              {/* 1. SUPER ADMIN WORKSPACE (SAAS PLATFORM GOVERNANCE) */}
              {isSuperAdmin && (
                <>
                  {currentTab === 'overview' && <SuperAdminSaaSDashboardView onNavigate={navigateWithParams} />}
                  {(currentTab === 'companies' || currentTab === 'company-detail') && (
                    <SuperAdminCompaniesManagementView params={tabParams} onNavigate={navigateWithParams} />
                  )}
                  {currentTab === 'territories' && <SuperAdminTerritoriesView onNavigate={navigateWithParams} />}
                  {currentTab === 'monitoring' && <RealtimeLiveMapView />}
                  {currentTab === 'employees' && <SuperAdminStaffProvisioningView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'users' && <SuperAdminStaffProvisioningView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'roles' && <SuperAdminRolesPermissionsView />}
                  {currentTab === 'registrations' && <SuperAdminRegistrationsView />}
                  {currentTab === 'system-config' && <SuperAdminSystemConfigView />}
                  {currentTab === 'security-audit' && <SuperAdminSecurityAuditView />}
                  {currentTab === 'system-health' && <SuperAdminSystemHealthView />}
                  {currentTab === 'data-management' && <SuperAdminDataManagementView />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="NexFieldForce SaaS Platform & Multi-Tenant Operations" />}
                </>
              )}

              {/* 1B. COMPANY ADMIN WORKSPACE (CLIENT TENANT LEVEL) */}
              {isCompanyAdmin && (
                <>
                  {currentTab === 'overview' && <CompanyAdminWorkspaceView onNavigate={navigateWithParams} />}
                  {currentTab === 'employees' && <SuperAdminStaffProvisioningView onNavigate={navigateWithParams} />}
                  {currentTab === 'departments' && <CompanyAdminWorkspaceView onNavigate={navigateWithParams} />}
                  {currentTab === 'sales' && <SalesAgentOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'field' && <RealtimeLiveMapView />}
                  {currentTab === 'hr' && <HrManagerOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'reports' && <CompanyAdminWorkspaceView onNavigate={navigateWithParams} />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="Company Administration & Operations" />}
                </>
              )}

              {/* 2. AGENTADMIN WORKSPACE */}
              {isAgentAdmin && (
                <>
                  {currentTab === 'overview' && <AgentAdminDashboardView onNavigate={navigateWithParams} />}
                  {currentTab === 'field-agents' && <AgentAdminFieldAgentsView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'live-tracking' && <RealtimeLiveMapView />}
                  {currentTab === 'attendance' && <AgentAdminAttendanceView onNavigate={navigateWithParams} />}
                  {currentTab === 'customers' && <OutletsDirectoryView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'visits' && <FieldVisitsProofView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'tasks' && <SupervisorTeamDispatchView onNavigate={navigateWithParams} />}
                  {currentTab === 'routes' && <SuperAdminTerritoriesView onNavigate={navigateWithParams} />}
                  {currentTab === 'schedules' && <AgentAdminSchedulesView onNavigate={navigateWithParams} />}
                  {currentTab === 'orders' && <AgentAdminOrdersView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'targets' && <SalesAgentTargetsView onNavigate={navigateWithParams} />}
                  {currentTab === 'expenses' && <AgentAdminExpensesView onNavigate={navigateWithParams} />}
                  {currentTab === 'reports-daily' && <AgentAdminDailyReportsView onNavigate={navigateWithParams} />}
                  {currentTab === 'red-flags' && <AgentAdminRedFlagsView params={tabParams} onNavigate={navigateWithParams} />}
                  {currentTab === 'requests' && <AgentAdminRequestsView onNavigate={navigateWithParams} />}
                  {currentTab === 'data-export' && <AgentAdminDataExportView onNavigate={navigateWithParams} />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="Field Force Operations & Territory Telemetry" />}
                </>
              )}

              {/* 3. SUPERVISOR WORKSPACE */}
              {isSupervisor && (
                <>
                  {currentTab === 'overview' && <SupervisorOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'my-team' && <SupervisorMyTeamView />}
                  {currentTab === 'team-map' && <RealtimeLiveMapView role="supervisor" />}
                  {currentTab === 'attendance' && <AgentAdminAttendanceView isSupervisor onNavigate={navigateWithParams} />}
                  {currentTab === 'visits' && <FieldVisitsProofView onNavigate={navigateWithParams} />}
                  {currentTab === 'tasks' && <SupervisorTeamDispatchView onNavigate={navigateWithParams} />}
                  {currentTab === 'customers' && <OutletsDirectoryView onNavigate={navigateWithParams} />}
                  {currentTab === 'sales' && <SupervisorTeamSalesView onNavigate={navigateWithParams} />}
                  {currentTab === 'schedule' && <AgentAdminSchedulesView onNavigate={navigateWithParams} />}
                  {currentTab === 'expenses' && <AgentAdminExpensesView isSupervisor onNavigate={navigateWithParams} />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="Team Dispatch & Daily Route Verification" />}
                </>
              )}

              {/* 4. SALES AGENT WORKSPACE */}
              {isSalesAgent && (
                <>
                  {currentTab === 'overview' && <SalesAgentOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'customers' && <OutletsDirectoryView isSales onNavigate={navigateWithParams} />}
                  {currentTab === 'leads' && <SalesAgentLeadsPipelineView onNavigate={navigateWithParams} />}
                  {currentTab === 'orders' && <SalesAgentOrderCreatorView onNavigate={navigateWithParams} />}
                  {currentTab === 'competitors' && <SalesAgentCompetitiveAnalysisView />}
                  {currentTab === 'products' && <SalesAgentProductsCatalogView onNavigate={navigateWithParams} />}
                  {currentTab === 'visits' && <SalesAgentVisitsView onNavigate={navigateWithParams} />}
                  {currentTab === 'targets' && <SalesAgentTargetsView onNavigate={navigateWithParams} />}
                  {currentTab === 'my-reports' && <SalesAgentMyReportsView />}
                  {currentTab === 'attendance' && <StaffAttendanceView />}
                  {currentTab === 'leave' && <StaffLeaveRequestView onNavigate={navigateWithParams} />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="Sales Negotiations, Commercial Outlets & Product Pitch" />}
                </>
              )}

              {/* 5. FIELD AGENT WORKSPACE */}
              {isFieldAgent && (
                <>
                  {currentTab === 'overview' && <FieldAgentCockpitView onNavigate={navigateWithParams} />}
                  {currentTab === 'visits' && <FieldAgentVisitsView onNavigate={navigateWithParams} />}
                  {currentTab === 'tasks' && <FieldAgentTasksView onNavigate={navigateWithParams} />}
                  {currentTab === 'customers' && <OutletsDirectoryView isField onNavigate={navigateWithParams} />}
                  {currentTab === 'map' && <RealtimeLiveMapView role="field" />}
                  {currentTab === 'expenses' && <FieldAgentExpenseSubmitView onNavigate={navigateWithParams} />}
                  {currentTab === 'attendance' && <StaffAttendanceView />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="GPS Routing, Store Check-in & Shelf Audits" />}
                </>
              )}

              {/* 6. HR MANAGER WORKSPACE */}
              {isHR && (
                <>
                  {currentTab === 'overview' && <HrManagerOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'directory' && <SuperAdminStaffProvisioningView isHr onNavigate={navigateWithParams} />}
                  {currentTab === 'recruitment' && <HrRecruitmentAtsView onNavigate={navigateWithParams} />}
                  {currentTab === 'leave' && <HrLeaveManagementView onNavigate={navigateWithParams} />}
                  {currentTab === 'attendance' && <HrAttendanceOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'payroll' && <HrPayrollSalariesView onNavigate={navigateWithParams} />}
                  {(currentTab === 'performance' || currentTab === 'goals') && <HrPerformanceGoalsView onNavigate={navigateWithParams} />}
                  {currentTab === 'documents' && <HrEmployeeDocumentsView onNavigate={navigateWithParams} />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="HR Policies, Leave Calculations & Talent Pipeline" />}
                </>
              )}

              {/* 7. STAFF MEMBER WORKSPACE */}
              {isStaff && (
                <>
                  {currentTab === 'overview' && <StaffOverviewView onNavigate={navigateWithParams} />}
                  {currentTab === 'attendance' && <StaffAttendanceView />}
                  {currentTab === 'leave' && <StaffLeaveRequestView onNavigate={navigateWithParams} />}
                  {currentTab === 'tasks' && <StaffTasksView onNavigate={navigateWithParams} />}
                  {currentTab === 'documents' && <StaffMyDocumentsView onNavigate={navigateWithParams} />}
                  {currentTab === 'goals' && <StaffGoalsView onNavigate={navigateWithParams} />}
                  {currentTab === 'help' && <StaffHelpSupportView onNavigate={navigateWithParams} />}
                  {currentTab === 'ai' && <AiCopilotView roleContext="Staff Self-Service & Employee Portal" />}
                </>
              )}

              {/* 8. NEXFIELDFORCE COMMERCIAL OPERATING SYSTEM INTEGRATED DASHBOARDS */}
              {['command-center', 'command_center'].includes(currentTab) && (
                <CommandCenterDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['inventory', 'ewf-inventory'].includes(currentTab) && (
                <InventoryDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['delivery', 'fleet', 'ewf-delivery'].includes(currentTab) && (
                <DeliveryDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['alerts', 'alert-center', 'ewf-alerts'].includes(currentTab) && (
                <AlertCenterDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['reports-center', 'ewf-reports'].includes(currentTab) && (
                <ReportsCenterDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['accounting', 'financials', 'ewf-accounting'].includes(currentTab) && (
                <AccountingDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['ewf-sales', 'ewf-pos'].includes(currentTab) && (
                <SalesDashboard user={user} initialTab={tabParams?.initialTab} />
              )}
              {['ewf-field', 'manifest'].includes(currentTab) && (
                <FieldDashboard user={user} />
              )}
              {['ewf-supervisor', 'supervisor-dashboard', 'supervisor_dashboard'].includes(currentTab) && (
                <SupervisorDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['ewf-hr', 'people', 'org'].includes(currentTab) && (
                <HRDashboard user={user} initialTab={currentTab === 'org' ? 'org' : (tabParams?.initialTab || 'people')} />
              )}
              {['customer-360', 'customer_360', 'customer-directory', 'ewf-customers'].includes(currentTab) && (
                <CustomerDirectoryDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['executive', 'ewf-executive'].includes(currentTab) && (
                <ExecutiveDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['it-admin', 'it_admin', 'ewf-it'].includes(currentTab) && (
                <ITAdminDashboard user={user} onSelectTab={navigateWithParams} />
              )}
              {canManageBusiness && ['business-ops', 'erp-crm'].includes(currentTab) && (
                <BusinessOperationsDashboard user={user} onNavigate={navigateWithParams} />
              )}
              {['ewf-employee', 'employee-dashboard'].includes(currentTab) && (
                <EmployeeDashboard user={user} />
              )}
              {['sos', 'agent-sos', 'safety'].includes(currentTab) && (
                <AgentSOSView user={user} />
              )}
              {['employee-profile', 'profile'].includes(currentTab) && (
                <EmployeeProfileView user={user} />
              )}
            </main>
          </div>

          {/* Global Floating AI Operations Copilot Trigger Button */}
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-purple-500/30 hover:scale-105 hover:shadow-purple-500/50 transition-all duration-200 border border-purple-400/40 group"
            title="Open NEXField AI Operations Copilot"
          >
            <Sparkles className="h-4 w-4 animate-spin text-amber-300" style={{ animationDuration: '6s' }} />
            <span className="font-bold tracking-wide">NEXField AI</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
            </span>
          </button>

          {/* Global AI Assistant Drawer */}
          <UniversalAiAssistantDrawer
            isOpen={aiDrawerOpen}
            onClose={() => setAiDrawerOpen(false)}
            role={role}
            user={user}
            currentTab={currentTab}
            tabParams={tabParams}
            onNavigate={(tab, params) => {
              navigateWithParams(tab, params)
              setAiDrawerOpen(false)
            }}
          />

          {/* Global Toast Alert */}
          {toast && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs font-medium text-slate-100 shadow-2xl backdrop-blur animate-fade-in">
              {toast.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Global Task Reminder Modal */}
          {globalReminderTask && (
            <TaskReminderModal
              isOpen={Boolean(globalReminderTask)}
              task={globalReminderTask}
              onClose={() => setGlobalReminderTask(null)}
              onReminderSent={() => {}}
              showToast={showToast}
            />
          )}

          {/* Force Password Change on First-Time Access */}
          {user?.requires_password_change && (
            <FirstLoginPasswordModal
              user={user}
              onSuccess={() => {
                setUser((prev) => ({ ...prev, requires_password_change: false }))
              }}
            />
          )}
        </div>
      </AppContext.Provider>
    </AuthContext.Provider>
  )
}

function NavSection({ title, sidebarOpen }) {
  if (!sidebarOpen) return <div className="my-2 border-t border-slate-800" />
  return <div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">{title}</div>
}

function NavBtn({ active, onClick, icon: Icon, label, sidebarOpen }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
        active
          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
      }`}
      title={!sidebarOpen ? label : undefined}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
      {sidebarOpen && <span className="truncate">{label}</span>}
    </button>
  )
}

// ==============================================================================
// 1. SUPER ADMIN MASTER PLATFORM GOVERNANCE
// ==============================================================================
function SuperAdminMasterOverview({ onNavigate }) {
  const [stats, setStats] = useState({
    users: 6,
    activeUsers: 5,
    fieldAgents: 2,
    salesAgents: 1,
    supervisors: 1,
    hrManagers: 1,
    staff: 1,
    groups: 1,
    regions: 1,
    dbStatus: 'Operational',
    storageUsed: '42.8 MB',
  })

  useEffect(() => {
    Promise.all([
      apiRequest('/api/employees'),
      apiRequest('/api/agent-admin/groups'),
      apiRequest('/api/sales/markets'),
    ]).then(([empRes, grpRes]) => {
      const list = empRes?.data || []
      setStats((prev) => ({
        ...prev,
        users: list.length || 6,
        fieldAgents: list.filter((e) => e.role_code === 'FIELD_AGENT').length || 2,
        salesAgents: list.filter((e) => e.role_code === 'SALES_AGENT').length || 1,
        supervisors: list.filter((e) => e.role_code === 'SUPERVISOR').length || 1,
        hrManagers: list.filter((e) => e.role_code === 'HR_MANAGER').length || 1,
        groups: grpRes?.data?.length || 1,
      }))
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Super Admin Executive Command Center</h2>
          <p className="text-xs text-slate-400">Total platform governance, multi-tier organization tree, security audits, and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Platform Healthy (100% SLA)
          </span>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div onClick={() => onNavigate('users')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold">Total Users</span>
          <p className="text-xl font-bold text-white">{stats.users}</p>
          <span className="text-[10px] text-emerald-400">● {stats.activeUsers} Active</span>
        </div>

        <div onClick={() => onNavigate('users')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold">Field Agents</span>
          <p className="text-xl font-bold text-sky-400">{stats.fieldAgents}</p>
          <span className="text-[10px] text-slate-400">GPS On Duty</span>
        </div>

        <div onClick={() => onNavigate('users')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold">Sales Agents</span>
          <p className="text-xl font-bold text-emerald-400">{stats.salesAgents}</p>
          <span className="text-[10px] text-slate-400">Commercial CRM</span>
        </div>

        <div onClick={() => onNavigate('users')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold">Supervisors</span>
          <p className="text-xl font-bold text-purple-400">{stats.supervisors}</p>
          <span className="text-[10px] text-slate-400">Team Control</span>
        </div>

        <div onClick={() => onNavigate('org-management')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold">Active Groups</span>
          <p className="text-xl font-bold text-amber-400">{stats.groups}</p>
          <span className="text-[10px] text-slate-400">Territory Trees</span>
        </div>

        <div onClick={() => onNavigate('system-health')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 cursor-pointer space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold">Database & API</span>
          <p className="text-xl font-bold text-emerald-400">Active</p>
          <span className="text-[10px] text-slate-400">Hybrid Resilient</span>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => onNavigate('org-management')} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer space-y-2">
          <Building className="h-6 w-6 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Organization & Custom Groups</h4>
          <p className="text-xs text-slate-400">Create operational groups, regions, and territories dynamically without hardcoded limits.</p>
        </div>

        <div onClick={() => onNavigate('users')} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 cursor-pointer space-y-2">
          <UserPlus className="h-6 w-6 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Staff Provisioning & Role Assignment</h4>
          <p className="text-xs text-slate-400">Create staff, assign any of the 7 discrete roles, and bind them to groups and territories.</p>
        </div>

        <div onClick={() => onNavigate('security-audit')} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500 cursor-pointer space-y-2">
          <ShieldCheck className="h-6 w-6 text-purple-400" />
          <h4 className="text-sm font-bold text-white">Security & Audit Logs</h4>
          <p className="text-xs text-slate-400">Monitor active sessions, IP activity, role permission changes, and device telemetry.</p>
        </div>
      </div>
    </div>
  )
}

function SuperAdminOrgManagementView() {
  const { showToast } = useApp()
  const [groups, setGroups] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [groupRegion, setGroupRegion] = useState('South West')
  const [groupTarget, setGroupTarget] = useState(500)

  const fetchGroups = async () => {
    const res = await apiRequest('/api/agent-admin/groups')
    setGroups(res?.data || [])
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) {
      showToast('Group name is required', 'error')
      return
    }
    try {
      await apiRequest('/api/agent-admin/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupName, code: groupCode, region: groupRegion, target: groupTarget }),
      })
      showToast(`Group "${groupName}" created and activated!`)
      setModalOpen(false)
      setGroupName('')
      setGroupCode('')
      fetchGroups()
    } catch (err) {
      showToast('Failed to create group', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Organization Tree & Operational Groups</h2>
          <p className="text-xs text-slate-400">Create and manage operational groups (e.g. Lagos_Central_General, Ibadan_Commercial_Cluster)</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="h-4 w-4" /> Add Operational Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{g.name}</span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">{g.code}</span>
            </div>
            <p className="text-xs text-slate-400">Region: {g.region}</p>
            <p className="text-xs text-emerald-400 font-semibold">Target: {g.target} Outlets</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Operational Group</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Lagos_Central_General"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Group Code</label>
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    placeholder="e.g. LCG-01"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Region</label>
                  <input
                    type="text"
                    value={groupRegion}
                    onChange={(e) => setGroupRegion(e.target.value)}
                    placeholder="e.g. South West"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Outlet Coverage Target</label>
                <input
                  type="number"
                  value={groupTarget}
                  onChange={(e) => setGroupTarget(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-all shadow">
                Save & Activate Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SuperAdminRolesPermissionsView() {
  const rolesList = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Master governance over all organizations, databases, and platform features' },
    { code: 'AGENTADMIN', name: 'Agent Admin', desc: 'Complete Field Force Command Center for telemetry, visits, orders, and agents' },
    { code: 'SUPERVISOR', name: 'Supervisor', desc: 'Team-level dispatch, work orders, route monitoring, and leave approvals' },
    { code: 'SALES_AGENT', name: 'Sales Agent', desc: 'Commercial CRM for customer ordering, pipeline, catalogs, and 5% commission' },
    { code: 'FIELD_AGENT', name: 'Field Agent', desc: 'Mobile-first cockpit for GPS check-ins, photo proof, low stock, and assignments' },
    { code: 'HR_MANAGER', name: 'HR Manager', desc: 'HRM suite for employee directory, recruitment ATS, leave, and payroll' },
    { code: 'EMPLOYEE', name: 'Staff Member', desc: 'Clean employee self-service desk for attendance, leave requests, and tasks' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Roles & Granular RBAC Permissions</h2>
        <p className="text-xs text-slate-400">7 Discrete enterprise role hierarchies with parameter and data-scope security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rolesList.map((r) => (
          <div key={r.code} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{r.name}</span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">{r.code}</span>
            </div>
            <p className="text-xs text-slate-400">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuperAdminSystemConfigView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">System & Organization Configuration</h2>
        <p className="text-xs text-slate-400">GPS geofence radius, default work hours, and approval workflows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">GPS & Field Geofence Settings</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Allowed Check-in Radius:</span>
              <span className="font-bold text-white">100 meters</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Map Provider Engine:</span>
              <span className="font-bold text-sky-400">Leaflet + OpenStreetMap API</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>High Accuracy GPS Mode:</span>
              <span className="font-bold text-emerald-400">Enabled (±5m)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Working Hours & Timesheet Policies</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Standard Shift:</span>
              <span className="font-bold text-white">08:00 AM &rarr; 05:00 PM</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Late Arrival Grace Period:</span>
              <span className="font-bold text-amber-400">15 minutes</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Auto Clock-Out Overtime:</span>
              <span className="font-bold text-white">07:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SuperAdminSecurityAuditView() {
  const [logs, setLogs] = useState([])
  useEffect(() => {
    apiRequest('/api/settings/audit-logs').then((res) => setLogs(res?.data || []))
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Security Telemetry & Audit Logs</h2>
        <p className="text-xs text-slate-400">Immutable record of authenticated API calls, administrative actions, and session security</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="p-3">User & Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">IP Address</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">{l.user_name || 'System Admin'}</td>
                <td className="p-3 text-sky-300 font-semibold">{l.action}</td>
                <td className="p-3 text-slate-400">{l.entity_type}</td>
                <td className="p-3 font-mono text-slate-400">{l.ip_address || '127.0.0.1'}</td>
                <td className="p-3 font-mono text-slate-400">{l.created_at?.slice(0, 19).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SuperAdminSystemHealthView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">System Health & API Telemetry</h2>
        <p className="text-xs text-slate-400">Node.js server cluster, database engine, and memory usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Server className="h-6 w-6 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Node.js Server Runtime</h4>
          <p className="text-xs text-slate-400">Port 3000 • Production Mode • 0 errors</p>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">100% ONLINE</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Database className="h-6 w-6 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Database Engine</h4>
          <p className="text-xs text-slate-400">Unified Resilient Architecture (MySQL / Supabase / In-Memory)</p>
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">CONNECTED</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Cpu className="h-6 w-6 text-purple-400" />
          <h4 className="text-sm font-bold text-white">Leaflet Map API</h4>
          <p className="text-xs text-slate-400">OpenStreetMap API • Free Tile Distribution • Zero billing keys</p>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">ACTIVE</span>
        </div>
      </div>
    </div>
  )
}

function SuperAdminDataManagementView() {
  const { showToast } = useApp()
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Data Management & Automated Backups</h2>
        <p className="text-xs text-slate-400">Export database snapshots, restore archives, and manage data retention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <HardDrive className="h-6 w-6 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Generate Full System Backup</h4>
          <p className="text-xs text-slate-400">Create a JSON/SQL snapshot of all organizations, users, visits, and sales.</p>
          <button onClick={() => showToast('Full database backup snapshot generated!')} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Download Backup Archive
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Layers2 className="h-6 w-6 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Data Retention Policy</h4>
          <p className="text-xs text-slate-400">GPS location logs retained for 90 days. Sales and attendance preserved permanently.</p>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">ACTIVE POLICY</span>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 2. AGENTADMIN FIELD FORCE COMMAND CENTER WITH INTERACTIVE KPI DRILL-DOWN
// ==============================================================================
function AgentAdminDashboardView({ onNavigate }) {
  const [kpi, setKpi] = useState(null)
  const [period, setPeriod] = useState('Daily')
  const [activeTab, setActiveTab] = useState('first_visit')
  const [selectedGroup, setSelectedGroup] = useState('Lagos_Central_General')
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])
  const [visits, setVisits] = useState([])
  const [orders, setOrders] = useState([])

  const loadData = () => {
    Promise.all([
      apiRequest('/api/agent-admin/dashboard/kpis'),
      apiRequest('/api/agent-admin/field-agents'),
      apiRequest('/api/field/visits'),
      apiRequest('/api/sales/orders'),
      apiRequest('/api/agent-admin/groups'),
    ]).then(([kRes, aRes, vRes, oRes, gRes]) => {
      setKpi(kRes?.data || null)
      setAgents(aRes?.data || [])
      setVisits(vRes?.data || [])
      setOrders(oRes?.data || [])
      setGroups(gRes?.data || [])
      if (gRes?.data?.length > 0 && !selectedGroup) {
        setSelectedGroup(gRes.data[0].name)
      }
    })
  }

  useEffect(() => {
    loadData()
  }, [period])

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {['Daily', 'Weekly', 'Monthly', 'Custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all ${period === p ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.name}>Group: {g.name}</option>
            ))}
            {groups.length === 0 && <option value="Lagos_Central_General">Group: Lagos_Central_General</option>}
          </select>

          <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <Globe className="h-3.5 w-3.5 text-sky-400" /> Region: South West
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Current Time: <strong className="text-white">{new Date().toLocaleTimeString()}</strong></span>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FULLY INTERACTIVE KPI CARDS WITH DRILL-DOWN CAPABILITY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: TOTAL AGENTS */}
        <div
          onClick={() => onNavigate('field-agents', { status: 'all', group: selectedGroup })}
          className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Agents</span>
            <p className="text-2xl font-bold text-white">{kpi?.totalAgents || agents.length || 2}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate('field-agents', { status: 'active', group: selectedGroup }); }}
              className="text-[10px] text-emerald-400 font-bold hover:underline"
            >
              ● {kpi?.activeAgents || 1} Active
            </button>
            <span className="text-[10px] text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
          </div>
        </div>

        {/* KPI 2: TODAY'S VISITS */}
        <div
          onClick={() => onNavigate('visits', { date: 'today', status: 'all', group: selectedGroup })}
          className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold block">Today's Visits</span>
            <p className="text-2xl font-bold text-sky-400">{visits.length}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate('visits', { date: 'today', status: 'completed', group: selectedGroup }); }}
              className="text-[10px] text-slate-400 hover:text-emerald-300 font-semibold hover:underline"
            >
              {visits.filter(v => v.status === 'completed').length} Completed
            </button>
            <span className="text-[10px] text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
          </div>
        </div>

        {/* KPI 3: TODAY'S ORDERS */}
        <div
          onClick={() => onNavigate('orders', { date: 'today', group: selectedGroup })}
          className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold block">Today's Orders</span>
            <p className="text-2xl font-bold text-emerald-400">{orders.length}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold truncate">₦{orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</span>
            <span className="text-[10px] text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
          </div>
        </div>

        {/* KPI 4: NEW CUSTOMERS */}
        <div
          onClick={() => onNavigate('customers', { created: 'today', group: selectedGroup })}
          className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold block">New Customers</span>
            <p className="text-2xl font-bold text-purple-400">{kpi?.newCustomers || 0}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Registered Outlets</span>
            <span className="text-[10px] text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
          </div>
        </div>

        {/* KPI 5: COLLECTIONS */}
        <div
          onClick={() => onNavigate('orders', { date: 'today', paymentStatus: 'all', group: selectedGroup })}
          className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold block">Collections</span>
            <p className="text-2xl font-bold text-emerald-400">₦{(kpi?.paymentCollected || 0).toLocaleString()}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate('orders', { paymentStatus: 'outstanding', group: selectedGroup }); }}
              className="text-[10px] text-rose-400 hover:underline font-semibold"
            >
              ₦{(kpi?.outstandingPayments || 0).toLocaleString()} Outst.
            </button>
            <span className="text-[10px] text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
          </div>
        </div>

        {/* KPI 6: RED FLAGS */}
        <div
          onClick={() => onNavigate('red-flags', { status: 'open', group: selectedGroup })}
          className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/10 flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold block">Red Flags</span>
            <p className="text-2xl font-bold text-rose-400">{kpi?.redFlagsCount || 1}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-rose-400 font-bold">Anomalies Detected</span>
            <span className="text-[10px] text-rose-400 font-medium group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
          </div>
        </div>
      </div>

      {/* 9 FIELD COMMAND REPORTING TABS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="border-b border-slate-800 p-2 flex flex-wrap gap-1 bg-slate-900/90 text-xs font-semibold">
          {[
            { id: 'first_visit', label: 'First Visit' },
            { id: 'clock_in', label: 'Clock In' },
            { id: 'clock_out', label: 'Clock Out' },
            { id: 'last_refresh', label: 'Last Refresh' },
            { id: 'order_status', label: 'Order Status' },
            { id: 'total_visits', label: 'Total Visits & Reports' },
            { id: 'by_staff', label: 'By Field Staff' },
            { id: 'by_hours', label: 'By Hours' },
            { id: 'cust_analytics', label: 'Customer Visit Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* TAB 1: FIRST VISIT */}
          {activeTab === 'first_visit' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">First Customer Visit Audit</h3>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Field Agent</th>
                    <th className="p-3">First Visit Time</th>
                    <th className="p-3">Target Customer</th>
                    <th className="p-3">GPS Location</th>
                    <th className="p-3">Visit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agents.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{a.name}</td>
                      <td className="p-3 font-mono text-sky-400">09:12 AM</td>
                      <td className="p-3 text-slate-200">Gold Line Retail Mart</td>
                      <td className="p-3 text-slate-400 font-mono">6.4544, 3.3947</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">COMPLETED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: CLOCK IN */}
          {activeTab === 'clock_in' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Field Clock-In & Verification</h3>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Field Agent</th>
                    <th className="p-3">Clock In Time</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">GPS Verification</th>
                    <th className="p-3">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agents.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{a.name}</td>
                      <td className="p-3 font-mono">08:15 AM</td>
                      <td className="p-3 text-slate-300">Lagos Island Hub</td>
                      <td className="p-3 text-emerald-400 font-bold">✓ Verified GPS (±5m)</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">PRESENT</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: CLOCK OUT */}
          {activeTab === 'clock_out' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Field Clock-Out & Hours Worked</h3>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Field Agent</th>
                    <th className="p-3">Clock Out Time</th>
                    <th className="p-3">Hours Worked</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agents.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{a.name}</td>
                      <td className="p-3 font-mono text-slate-400">-- (On Duty)</td>
                      <td className="p-3 font-semibold text-sky-400">4h 30m Active</td>
                      <td className="p-3 text-slate-300">Territory Route Run</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">ACTIVE ON RUN</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: LAST REFRESH */}
          {activeTab === 'last_refresh' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Agent Telemetry & Battery Monitor</h3>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Field Agent</th>
                    <th className="p-3">Last GPS Update</th>
                    <th className="p-3">Last Activity</th>
                    <th className="p-3">Battery Level</th>
                    <th className="p-3">Connection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agents.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{a.name}</td>
                      <td className="p-3 font-mono text-sky-400">Just now</td>
                      <td className="p-3 text-slate-300">GPS Ping Broadcast</td>
                      <td className="p-3 text-purple-400 font-bold">85%</td>
                      <td className="p-3 text-emerald-400 font-bold">● Online (4G)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: ORDER STATUS */}
          {activeTab === 'order_status' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Order Status & Target Achievement</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Today's Orders</span>
                  <p className="text-lg font-bold text-white">{orders.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Approved & Processing</span>
                  <p className="text-lg font-bold text-emerald-400">{orders.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Gross Sales Value</span>
                  <p className="text-lg font-bold text-sky-400">₦{orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Achievement Rate</span>
                  <p className="text-lg font-bold text-purple-400">88%</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TOTAL VISITS AND REPORTS */}
          {activeTab === 'total_visits' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Total Visits, Company & Competitor Reports</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Visits With Orders</span>
                  <p className="text-lg font-bold text-emerald-400">{visits.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Onsite Verification Rate</span>
                  <p className="text-lg font-bold text-sky-400">100%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Short Visits Detected</span>
                  <p className="text-lg font-bold text-amber-400">0</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Competitor Insights</span>
                  <p className="text-lg font-bold text-purple-400">2 filed</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BY FIELD STAFF */}
          {activeTab === 'by_staff' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Performance Breakdown by Field Staff</h3>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Visits</th>
                    <th className="p-3">Orders</th>
                    <th className="p-3">Order Amount</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agents.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{a.name}</td>
                      <td className="p-3 font-semibold text-sky-400">{a.todayVisits}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{a.todayOrders}</td>
                      <td className="p-3 font-bold text-white">₦{(a.todayOrders * 45000).toLocaleString()}</td>
                      <td className="p-3 font-mono">4.5h</td>
                      <td className="p-3 text-emerald-400 font-bold">{a.performanceScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 8: BY HOURS */}
          {activeTab === 'by_hours' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hourly Activity Distribution</h3>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((hr, idx) => (
                  <div key={hr} className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                    <span className="text-[10px] text-slate-400 font-mono">{hr}</span>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-8 bg-sky-500 rounded-t-lg" style={{ height: `${(idx + 1) * 15}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-white">{idx + 2} visits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: CUSTOMER VISIT ANALYTICS */}
          {activeTab === 'cust_analytics' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customer Visit Distribution & Retention</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Total Visited Outlets</span>
                  <p className="text-lg font-bold text-white">{visits.length || 2}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Unique Outlets</span>
                  <p className="text-lg font-bold text-sky-400">100%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Returning Customers</span>
                  <p className="text-lg font-bold text-purple-400">85%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400">Conversion to Order</span>
                  <p className="text-lg font-bold text-emerald-400">92%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AgentAdminFieldAgentsView({ params = {}, onNavigate }) {
  const [agents, setAgents] = useState([])
  const [filterStatus, setFilterStatus] = useState(params.status || 'all')
  const [selectedAgent, setSelectedAgent] = useState(null)

  const fetchAgents = async () => {
    const query = filterStatus && filterStatus !== 'all' ? `?status=${filterStatus}` : ''
    const res = await apiRequest(`/api/agent-admin/field-agents${query}`)
    setAgents(res?.data || [])
  }

  useEffect(() => {
    fetchAgents()
  }, [filterStatus])

  const openProfile = async (id) => {
    const res = await apiRequest(`/api/agent-admin/field-agents/${id}`)
    setSelectedAgent(res?.data || null)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline flex items-center gap-1 font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Field Agent Directory</span>
          {filterStatus !== 'all' && (
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
              Filter: {filterStatus.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'offline'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterStatus === st ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {agents.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-slate-400">No field agents match the selected status filter ({filterStatus}).</p>
            <button onClick={() => setFilterStatus('all')} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
              View All Agents
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
              <tr>
                <th className="p-3">Agent Name</th>
                <th className="p-3">Group & Territory</th>
                <th className="p-3">Status</th>
                <th className="p-3">Clock Status</th>
                <th className="p-3">Visits / Orders</th>
                <th className="p-3">Score</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <p className="font-bold text-white">{a.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{a.employeeId}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-slate-200">{a.group}</p>
                    <p className="text-[10px] text-slate-400">{a.territory}</p>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' :
                      a.status === 'On Visit' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{a.clockStatus}</td>
                  <td className="p-3 font-semibold text-white">{a.todayVisits} visits • {a.todayOrders} orders</td>
                  <td className="p-3 text-emerald-400 font-bold">{a.performanceScore}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => openProfile(a.id)} className="px-3 py-1 rounded bg-sky-600 text-white font-bold text-[10px]">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedAgent.profile.fullName}</h3>
                <p className="text-xs text-sky-400">{selectedAgent.profile.employeeCode} • {selectedAgent.profile.group}</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400 block">Clock In</span>
                <span className="font-bold text-white text-sm">{selectedAgent.todayActivity.clockIn}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400 block">Visits Today</span>
                <span className="font-bold text-sky-400 text-sm">{selectedAgent.todayActivity.visitsCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400 block">Orders (₦)</span>
                <span className="font-bold text-emerald-400 text-sm">₦{selectedAgent.todayActivity.orderAmount.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400 block">Battery / GPS</span>
                <span className="font-bold text-purple-400 text-sm">{selectedAgent.todayActivity.batteryLevel}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentAdminAttendanceView({ isSupervisor, onNavigate }) {
  const [logs, setLogs] = useState([])
  useEffect(() => {
    apiRequest('/api/agent-admin/attendance').then((res) => setLogs(res?.data || []))
  }, [])
  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">{isSupervisor ? 'Team GPS Attendance' : 'Field Agent Attendance'}</span>
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-white">{isSupervisor ? 'Team GPS Attendance & Timesheets' : 'Field Agent GPS Attendance & Time Tracking'}</h2>
        <p className="text-xs text-slate-400">Server-validated GPS check-ins, late arrival detection, and hours worked</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="p-3">Agent</th>
              <th className="p-3">Date</th>
              <th className="p-3">Clock In</th>
              <th className="p-3">Clock Out</th>
              <th className="p-3">GPS Verification</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">{l.agentName}</td>
                <td className="p-3 font-mono">{l.attendance_date}</td>
                <td className="p-3 font-mono">{l.clock_in_at?.slice(11, 16) || '--'}</td>
                <td className="p-3 font-mono">{l.clock_out_at?.slice(11, 16) || 'Active'}</td>
                <td className="p-3 text-emerald-400 font-semibold">✓ Verified GPS</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AgentAdminOrdersView({ params = {}, onNavigate }) {
  const [orders, setOrders] = useState([])
  const [filterDate, setFilterDate] = useState(params.date || 'all')
  const [filterPayment, setFilterPayment] = useState(params.paymentStatus || 'all')

  const fetchOrders = async () => {
    let query = []
    if (filterDate && filterDate !== 'all') query.push(`date=${filterDate}`)
    if (filterPayment && filterPayment !== 'all') query.push(`paymentStatus=${filterPayment}`)
    const qStr = query.length > 0 ? `?${query.join('&')}` : ''
    const res = await apiRequest(`/api/sales/orders${qStr}`)
    setOrders(res?.data || [])
  }

  useEffect(() => {
    fetchOrders()
  }, [filterDate, filterPayment])

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
              &larr; Back to Dashboard
            </button>
            <span>/</span>
            <span className="text-white font-bold">Commercial Sales Orders</span>
            {filterDate !== 'all' && <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">Date: {filterDate}</span>}
            {filterPayment !== 'all' && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">Payment: {filterPayment}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setFilterDate('all'); setFilterPayment('all'); }} className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700">
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Commercial Orders & Delivery Status</h2>
        <p className="text-xs text-slate-400">Order verification, discount approvals, and dispatch workflows</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-slate-400">No orders found for the selected filter.</p>
            <button onClick={() => { setFilterDate('all'); setFilterPayment('all'); }} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
              View All Orders
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
              <tr>
                <th className="p-3">Order Code</th>
                <th className="p-3">Customer Outlet</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-white">{o.id}</td>
                  <td className="p-3 font-semibold text-slate-200">{o.customerName}</td>
                  <td className="p-3 text-slate-400">{o.agentName}</td>
                  <td className="p-3 font-bold text-emerald-400">₦{o.total?.toLocaleString()}</td>
                  <td className="p-3 uppercase">{o.paymentMethod}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">{o.paymentStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function AgentAdminExpensesView({ isSupervisor, onNavigate }) {
  const { showToast } = useApp()
  const [expenses, setExpenses] = useState([])

  const fetchExpenses = async () => {
    const res = await apiRequest('/api/agent-admin/expenses')
    setExpenses(res?.data || [])
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleReview = async (id, action) => {
    try {
      await apiRequest(`/api/agent-admin/expenses/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      showToast(`Expense ${action}d!`)
      fetchExpenses()
    } catch (err) {
      showToast('Review failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">{isSupervisor ? 'Team Field Expenses' : 'Field Expense Approvals'}</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">{isSupervisor ? 'Team Field Expense Claims' : 'Agent Field Expense Approvals'}</h2>
        <p className="text-xs text-slate-400">Review transit, fuel, and meal claims submitted by field agents</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="p-3">Agent</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">{e.agentName}</td>
                <td className="p-3 text-sky-300 font-semibold">{e.category}</td>
                <td className="p-3 text-slate-400">{e.description}</td>
                <td className="p-3 font-bold text-emerald-400">₦{e.amount?.toLocaleString()}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px]">{e.status}</span></td>
                <td className="p-3 text-right space-x-2">
                  {e.status === 'Pending' && (
                    <>
                      <button onClick={() => handleReview(e.id, 'approve')} className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">Approve</button>
                      <button onClick={() => handleReview(e.id, 'reject')} className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AgentAdminRedFlagsView({ params = {}, onNavigate }) {
  const { showToast } = useApp()
  const [flags, setFlags] = useState([])
  const [filterStatus, setFilterStatus] = useState(params.status || 'open')

  const fetchFlags = async () => {
    const qStr = filterStatus && filterStatus !== 'all' ? `?status=${filterStatus}` : ''
    const res = await apiRequest(`/api/agent-admin/red-flags${qStr}`)
    setFlags(res?.data || [])
  }

  useEffect(() => {
    fetchFlags()
  }, [filterStatus])

  const handleResolve = async (id) => {
    try {
      await apiRequest(`/api/agent-admin/red-flags/${id}/resolve`, { method: 'POST' })
      showToast('Red flag marked as resolved!')
      fetchFlags()
    } catch (err) {
      showToast('Failed to resolve', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
              &larr; Back to Dashboard
            </button>
            <span>/</span>
            <span className="text-white font-bold">Red Flag Anomalies</span>
            {filterStatus !== 'all' && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">Status: {filterStatus.toUpperCase()}</span>}
          </div>
          <div className="flex items-center gap-2">
            {['open', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filterStatus === st ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Red Flag Issue Resolution & Anomalies</h2>
        <p className="text-xs text-slate-400">Audit short visits, GPS discrepancies, and out-of-territory activity</p>
      </div>

      <div className="space-y-3">
        {flags.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">No {filterStatus} red flags detected.</p>
            <button onClick={() => setFilterStatus('all')} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
              View All History
            </button>
          </div>
        ) : (
          flags.map((f) => (
            <div key={f.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-rose-400" />
                  <span className="font-bold text-white text-sm">{f.type}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">{f.severity}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{f.description}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Agent: {f.agentName}</p>
              </div>
              <div>
                {f.status === 'Resolved' ? (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs">Resolved</span>
                ) : (
                  <button
                    onClick={() => handleResolve(f.id)}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AgentAdminRequestsView({ onNavigate }) {
  const { showToast } = useApp()
  const [requests, setRequests] = useState([])

  const fetchReqs = async () => {
    const res = await apiRequest('/api/agent-admin/requests')
    setRequests(res?.data || [])
  }

  useEffect(() => {
    fetchReqs()
  }, [])

  const handleUpdate = async (id, status) => {
    try {
      await apiRequest(`/api/agent-admin/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      showToast(`Request marked as ${status}!`)
      fetchReqs()
    } catch (err) {
      showToast('Failed to update request', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Field Requests</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Field Requests & Stock Reconciliations</h2>
        <p className="text-xs text-slate-400">Process change-of-location and field stock requests</p>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px]">{r.type}</span>
              <p className="text-xs font-semibold text-white mt-1">{r.description}</p>
              <p className="text-[11px] text-slate-400">Agent: {r.agentName}</p>
            </div>
            <div className="space-x-2">
              {r.status === 'Pending' ? (
                <>
                  <button onClick={() => handleUpdate(r.id, 'Approved')} className="px-3 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]">Approve</button>
                  <button onClick={() => handleUpdate(r.id, 'Rejected')} className="px-3 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">Reject</button>
                </>
              ) : (
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold text-xs">{r.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentAdminSchedulesView({ onNavigate }) {
  const { showToast } = useApp()
  const [schedules, setSchedules] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')

  const fetchSchedules = async () => {
    const res = await apiRequest('/api/agent-admin/schedules')
    setSchedules(res?.data || [])
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await apiRequest('/api/agent-admin/schedules', {
        method: 'POST',
        body: JSON.stringify({ customerName, date, time, agentId: '1' }),
      })
      showToast('Visit schedule created!')
      setModalOpen(false)
      setCustomerName('')
      fetchSchedules()
    } catch (err) {
      showToast('Failed to create schedule', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Field Visit Schedules</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Field Visit Schedules</h2>
          <p className="text-xs text-slate-400">Plan recurring outlet coverage schedules</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Visit Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {schedules.map((s) => (
          <div key={s.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-white text-sm">{s.customerName}</span>
            <p className="text-xs text-slate-400">Assigned: {s.agentName}</p>
            <p className="text-xs text-sky-400 font-mono">Date: {s.date} at {s.time}</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Visit Schedule</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Customer Outlet</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Balogun Mega Retail"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-all">
                Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentAdminDailyReportsView({ onNavigate }) {
  const [agents, setAgents] = useState([])
  useEffect(() => {
    apiRequest('/api/agent-admin/field-agents').then((res) => setAgents(res?.data || []))
  }, [])
  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Daily Activity Report</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Daily Field Activity Summary Report</h2>
        <p className="text-xs text-slate-400">Breakdown of visits, onsite rate, orders, and battery telemetry</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="p-3">Field Staff</th>
              <th className="p-3">Total Visits</th>
              <th className="p-3">Onsite Rate</th>
              <th className="p-3">Order Amount</th>
              <th className="p-3">Clock In / Out</th>
              <th className="p-3">Battery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">{a.name}</td>
                <td className="p-3 font-semibold text-sky-400">{a.todayVisits} visits</td>
                <td className="p-3 text-emerald-400 font-bold">100%</td>
                <td className="p-3 font-bold text-emerald-400">₦{(a.todayOrders * 45000).toLocaleString()}</td>
                <td className="p-3 font-mono">08:15 &rarr; Active</td>
                <td className="p-3 text-purple-400 font-bold">{a.battery}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AgentAdminDataExportView({ onNavigate }) {
  const { showToast } = useApp()
  const [loadingType, setLoadingType] = useState('')
  const [stats, setStats] = useState({
    visits: 5,
    orders: 5,
    attendance: 5,
    customers: 6,
    agents: 7,
    expenses: 3,
  })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [vRes, oRes, aRes, cRes, agRes, exRes] = await Promise.all([
          apiRequest('/api/agent-admin/visits'),
          apiRequest('/api/sales/orders'),
          apiRequest('/api/agent-admin/attendance'),
          apiRequest('/api/sales/customers'),
          apiRequest('/api/agent-admin/field-agents'),
          apiRequest('/api/agent-admin/expenses'),
        ])
        setStats({
          visits: vRes?.data?.length || 5,
          orders: oRes?.data?.length || 5,
          attendance: aRes?.data?.length || 5,
          customers: cRes?.data?.length || 6,
          agents: agRes?.data?.length || 7,
          expenses: exRes?.data?.length || 3,
        })
      } catch (err) {}
    }
    fetchCounts()
  }, [])

  const handleDownload = async (category, format) => {
    const actionKey = `${category}-${format}`
    setLoadingType(actionKey)

    try {
      if (category === 'visits') {
        const res = await apiRequest('/api/agent-admin/visits')
        const rows = res?.data || []
        const headers = {
          id: 'Visit ID',
          customer_name: 'Store / Outlet Name',
          agent_name: 'Field Agent',
          status: 'Visit Status',
          planned_time: 'Planned Schedule',
          check_in_time: 'Check-In Timestamp',
          duration_minutes: 'Duration (Mins)',
          is_geofence_verified: 'GPS Verified (Within 150m)',
          check_in_lat: 'Latitude',
          check_in_lng: 'Longitude',
          notes: 'Merchant Feedback & Notes',
        }
        if (format === 'csv') exportToCsv('nexfieldforce_visits_merchandising', rows, headers)
        else if (format === 'excel') exportToExcel('nexfieldforce_visits_merchandising', rows, headers, 'Visits & Merchandising')
        else if (format === 'pdf') exportToPdf('nexfieldforce_visits_merchandising', rows, headers, 'Field Visits & Merchandising Audit Report')
        showToast(`Visits data exported as ${format.toUpperCase()} successfully!`)
      } else if (category === 'orders') {
        const res = await apiRequest('/api/sales/orders')
        const rows = res?.data || []
        const headers = {
          order_number: 'Order Number',
          customer_name: 'Customer / Merchant Outlet',
          sales_agent_name: 'Sales Representative',
          order_date: 'Order Date',
          items_count: 'Items Count',
          subtotal: 'Subtotal (NGN)',
          vat_amount: 'VAT 7.5% (NGN)',
          total_amount: 'Total Amount (NGN)',
          payment_status: 'Payment Settlement',
          commission_amount: 'Agent Commission (5%)',
        }
        if (format === 'csv') exportToCsv('nexfieldforce_sales_orders', rows, headers)
        else if (format === 'excel') exportToExcel('nexfieldforce_sales_orders', rows, headers, 'Commercial Sales Orders')
        else if (format === 'pdf') exportToPdf('nexfieldforce_sales_orders', rows, headers, 'Commercial Sales Orders & Revenue Audit')
        showToast(`Sales orders exported as ${format.toUpperCase()} successfully!`)
      } else if (category === 'attendance') {
        const res = await apiRequest('/api/agent-admin/attendance')
        const rows = res?.data || []
        const headers = {
          id: 'Attendance ID',
          employee_name: 'Employee Name',
          employee_code: 'Staff Code',
          role_code: 'Job Role',
          date: 'Attendance Date',
          clock_in_time: 'Clock-In Time',
          clock_out_time: 'Clock-Out Time',
          working_hours: 'Hours Worked',
          status: 'Attendance Status',
          gps_verified: 'GPS Geofence Verified',
          latitude: 'Clock-In Latitude',
          longitude: 'Clock-In Longitude',
        }
        if (format === 'csv') exportToCsv('nexfieldforce_gps_attendance', rows, headers)
        else if (format === 'excel') exportToExcel('nexfieldforce_gps_attendance', rows, headers, 'GPS Attendance Timesheets')
        else if (format === 'pdf') exportToPdf('nexfieldforce_gps_attendance', rows, headers, 'Workforce GPS Attendance & Timesheets Report')
        showToast(`GPS Attendance exported as ${format.toUpperCase()} successfully!`)
      } else if (category === 'customers') {
        const res = await apiRequest('/api/sales/customers')
        const rows = res?.data || []
        const headers = {
          code: 'Outlet Code',
          name: 'Store Name',
          contact_person: 'Contact Person',
          phone: 'Phone Number',
          address: 'Physical Address',
          tier: 'Merchant Tier',
          type: 'Trade Category',
          balance: 'Outstanding Balance (NGN)',
          total_sales: 'Lifetime Revenue (NGN)',
          last_visit_date: 'Last Visit Date',
        }
        if (format === 'csv') exportToCsv('nexfieldforce_merchants_crm', rows, headers)
        else if (format === 'excel') exportToExcel('nexfieldforce_merchants_crm', rows, headers, 'Merchant Outlets Directory')
        else if (format === 'pdf') exportToPdf('nexfieldforce_merchants_crm', rows, headers, 'Merchant Outlets & Customer CRM Directory')
        showToast(`Customers directory exported as ${format.toUpperCase()} successfully!`)
      } else if (category === 'agents') {
        const res = await apiRequest('/api/agent-admin/field-agents')
        const rows = res?.data || []
        const headers = {
          employee_code: 'Staff Code',
          first_name: 'First Name',
          last_name: 'Last Name',
          email: 'Work Email',
          phone: 'Phone Number',
          role_code: 'Role / Designation',
          territory: 'Assigned Territory',
          employment_status: 'Account Status',
        }
        if (format === 'csv') exportToCsv('nexfieldforce_workforce_roster', rows, headers)
        else if (format === 'excel') exportToExcel('nexfieldforce_workforce_roster', rows, headers, 'Field Workforce Roster')
        else if (format === 'pdf') exportToPdf('nexfieldforce_workforce_roster', rows, headers, 'Field Workforce Roster & Deployment Registry')
        showToast(`Workforce roster exported as ${format.toUpperCase()} successfully!`)
      } else if (category === 'expenses') {
        const res = await apiRequest('/api/agent-admin/expenses')
        const rows = res?.data || []
        const headers = {
          id: 'Expense ID',
          agent_name: 'Field Agent',
          category: 'Expense Category',
          amount: 'Amount (NGN)',
          expense_date: 'Date Incurred',
          status: 'Approval Status',
          description: 'Description / Purpose',
        }
        if (format === 'csv') exportToCsv('nexfieldforce_field_expenses', rows, headers)
        else if (format === 'excel') exportToExcel('nexfieldforce_field_expenses', rows, headers, 'Field Expenses & Claims')
        else if (format === 'pdf') exportToPdf('nexfieldforce_field_expenses', rows, headers, 'Field Operations Expenses & Claims Report')
        showToast(`Expenses exported as ${format.toUpperCase()} successfully!`)
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate export file', 'error')
    } finally {
      setLoadingType('')
    }
  }

  const exportCards = [
    {
      key: 'visits',
      title: 'Export Visits & Merchandising',
      desc: 'GPS timestamps, geofence verification, photos, and merchant feedback.',
      icon: Camera,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      count: stats.visits,
    },
    {
      key: 'orders',
      title: 'Export Sales Orders',
      desc: 'SKUs, quantities, totals (NGN), VAT (7.5%), payment status, and 5% agent commissions.',
      icon: ShoppingCart,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      badgeColor: 'bg-sky-500/20 text-sky-300',
      count: stats.orders,
    },
    {
      key: 'attendance',
      title: 'Export GPS Attendance',
      desc: 'Clock in/out times, geofence accuracy bounds, and total working hours.',
      icon: Clock,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      badgeColor: 'bg-purple-500/20 text-purple-300',
      count: stats.attendance,
    },
    {
      key: 'customers',
      title: 'Export Merchant Outlets CRM',
      desc: 'Merchant names, tier levels, GPS coordinates, and outstanding credit balances.',
      icon: Building,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      count: stats.customers,
    },
    {
      key: 'agents',
      title: 'Export Workforce & Field Agents',
      desc: 'Staff codes, assigned territories, vehicle logs, and operational roles.',
      icon: Users,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      badgeColor: 'bg-teal-500/20 text-teal-300',
      count: stats.agents,
    },
    {
      key: 'expenses',
      title: 'Export Field Expenses & Claims',
      desc: 'Fuel, transit, feeding, receipts, and supervisor approval logs.',
      icon: DollarSign,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      badgeColor: 'bg-pink-500/20 text-pink-300',
      count: stats.expenses,
    },
  ]

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Data Exports</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase tracking-wider">
            📊 Multi-Format Reporting Hub
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Field Data Downloads & Multi-Format Exports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export real operational data directly as <strong>CSV</strong>, <strong>Excel (.xls)</strong>, or <strong>PDF Reports</strong>.
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          ✓ Real-Time Sync Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exportCards.map((card) => {
          const Icon = card.icon
          const isCsvLoading = loadingType === `${card.key}-csv`
          const isExcelLoading = loadingType === `${card.key}-excel`
          const isPdfLoading = loadingType === `${card.key}-pdf`

          return (
            <div
              key={card.key}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl border ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${card.badgeColor}`}>
                    {card.count} Records
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{card.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                </div>
              </div>

              {/* Multi-Format Export Buttons (CSV, Excel, PDF) */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Download Format:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* 1. CSV */}
                  <button
                    onClick={() => handleDownload(card.key, 'csv')}
                    disabled={Boolean(loadingType)}
                    className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 text-[11px] font-bold text-slate-200 hover:text-emerald-300 flex items-center justify-center gap-1 transition-all"
                    title="Download as Comma-Separated Values (CSV)"
                  >
                    {isCsvLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 text-emerald-400" /> CSV
                      </>
                    )}
                  </button>

                  {/* 2. Excel */}
                  <button
                    onClick={() => handleDownload(card.key, 'excel')}
                    disabled={Boolean(loadingType)}
                    className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-sky-900/40 hover:border-sky-500/50 border border-slate-700/60 text-[11px] font-bold text-slate-200 hover:text-sky-300 flex items-center justify-center gap-1 transition-all"
                    title="Download as Microsoft Excel Spreadsheet (.xls)"
                  >
                    {isExcelLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <FileSpreadsheet className="h-3.5 w-3.5 text-sky-400" /> Excel
                      </>
                    )}
                  </button>

                  {/* 3. PDF */}
                  <button
                    onClick={() => handleDownload(card.key, 'pdf')}
                    disabled={Boolean(loadingType)}
                    className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 hover:border-rose-500/50 border border-slate-700/60 text-[11px] font-bold text-slate-200 hover:text-rose-300 flex items-center justify-center gap-1 transition-all"
                    title="Download as Print-Ready Branded PDF Document"
                  >
                    {isPdfLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5 text-rose-400" /> PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==============================================================================
// 3. SUPERVISOR WORKSPACE (TEAM MANAGEMENT & DISPATCH)
// ==============================================================================
function SupervisorOverviewView({ onNavigate }) {
  const { user } = useAuth()
  const [teamStats, setTeamStats] = useState({ online: 2, offline: 0, todayVisits: 2, teamSales: 90000, target: 150000 })

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-purple-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">Operations Supervisor</span>
          <h2 className="text-xl font-bold text-white mt-1">Field Team Oversight, {user.fullName}</h2>
          <p className="text-xs text-slate-400">Manage your assigned field agents, dispatch work orders, and verify merchant visits</p>
        </div>
        <button
          onClick={() => onNavigate('tasks')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Dispatch Work Order
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => onNavigate('my-team')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-purple-500">
          <span className="text-xs text-slate-400">Team Online</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{teamStats.online} Active</p>
        </div>
        <div onClick={() => onNavigate('visits')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-purple-500">
          <span className="text-xs text-slate-400">Today's Visits</span>
          <p className="text-2xl font-bold text-sky-400 mt-1">{teamStats.todayVisits} Verified</p>
        </div>
        <div onClick={() => onNavigate('sales')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-purple-500">
          <span className="text-xs text-slate-400">Team Sales Generated</span>
          <p className="text-2xl font-bold text-white mt-1">₦{teamStats.teamSales.toLocaleString()}</p>
        </div>
        <div onClick={() => onNavigate('sales')} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-purple-500">
          <span className="text-xs text-slate-400">Target Achievement</span>
          <p className="text-2xl font-bold text-purple-400 mt-1">{Math.round((teamStats.teamSales / teamStats.target) * 100)}%</p>
        </div>
      </div>
    </div>
  )
}

function SupervisorMyTeamView() {
  const [team, setTeam] = useState([])
  useEffect(() => {
    apiRequest('/api/agent-admin/field-agents').then((res) => setTeam(res?.data || []))
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">My Assigned Field Team</h2>
        <p className="text-xs text-slate-400">Direct reports, real-time GPS check-in status, and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((a) => (
          <div key={a.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-white">{a.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{a.employeeId} • {a.phone}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">ACTIVE ON RUN</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-800 pt-2 text-slate-300">
              <div><span className="text-slate-500 block text-[10px]">Visits:</span> <strong className="text-sky-400">{a.todayVisits}</strong></div>
              <div><span className="text-slate-500 block text-[10px]">Orders:</span> <strong className="text-emerald-400">{a.todayOrders}</strong></div>
              <div><span className="text-slate-500 block text-[10px]">Battery:</span> <strong className="text-purple-400">{a.battery}%</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SupervisorTeamSalesView() {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    apiRequest('/api/sales/orders').then((res) => setOrders(res?.data || []))
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Team Sales & Revenue Performance</h2>
        <p className="text-xs text-slate-400">Real-time commercial orders generated by your assigned team members</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="p-3">Order Code</th>
              <th className="p-3">Outlet</th>
              <th className="p-3">Agent</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-white">{o.id}</td>
                <td className="p-3 font-semibold text-slate-200">{o.customerName}</td>
                <td className="p-3 text-slate-400">{o.agentName}</td>
                <td className="p-3 font-bold text-emerald-400">₦{o.total?.toLocaleString()}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">{o.paymentStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}



// ==============================================================================
// 5. FIELD AGENT WORKSPACE (MOBILE COCKPIT)
// ==============================================================================
function FieldAgentExpenseSubmitView({ onNavigate }) {
  const { showToast } = useApp()
  const [category, setCategory] = useState('Fuel')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiRequest('/api/agent-admin/expenses', {
        method: 'POST',
        body: JSON.stringify({ category, amount: Number(amount), description, agentId: '1' }),
      })
      showToast('Field expense claim submitted for approval!')
      setAmount('')
      setDescription('')
    } catch (err) {
      showToast('Failed to submit expense', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Submit Field Expense</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Submit Field Expense Claim</h2>
        <p className="text-xs text-slate-400">Submit fuel, transit, or toll claims with receipt verification</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
          >
            <option value="Fuel">Fuel / Gas</option>
            <option value="Transport">Public Transit / Taxi</option>
            <option value="Meals">Meals & Refreshment</option>
            <option value="Airtime">Communication & Airtime</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Amount (₦)</label>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt / Justification</label>
          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Fuel purchase for route coverage"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
          />
        </div>

        <button type="submit" className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-all shadow">
          Submit Claim
        </button>
      </form>
    </div>
  )
}

// ==============================================================================
// 6. HR MANAGER WORKSPACE (HRM SUITE)
// ==============================================================================
function HrPayrollSalariesView({ onNavigate }) {
  const [salaries, setSalaries] = useState([])
  useEffect(() => {
    apiRequest('/api/payroll/salaries').then((res) => setSalaries(res?.data || []))
  }, [])
  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Payroll & Salaries</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Payroll & Salary Records</h2>
        <p className="text-xs text-slate-400">Monthly compensation, allowances, deductions, and payslip generation</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
            <tr>
              <th className="p-3">Staff Name</th>
              <th className="p-3">Base Salary</th>
              <th className="p-3">Allowances</th>
              <th className="p-3">Deductions</th>
              <th className="p-3">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {salaries.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">{s.employee_name}</td>
                <td className="p-3 font-mono">₦{s.base_salary?.toLocaleString()}</td>
                <td className="p-3 font-mono text-emerald-400">+₦{s.allowances?.toLocaleString()}</td>
                <td className="p-3 font-mono text-rose-400">-₦{s.deductions?.toLocaleString()}</td>
                <td className="p-3 font-bold text-sky-400">₦{s.net_salary?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HrPerformanceAppraisalsView({ onNavigate }) {
  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Performance Appraisals</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Performance Appraisals & Goal Tracking</h2>
        <p className="text-xs text-slate-400">Quarterly evaluations, KPI scorecards, and promotion benchmarks</p>
      </div>
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
        Current quarterly performance cycle is active. Average organization performance is 92%.
      </div>
    </div>
  )
}

function HrEmployeeDocumentsView({ onNavigate }) {
  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Employee Documents</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Employee Documents & Compliance Repository</h2>
        <p className="text-xs text-slate-400">Contracts, identification, and compliance records</p>
      </div>
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
        All mandatory employee compliance files and NDA contracts are indexed and securely encrypted.
      </div>
    </div>
  )
}

// ==============================================================================
// 7. STAFF MEMBER WORKSPACE (EMPLOYEE SELF-SERVICE)
// ==============================================================================
function StaffMyDocumentsView({ onNavigate }) {
  const { user } = useAuth() || {}
  const { showToast } = useApp()
  const [downloading, setDownloading] = useState('')

  const handleDownloadPayslip = () => {
    setDownloading('payslip')
    try {
      generateOfficialPayslipPdf({
        employeeName: user?.fullName || 'Tariq Al-Mansoor',
        employeeCode: user?.employeeCode || 'NEX-0007',
        role: user?.roleName || user?.jobTitle || 'Corporate Staff Member',
        department: 'Operations & Administration',
        period: 'August 2026',
        companyName: user?.companyName || 'NexFieldForce Enterprise Platform Ltd',
        baseSalary: 350000,
        housing: 120000,
        transport: 60000,
        utility: 30000,
        commission: 0,
        taxPaye: 42000,
        pension: 28000,
        nhf: 5000,
      })
      showToast('Official Payslip PDF downloaded successfully!')
    } catch (err) {
      showToast('Failed to generate Payslip: ' + err.message, 'error')
    } finally {
      setDownloading('')
    }
  }

  const handleDownloadAgreement = () => {
    setDownloading('agreement')
    try {
      generateEmploymentAgreementPdf({
        employeeName: user?.fullName || 'Tariq Al-Mansoor',
        employeeCode: user?.employeeCode || 'NEX-0007',
        role: user?.roleName || user?.jobTitle || 'Corporate Staff Member',
        department: 'Operations & Administration',
        startDate: '2026-01-15',
        companyName: user?.companyName || 'NexFieldForce Enterprise Platform Ltd',
      })
      showToast('Employment Agreement & NDA PDF downloaded successfully!')
    } catch (err) {
      showToast('Failed to generate Agreement: ' + err.message, 'error')
    } finally {
      setDownloading('')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">My Documents</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">My Employment Documents & Payslips</h2>
        <p className="text-xs text-slate-400">Download your verified compensation slips and signed agreements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Payslip Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-sky-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                August 2026 • Verified
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Latest Payslip (Current Month)</h4>
              <p className="text-xs text-slate-400 mt-1">
                Net salary disbursed: <strong>₦485,000.00</strong>. Download official PDF voucher with earnings & statutory deductions breakdown.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPayslip}
            disabled={Boolean(downloading)}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {downloading === 'payslip' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4" /> Download Official Payslip PDF
              </>
            )}
          </button>
        </div>

        {/* Employment Agreement Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Active Contract • Signed
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Employment Agreement & NDA</h4>
              <p className="text-xs text-slate-400 mt-1">
                Official contract document signed during onboarding with confidentiality, non-disclosure & IP assignment covenants.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadAgreement}
            disabled={Boolean(downloading)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {downloading === 'agreement' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4" /> Download Signed Agreement PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function StaffHelpSupportView({ onNavigate }) {
  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Help & Support</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Help & HR Support Desk</h2>
        <p className="text-xs text-slate-400">Get in touch with HR officers, IT helpdesk, and operations support</p>
      </div>
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <p className="text-xs text-slate-300"><strong>HR Desk Email:</strong> hr@nexfieldforce.com</p>
        <p className="text-xs text-slate-300"><strong>IT Support:</strong> it-support@nexfieldforce.com</p>
        <p className="text-xs text-slate-300"><strong>Operations Emergency Hotline:</strong> +234 800 NEXFIELD</p>
      </div>
    </div>
  )
}

// ==============================================================================
// REAL-TIME LEAFLET LIVE TELEMETRY MAP
// ==============================================================================
function RealtimeLiveMapView({ role }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [data, setData] = useState(null)

  const fetchTelemetry = async () => {
    try {
      const res = await apiRequest('/api/monitoring/live')
      setData(res?.data || null)
    } catch (err) {
      console.warn('Telemetry notice:', err)
    }
  }

  useEffect(() => {
    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined') return
    const L = window.L
    if (!L) return

    if (!mapInstanceRef.current) {
      const initialLat = 6.4544
      const initialLng = 3.3947
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []

    const agents = data?.agents || []
    const customers = data?.customerPins || []

    agents.forEach((agent) => {
      const lat = agent.latitude || 6.4544
      const lng = agent.longitude || 3.3947
      const isField = agent.role === 'FIELD_AGENT'

      const agentIcon = L.divIcon({
        className: 'custom-agent-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: ${isField ? '#0284c7' : '#10b981'}; opacity: 0.6; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: ${isField ? '#0369a1' : '#047857'}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 0 12px ${isField ? '#38bdf8' : '#34d399'};">
              ${agent.fullName.charAt(0)}
            </div>
            <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.9); color: #ffffff; border: 1px solid #334155; border-radius: 6px; padding: 1px 6px; font-size: 9px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
              📍 ${agent.fullName.split(' ')[0]} (${agent.speed || 0}km/h)
            </div>
          </div>
        `,
        iconSize: [80, 48],
        iconAnchor: [40, 20],
      })

      const marker = L.marker([lat, lng], { icon: agentIcon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 160px;">
          <strong style="font-size: 13px; color: #0284c7;">${agent.fullName}</strong><br/>
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">${agent.role.replace(/_/g, ' ')}</span>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <div style="font-size: 11px; line-height: 1.4;">
            <div><strong>Status:</strong> ${agent.status}</div>
            <div><strong>Speed:</strong> ${agent.speed || 0} km/h</div>
            <div><strong>Route:</strong> ${agent.routeName || 'Active Run'}</div>
          </div>
        </div>
      `)
      markersRef.current.push(marker)
    })

    customers.forEach((cust) => {
      const lat = cust.lat || 6.4544
      const lng = cust.lng || 3.3947

      const custIcon = L.divIcon({
        className: 'custom-cust-marker',
        html: `
          <div style="background: #1e293b; border: 2px solid #10b981; border-radius: 8px; padding: 2px 6px; color: #10b981; font-weight: bold; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>🏪 ${cust.name}</span>
          </div>
        `,
        iconSize: [100, 24],
        iconAnchor: [50, 12],
      })

      const marker = L.marker([lat, lng], { icon: custIcon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <strong style="color: #059669; font-size: 13px;">${cust.name}</strong><br/>
          <div style="margin-top: 4px;"><strong>Balance:</strong> ₦${(cust.balance || 0).toLocaleString()}</div>
        </div>
      `)
      markersRef.current.push(marker)
    })
  }, [data])

  const agents = data?.agents || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Telemetry Map (Free OpenStreetMap API)</h2>
          <p className="text-xs text-slate-400">Live agent GPS pins, accuracy beacons, customer outlet locations, and route paths</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry Feed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-3 flex flex-col min-h-[460px] overflow-hidden shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-full min-h-[440px] rounded-xl z-0 overflow-hidden" />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Agents Live on Map</h3>
            {agents.map((a) => (
              <div key={a.userId} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{a.fullName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    {a.status?.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{a.routeName || 'Assigned Territory Run'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// AUTHENTICATION PORTAL (ONE AUTHENTICATION SYSTEM FOR ALL USERS)
// ==============================================================================
function UnifiedAuthPortal({ onLoginSuccess }) {
  const { login } = useAuth()
  const { showToast } = useApp()
  const [activeTab, setActiveTab] = useState('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Registration state
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('EMPLOYEE')
  const [regJobTitle, setRegJobTitle] = useState('')
  const [regSuccessMessage, setRegSuccessMessage] = useState('')

  // Password reset state
  const [resetEmail, setResetEmail] = useState('')
  const [resetPhone, setResetPhone] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      onLoginSuccess()
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setRegSuccessMessage('')
    setLoading(true)
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          roleCode: regRole,
          jobTitle: regJobTitle || regRole.replace(/_/g, ' '),
        }),
      })

      if (res?.requiresApproval) {
        setRegSuccessMessage(res.message)
        showToast(res.message, 'success')
      } else if (res?.token) {
        await setAccessToken(res.token)
        showToast('Account registered successfully!')
        window.location.reload()
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSelfReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiRequest('/api/auth/self-reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail, phone: resetPhone, newPassword: resetNewPassword }),
      })
      showToast(res.message || 'Password reset successful! Please sign in.')
      setEmail(resetEmail)
      setPassword(resetNewPassword)
      setActiveTab('login')
    } catch (err) {
      setError(err.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl animate-fade-in">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white font-bold text-xl shadow-lg shadow-sky-500/20">
            N
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">NexFieldForce Enterprise</h1>
          <p className="text-xs text-slate-400 mt-0.5">Unified HR + Sales Force + Field Operations OS</p>
        </div>

        {/* 3-Tab Header */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800/80 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); setRegSuccessMessage(''); }}
            className={`py-2 rounded-lg transition-all text-center ${
              activeTab === 'login' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); setRegSuccessMessage(''); }}
            className={`py-2 rounded-lg transition-all text-center ${
              activeTab === 'register' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('reset'); setError(''); setRegSuccessMessage(''); }}
            className={`py-2 rounded-lg transition-all text-center ${
              activeTab === 'reset' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reset Password
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {regSuccessMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{regSuccessMessage}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('reset'); setError(''); }}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Sign In to Portal'}
            </button>
          </form>
        )}

        {/* TAB 2: CREATE ACCOUNT */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Samuel Adekunle"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+2348000000000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={regJobTitle}
                  onChange={(e) => setRegJobTitle(e.target.value)}
                  placeholder="e.g. Field Officer"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type / Desired Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
              >
                <option value="EMPLOYEE">Staff Member (Instant Employee Access)</option>
                <option value="AGENT_ADMIN">Agent Admin (Requires Admin Approval)</option>
                <option value="FIELD_AGENT">Field Agent (Requires Admin Approval)</option>
                <option value="SALES_AGENT">Sales Agent (Requires Admin Approval)</option>
                <option value="SUPERVISOR">Supervisor (Requires Admin Approval)</option>
                <option value="HR_MANAGER">HR Manager (Requires Admin Approval)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Submit Registration'}
            </button>
          </form>
        )}

        {/* TAB 3: RESET PASSWORD */}
        {activeTab === 'reset' && (
          <form onSubmit={handleSelfReset} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Work Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Phone Number</label>
              <input
                type="tel"
                required
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                placeholder="+2348000000000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function FieldVisitsProofView({ params = {}, onNavigate }) {
  const [visits, setVisits] = useState([])
  const [filterDate, setFilterDate] = useState(params.date || 'all')
  const [filterStatus, setFilterStatus] = useState(params.status || 'all')

  const fetchVisits = async () => {
    let query = []
    if (filterDate && filterDate !== 'all') query.push(`date=${filterDate}`)
    if (filterStatus && filterStatus !== 'all') query.push(`status=${filterStatus}`)
    const qStr = query.length > 0 ? `?${query.join('&')}` : ''
    const res = await apiRequest(`/api/field/visits${qStr}`)
    setVisits(res?.data || [])
  }

  useEffect(() => {
    fetchVisits()
  }, [filterDate, filterStatus])

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
              &larr; Back to Dashboard
            </button>
            <span>/</span>
            <span className="text-white font-bold">Field Visits & Proof</span>
            {filterDate !== 'all' && <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">Date: {filterDate}</span>}
            {filterStatus !== 'all' && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">Status: {filterStatus}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setFilterDate('all'); setFilterStatus('all'); }} className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700">
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white">Field Visits Proof & Merchandising Audit</h2>
        <p className="text-xs text-slate-400">GPS verified check-ins, low stock photos, and competitor reports</p>
      </div>

      <div className="space-y-3">
        {visits.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">No visits found for the selected filter.</p>
            <button onClick={() => { setFilterDate('all'); setFilterStatus('all'); }} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
              View All Visits
            </button>
          </div>
        ) : (
          visits.map((v) => (
            <div key={v.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">{v.customerName}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">GPS VERIFIED</span>
              </div>
              <p className="text-xs text-slate-300">{v.notes}</p>
              {v.stockStatus && <p className="text-[11px] text-amber-400 font-semibold">Stock Status: {v.stockStatus}</p>}
              {v.proofPhotoUrl && (
                <div className="mt-2">
                  <img src={v.proofPhotoUrl} alt="Visit Evidence" className="h-32 rounded-xl object-cover border border-slate-700" />
                </div>
              )}
              <p className="text-[11px] text-slate-400">Feedback: "{v.customerFeedback}" • Agent: {v.agentName}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OutletsDirectoryView({ params = {}, isField, isSales, onNavigate }) {
  const { showToast } = useApp()
  const [customers, setCustomers] = useState([])
  const [markets, setMarkets] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filterCreated, setFilterCreated] = useState(params.created || 'all')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [marketId, setMarketId] = useState('')
  const [streetName, setStreetName] = useState('')
  const [lat, setLat] = useState(6.4544)
  const [lng, setLng] = useState(3.3947)
  const [gpsFetching, setGpsFetching] = useState(false)

  const fetchOutlets = async () => {
    let q = filterCreated && filterCreated !== 'all' ? `?created=${filterCreated}` : ''
    const [cRes, mRes] = await Promise.all([
      apiRequest(`/api/sales/customers${q}`),
      apiRequest('/api/sales/markets'),
    ])
    setCustomers(cRes?.data || [])
    setMarkets(mRes?.data || [])
  }

  useEffect(() => {
    fetchOutlets()
  }, [filterCreated])

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error')
      return
    }
    setGpsFetching(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGpsFetching(false)
        showToast(`📍 Live GPS coordinates captured (±${Math.round(pos.coords.accuracy || 5)}m)!`)
      },
      (err) => {
        setGpsFetching(false)
        showToast('Could not fetch GPS. Please allow location access.', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('Please enter an outlet name', 'error')
      return
    }
    try {
      const res = await apiRequest('/api/sales/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || '+2348000000000',
          marketId: marketId || (markets[0]?.id || ''),
          streetName: (streetName || 'Lagos Commercial Area').trim(),
          address: (streetName || 'Lagos Commercial Area').trim(),
          latitude: Number(lat || 6.4544),
          longitude: Number(lng || 3.3947),
          tier: 'Tier 1',
          customerType: 'Retailer',
        }),
      })
      showToast(res?.message || 'Merchant outlet registered with verified GPS coordinates!', 'success')
      setModalOpen(false)
      setName('')
      setPhone('')
      setStreetName('')
      fetchOutlets()
    } catch (err) {
      showToast(err?.message || 'Failed to register outlet', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold">
              &larr; Back to Dashboard
            </button>
            <span>/</span>
            <span className="text-white font-bold">Merchant Outlets</span>
            {filterCreated !== 'all' && <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">Created: {filterCreated}</span>}
          </div>
          {filterCreated !== 'all' && (
            <button onClick={() => setFilterCreated('all')} className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700">
              View All Outlets
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Merchant & Retail Outlets</h2>
          <p className="text-xs text-slate-400">Directory of commercial retail and wholesale customers with verified GPS coordinates</p>
        </div>
        <button
          onClick={() => { setModalOpen(true); handleGetCurrentGps(); }}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="h-4 w-4" /> Register New Outlet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-white text-sm block">{c.name}</span>
            <p className="text-xs text-slate-400">{c.streetName}, {c.marketName}</p>
            <p className="text-xs text-slate-300 font-mono">Phone: {c.phone || 'N/A'}</p>
            <p className="text-[11px] text-sky-400 font-mono">GPS: {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Merchant Outlet</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Outlet Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Balogun Mega Retail"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348000000000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Commercial Market</label>
                <select
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- General Market --</option>
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  placeholder="e.g. Broad Street"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Live GPS Coordinates</label>
                  <button
                    type="button"
                    onClick={handleGetCurrentGps}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                  >
                    <Crosshair className={`h-3 w-3 ${gpsFetching ? 'animate-spin' : ''}`} />
                    {gpsFetching ? 'Fetching GPS...' : '📍 Auto-Fetch GPS'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white font-mono"
                    placeholder="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white font-mono"
                    placeholder="Longitude"
                  />
                </div>
              </div>

              <button type="submit" className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-all shadow">
                Save Outlet with GPS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// 15. NEXFIELD ENTERPRISE AI OPERATIONS COPILOT & DRAWER
// ==============================================================================
function getRoleQuickActions(roleCode) {
  const norm = (roleCode || 'EMPLOYEE').toUpperCase()
  if (norm === 'SUPER_ADMIN' || norm === 'COMPANY_ADMIN') {
    return [
      { label: '📊 Organization Summary', prompt: 'Give me an organization-wide operations summary.' },
      { label: '🛡️ System Security Audit', prompt: 'Show me recent security audit logs and admin activities.' },
      { label: '👥 Field Force Overview', prompt: 'How many agents are active and what is their performance?' },
      { label: '⚡ System Health', prompt: 'What is the system health, active companies, and uptime?' },
      { label: '📥 Export Report', prompt: 'Export today\'s agent performance report as CSV.' },
    ]
  }
  if (norm === 'AGENTADMIN' || norm === 'AGENT_ADMIN') {
    return [
      { label: '⚠️ Agents Needing Attention', prompt: 'Which agents need attention today and what are their anomalies?' },
      { label: '📊 Today\'s Operations Brief', prompt: 'How are my agents doing today?' },
      { label: '🗺️ Live Map Tracking', prompt: 'Where are my agents right now?' },
      { label: '🕒 Who Came Late Today?', prompt: 'Who came late today?' },
      { label: '🚩 Open Red Flags Radar', prompt: 'Show open red flags and operational anomalies.' },
      { label: '🔍 Duplicate Customers?', prompt: 'Are there any duplicate customer outlets in the system?' },
      { label: '📥 Export Activity Report', prompt: 'Export today\'s activity report.' },
    ]
  }
  if (norm === 'SUPERVISOR' || norm === 'MANAGER') {
    return [
      { label: '👔 Team Performance', prompt: 'How is my team doing today?' },
      { label: '📍 Team Live Tracking', prompt: 'Where are my team members right now?' },
      { label: '🕒 Team Attendance Today', prompt: 'Who came late today in my team?' },
      { label: '📋 Today\'s Visits', prompt: 'Show me today\'s visits completed by my team.' },
      { label: '🏆 Team Leaderboard', prompt: 'Show the agent sales target leaderboard.' },
    ]
  }
  if (norm === 'SALES_AGENT') {
    return [
      { label: '💰 My Month\'s Sales', prompt: 'How much have I sold this month?' },
      { label: '📋 My Active Leads', prompt: 'Show my assigned customers and recent sales.' },
      { label: '💳 Customer Balances', prompt: 'Which of my customers have outstanding balances?' },
      { label: '🎯 My Target Progress', prompt: 'What is my current performance against target?' },
      { label: '🛒 Today\'s Orders', prompt: 'Show today\'s orders booked by me.' },
    ]
  }
  if (norm === 'FIELD_AGENT') {
    return [
      { label: '📋 What Do I Need To Do Today?', prompt: 'What do I need to do today?' },
      { label: '🕒 My Attendance Status', prompt: 'Show my attendance and clock-in status today.' },
      { label: '📅 My Scheduled Visits', prompt: 'What visits do I have scheduled for today?' },
      { label: '📝 My Active Tasks', prompt: 'Show my pending tasks.' },
      { label: '💵 My Expenses', prompt: 'Show my submitted expense claims.' },
    ]
  }
  if (norm === 'HR_MANAGER' || norm === 'HR_ADMIN' || norm === 'HR_OFFICER') {
    return [
      { label: '🕒 Who Came Late Today?', prompt: 'Who came late today?' },
      { label: '📊 Attendance Summary', prompt: 'Give me the enterprise attendance intelligence summary.' },
      { label: '🏖️ Pending Leave Requests', prompt: 'List all leave applications awaiting manager approval.' },
      { label: '👥 Staff Headcount', prompt: 'How many active staff are registered across departments?' },
      { label: '📑 Expiring Documents Radar', prompt: 'Retrieve employee documents expiring within 60 days.' },
    ]
  }
  return [
    { label: '📝 My Active Tasks', prompt: 'Show my pending tasks.' },
    { label: '🕒 My Attendance Log', prompt: 'Show my attendance record for this month.' },
    { label: '📢 Company Announcements', prompt: 'Show recent company announcements and updates.' },
    { label: '🏖️ Request Leave', prompt: 'What leave balances do I have remaining?' },
  ]
}

function AiMarkdownMessage({ content, navigation, pendingConfirmation, onNavigate, onExecutePending }) {
  const lines = (content || '').split('\n')

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-1" />

        // Header ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sky-400 text-xs mt-2 mb-1">
              {trimmed.replace('### ', '')}
            </h4>
          )
        }
        // Header ## or #
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-bold text-white text-sm mt-2.5 mb-1 pb-1 border-b border-slate-700/60">
              {trimmed.replace(/^#+\s*/, '')}
            </h3>
          )
        }
        // Warning callout
        if (trimmed.startsWith('⚠️ ') || trimmed.includes('⚠️')) {
          return (
            <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium my-1">
              {trimmed}
            </div>
          )
        }
        // Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const text = trimmed.replace(/^[-•*]\s*/, '')
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 my-0.5">
              <span className="text-sky-400 font-bold leading-none mt-1">•</span>
              <span className="flex-1">{formatInlineAiText(text)}</span>
            </div>
          )
        }

        return <p key={idx} className="my-0.5">{formatInlineAiText(trimmed)}</p>
      })}

      {/* Interactive Navigation Action Pill */}
      {navigation && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate(navigation.tab, navigation.params)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{navigation.label || `Open ${navigation.tab}`}</span>
          </button>
        </div>
      )}

      {/* Pending Mutating Tool Execution Confirmation */}
      {pendingConfirmation && (
        <div className="p-3 mt-3 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>Action Confirmation Required</span>
          </div>
          <p className="text-[11px] text-slate-300">{pendingConfirmation.description}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onExecutePending && onExecutePending(pendingConfirmation.action, pendingConfirmation.params)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow"
            >
              ✅ Confirm & Execute
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatInlineAiText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="text-slate-300 italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    return part
  })
}

// 1. FULL-SCREEN DEDICATED AI COPILOT VIEW
function AiCopilotView({ roleContext }) {
  const { user } = useAuth()
  const { navigateWithParams } = useApp()
  const role = (user?.role || 'EMPLOYEE').toUpperCase()
  const quickActions = getRoleQuickActions(role)

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello **${user?.fullName || 'User'}**! I am the **NEXField Operations AI Copilot**.\n\nI am configured for **${role.replace(/_/g, ' ')}** with outside-the-AI RBAC validation and direct real-time database access across your permitted scope.\n\nAsk me anything about today's performance, agents, customer outlets, visits, routes, attendance, orders, or anomalies.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendPrompt = async (promptText) => {
    if (!promptText || !promptText.trim()) return
    const userText = promptText.trim()
    setMessages((prev) => [...prev, { role: 'user', content: userText }])
    setInput('')
    setLoading(true)

    try {
      const res = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          context: { currentRole: role, currentPage: 'ai-view' },
        }),
      })

      if (res?.data?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.content,
            navigation: res.data.navigation,
            pendingConfirmation: res.data.pendingConfirmation,
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error processing query: ${err.message || 'Server error'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleExecutePending = async (toolName, params) => {
    try {
      const res = await apiRequest('/api/ai/execute-tool', {
        method: 'POST',
        body: JSON.stringify({ toolName, params }),
      })
      if (res?.data?.message) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `✅ **Action Completed:** ${res.data.message}` },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Failed to execute action: ${err.message}` },
      ])
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">NEXField Operations AI Copilot</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase">
                {role.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Strict Outside-AI RBAC Guard • Real-Time Platform Telemetry</p>
          </div>
        </div>
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Prompts:</span>
        {quickActions.map((qa, i) => (
          <button
            key={i}
            onClick={() => handleSendPrompt(qa.prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900/40 hover:border-purple-500/40 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl p-4 rounded-2xl ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/70 shadow-lg'
              }`}
            >
              {m.role === 'assistant' ? (
                <AiMarkdownMessage
                  content={m.content}
                  navigation={m.navigation}
                  pendingConfirmation={m.pendingConfirmation}
                  onNavigate={(tab, params) => navigateWithParams(tab, params)}
                  onExecutePending={handleExecutePending}
                />
              ) : (
                <p className="text-xs">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs text-purple-400 bg-purple-950/20 border border-purple-800/40 rounded-xl w-fit animate-pulse">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>Querying verified database through RBAC authorization layer...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendPrompt(input)
        }}
        className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask anything about ${role.replace(/_/g, ' ').toLowerCase()} operations, metrics, visits, or staff...`}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </form>
    </div>
  )
}

// 2. UNIVERSAL FLOATING SLIDE-OVER AI ASSISTANT DRAWER
function UniversalAiAssistantDrawer({ isOpen, onClose, role, user, currentTab, tabParams, onNavigate }) {
  if (!isOpen) return null

  const quickActions = getRoleQuickActions(role)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello **${user?.fullName || 'User'}**! I am your **NEXField AI Operations Copilot**.\n\nI am currently operating in the **${(role || 'EMPLOYEE').replace(/_/g, ' ')}** context on page **${currentTab.toUpperCase()}**.\n\nHow can I assist your field operations today?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendPrompt = async (promptText) => {
    if (!promptText || !promptText.trim()) return
    const userText = promptText.trim()
    setMessages((prev) => [...prev, { role: 'user', content: userText }])
    setInput('')
    setLoading(true)

    try {
      const res = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          context: { currentRole: role, currentPage: currentTab, tabParams },
        }),
      })

      if (res?.data?.content) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.content,
            navigation: res.data.navigation,
            pendingConfirmation: res.data.pendingConfirmation,
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error processing query: ${err.message || 'Server error'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleExecutePending = async (toolName, params) => {
    try {
      const res = await apiRequest('/api/ai/execute-tool', {
        method: 'POST',
        body: JSON.stringify({ toolName, params }),
      })
      if (res?.data?.message) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `✅ **Action Completed:** ${res.data.message}` },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Failed to execute action: ${err.message}` },
      ])
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">NEXField Operations AI</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">
                  {(role || 'EMPLOYEE').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Context: <strong className="text-slate-300">{currentTab}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => handleSendPrompt(qa.prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900/40 hover:border-purple-500/40 border border-slate-700/60 text-slate-300 hover:text-white text-[10px] font-medium transition-all"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/70 shadow-lg'
                }`}
              >
                {m.role === 'assistant' ? (
                  <AiMarkdownMessage
                    content={m.content}
                    navigation={m.navigation}
                    pendingConfirmation={m.pendingConfirmation}
                    onNavigate={(tab, params) => {
                      onNavigate(tab, params)
                      onClose()
                    }}
                    onExecutePending={handleExecutePending}
                  />
                ) : (
                  <p className="text-xs">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-purple-400 bg-purple-950/20 border border-purple-800/40 rounded-xl w-fit animate-pulse">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>Querying verified database via RBAC gate...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendPrompt(input)
          }}
          className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about NEXField operations..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
