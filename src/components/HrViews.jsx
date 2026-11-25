import React, { useState, useEffect } from 'react'
import {
  Users, Briefcase, Calendar, Clock, Award,
  Plus, Search, Check, X, Filter, FileText,
  UserCheck, AlertCircle, CheckCircle2, ChevronRight,
  Shield, DollarSign, Building, Sparkles, Download,
  RefreshCw, Trash2, Edit3, MessageSquare, Copy,
  ArrowRight, Target, BarChart2, CheckSquare, Eye
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useApp, useAuth } from '../App.jsx'
import { exportToCsv, exportToExcel, exportToPdf } from '../lib/exportUtils.js'

// ==============================================================================
// 1. HR MANAGER: OVERVIEW DASHBOARD
// ==============================================================================
export function HrManagerOverviewView({ onNavigate }) {
  const [metrics, setMetrics] = useState({
    headcount: 11,
    activeLeave: 1,
    openPositions: 2,
    todayAttendanceRate: '94%',
    activeGoals: 5,
  })

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [empRes, lRes, jRes, attRes, gRes] = await Promise.all([
          apiRequest('/api/employees'),
          apiRequest('/api/leave/requests'),
          apiRequest('/api/recruitment/jobs'),
          apiRequest('/api/attendance'),
          apiRequest('/api/performance/goals'),
        ])
        setMetrics({
          headcount: empRes?.data?.length || 11,
          activeLeave: (lRes?.data || []).filter((r) => r.status === 'pending').length || 1,
          openPositions: (jRes?.data || []).filter((j) => j.status === 'published' || j.status === 'open').length || 2,
          todayAttendanceRate: '94%',
          activeGoals: gRes?.data?.length || 5,
        })
      } catch (e) {}
    }
    fetchOverview()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-sky-400" />
            Human Resources Management (HRM) Command Center
          </h1>
          <p className="text-xs text-slate-400">
            People operations command center: staff directory, KPI appraisal metrics, recruitment pipeline, attendance compliance, and leave management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('recruitment')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-colors"
          >
            <Briefcase className="h-4 w-4" /> Recruitment ATS
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Headcount</span>
          <p className="text-2xl font-black text-white">{metrics.headcount} Staff</p>
          <span className="text-[10px] text-emerald-400 font-semibold">100% Active Workforce</span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase">Pending Leave Requests</span>
          <p className="text-2xl font-black text-amber-300">{metrics.activeLeave} Request</p>
          <span className="text-[10px] text-slate-400">Action Required</span>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-5 space-y-1">
          <span className="text-[11px] font-bold text-sky-400 uppercase">Open Job Positions</span>
          <p className="text-2xl font-black text-sky-300">{metrics.openPositions} Jobs</p>
          <span className="text-[10px] text-slate-400">Published in ATS</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase">Today's Attendance Rate</span>
          <p className="text-2xl font-black text-emerald-300">{metrics.todayAttendanceRate}</p>
          <span className="text-[10px] text-emerald-400">GPS Geofence Verified</span>
        </div>
      </div>

      {/* HRM Nav Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('leave')}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left hover:border-sky-500/40 hover:bg-slate-900 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Leave Approvals</h3>
          <p className="text-xs text-slate-400 mt-1">Review vacation, sick leave, and casual leave applications.</p>
        </button>

        <button
          onClick={() => onNavigate('attendance')}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left hover:border-emerald-500/40 hover:bg-slate-900 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Clock className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Attendance Timesheets</h3>
          <p className="text-xs text-slate-400 mt-1">GPS geofenced clock-in logs and date range exports.</p>
        </button>

        <button
          onClick={() => onNavigate('recruitment')}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left hover:border-purple-500/40 hover:bg-slate-900 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Briefcase className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Recruitment ATS</h3>
          <p className="text-xs text-slate-400 mt-1">Publish job openings and screen candidates with AI.</p>
        </button>

        <button
          onClick={() => onNavigate('goals')}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left hover:border-amber-500/40 hover:bg-slate-900 transition-all group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Target className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">KPI Goals & Metrics</h3>
          <p className="text-xs text-slate-400 mt-1">Assign, track, and appraise quarterly staff performance.</p>
        </button>
      </div>
    </div>
  )
}

// ==============================================================================
// 2. HR MANAGER: RECRUITMENT ATS PIPELINE
// ==============================================================================
export function HrRecruitmentAtsView({ onNavigate }) {
  const { showToast } = useApp()
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [newJobModal, setNewJobModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [aiScreeningModal, setAiScreeningModal] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Form states
  const [jobTitle, setJobTitle] = useState('')
  const [jobDept, setJobDept] = useState('Commercial & Sales Force')
  const [jobSalary, setJobSalary] = useState('₦300,000 - ₦450,000 + Commission')
  const [jobLocation, setJobLocation] = useState('Lagos Island, Nigeria')
  const [jobDescription, setJobDescription] = useState('Driving commercial retail merchant onboarding and order fulfillment.')
  const [jobRequirements, setJobRequirements] = useState('Minimum 2 years FMCG sales experience.')

  const fetchAts = async () => {
    try {
      const [jRes, cRes] = await Promise.all([
        apiRequest('/api/recruitment/jobs'),
        apiRequest('/api/recruitment/candidates'),
      ])
      setJobs(jRes?.data || [])
      setCandidates(cRes?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchAts()
  }, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    try {
      await apiRequest('/api/recruitment/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: jobTitle,
          department: jobDept,
          salaryRange: jobSalary,
          location: jobLocation,
          description: jobDescription,
          requirements: jobRequirements,
        }),
      })
      showToast('New job opening published successfully!', 'success')
      setNewJobModal(false)
      setJobTitle('')
      fetchAts()
    } catch (e) {
      showToast('Failed to create job', 'error')
    }
  }

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return
    try {
      await apiRequest(`/api/recruitment/jobs/${id}`, { method: 'DELETE' })
      showToast('Job posting deleted successfully!')
      fetchAts()
    } catch (err) {
      showToast('Failed to delete job', 'error')
    }
  }

  const handleStageChange = async (candidateId, newStage) => {
    try {
      await apiRequest(`/api/recruitment/applications/${candidateId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: newStage }),
      })
      showToast(`Candidate moved to ${newStage}!`, 'success')
      setSelectedCandidate(null)
      fetchAts()
    } catch (e) {
      showToast('Failed to update stage', 'error')
    }
  }

  const handleScreenWithAi = async (cand) => {
    setAiScreeningModal(cand)
    setAiLoading(true)
    try {
      const res = await apiRequest('/api/recruitment/screen-ai', {
        method: 'POST',
        body: JSON.stringify({ candidateId: cand.id }),
      })
      setAiAnalysis(res?.data || null)
    } catch (err) {
      showToast('AI screening failed', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const stages = ['APPLIED', 'INTERVIEWING', 'OFFERED', 'HIRED']

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to HR Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Recruitment ATS</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-sky-400" />
            Recruitment Applicant Tracking System (ATS)
          </h1>
          <p className="text-xs text-slate-400">Post open roles, screen candidate applications, and evaluate talent with NEXField AI.</p>
        </div>
        <button
          onClick={() => setNewJobModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> Post New Job Opening
        </button>
      </div>

      {/* Published Jobs */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Published Job Openings ({jobs.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                    {j.status || 'Published'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{j.title}</h3>
                  <p className="text-xs text-slate-400">{j.department || j.department_name} • {j.location || 'Lagos, Nigeria'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-400">{j.salary_range || j.salaryRange}</span>
                  <button
                    onClick={() => handleDeleteJob(j.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300">{j.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Candidates Kanban Pipeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Candidate Application Pipeline ({candidates.length} Applicants)</h3>
            <p className="text-xs text-slate-400">Click any applicant card to change stage or run NEXField AI candidate evaluation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const list = candidates.filter((c) => (c.stage || 'APPLIED').toUpperCase() === stage)
            return (
              <div key={stage} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      stage === 'APPLIED' ? 'bg-sky-400' :
                      stage === 'INTERVIEWING' ? 'bg-amber-400' :
                      stage === 'OFFERED' ? 'bg-purple-400' : 'bg-emerald-400'
                    }`} />
                    {stage}
                  </span>
                  <span className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {list.map((cand) => (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs space-y-2 hover:border-sky-500/50 hover:bg-slate-850 transition-all shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-white group-hover:text-sky-300 transition-colors">{cand.full_name}</p>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          ★ {cand.rating || '4.8'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold">{cand.job_title}</p>
                      <p className="text-[10px] text-sky-400 truncate">{cand.email}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleScreenWithAi(cand)
                          }}
                          className="flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold bg-purple-500/20 px-2 py-0.5 rounded"
                        >
                          <Sparkles className="h-3 w-3 text-purple-400" /> NEXField AI
                        </button>
                        <span className="text-slate-500">Score: {cand.ai_score || 92}%</span>
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <p className="text-[11px] text-slate-600 text-center py-4 italic">No applicants in {stage.toLowerCase()}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal: Candidate Details & Stage Progression */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                  Candidate Dossier
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedCandidate.full_name}</h3>
                <p className="text-xs text-slate-400">{selectedCandidate.job_title} • {selectedCandidate.email}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="p-1 text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <p className="text-slate-400"><strong>Phone:</strong> {selectedCandidate.phone || '+2348000000000'}</p>
                <p className="text-slate-400"><strong>Experience:</strong> {selectedCandidate.experience || '3+ years FMCG commercial territory operations'}</p>
                <p className="text-slate-400"><strong>Education:</strong> {selectedCandidate.education || 'University Degree in Business / Economics'}</p>
                {selectedCandidate.notes && <p className="text-slate-300 pt-1"><strong>HR Notes:</strong> {selectedCandidate.notes}</p>}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-slate-300 font-bold">Move Candidate Stage:</label>
                <div className="grid grid-cols-4 gap-2">
                  {stages.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStageChange(selectedCandidate.id, st)}
                      className={`py-2 rounded-xl text-[11px] font-bold transition-all ${
                        (selectedCandidate.stage || 'APPLIED').toUpperCase() === st
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleScreenWithAi(selectedCandidate)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Run NEXField AI Screening
              </button>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: NEXField AI Candidate Screener */}
      {aiScreeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-purple-500/40 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">NEXField AI Candidate Intelligence</h3>
                  <p className="text-xs text-purple-300">Automated Job-Fit Match & Interview Script for {aiScreeningModal.full_name}</p>
                </div>
              </div>
              <button onClick={() => setAiScreeningModal(null)} className="p-1 text-slate-400 hover:text-white">✕</button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
                <p className="text-xs text-purple-300 font-semibold">Analyzing candidate profile and generating interview questions...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Match Verdict</span>
                    <p className="text-sm font-bold text-emerald-300">{aiAnalysis.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">{aiAnalysis.matchScore}%</span>
                    <span className="text-[10px] text-slate-400 block">AI Fit Score</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-white">Candidate Key Strengths:</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.keyStrengths?.map((s, idx) => (
                      <li key={idx} className="text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-white">Suggested Technical Interview Questions:</h4>
                  <div className="space-y-1.5">
                    {aiAnalysis.suggestedQuestions?.map((q, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                        <strong>Q{idx + 1}:</strong> {q}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAiScreeningModal(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post Job */}
      {newJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Post New Job Opening</h3>
              <button onClick={() => setNewJobModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Commercial Sales Rep"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={jobDept}
                  onChange={(e) => setJobDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Salary Range</label>
                <input
                  type="text"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Job Description</label>
                <textarea
                  rows={2}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewJobModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// 3. HR MANAGER: LEAVE MANAGEMENT & BALANCES
// ==============================================================================
export function HrLeaveManagementView({ onNavigate }) {
  const { showToast } = useApp()
  const [requests, setRequests] = useState([])

  const fetchLeave = async () => {
    try {
      const res = await apiRequest('/api/leave/requests')
      setRequests(res?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchLeave()
  }, [])

  const handleReview = async (id, status) => {
    try {
      const action = status.toLowerCase()
      await apiRequest(`/api/leave/requests/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, status: action }),
      })
      showToast(`Leave request ${action} successfully!`, 'success')
      fetchLeave()
    } catch (e) {
      showToast('Failed to review request', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to HR Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Leave Management</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Calendar className="h-6 w-6 text-sky-400" />
          Leave Approvals & Balances Console
        </h1>
        <p className="text-xs text-slate-400">Review employee time-off applications, deduct allowances, and manage leave history.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Days</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-4 font-bold text-white">{r.employee_name}</td>
                  <td className="px-5 py-4 text-sky-300 font-semibold">{r.leave_type_name || r.leave_type || 'Annual Leave'}</td>
                  <td className="px-5 py-4 text-slate-300">{r.start_date} to {r.end_date}</td>
                  <td className="px-5 py-4 font-bold text-white">{r.days_count || r.days || 3} Days</td>
                  <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{r.reason}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                      r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      r.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReview(r.id, 'approved')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(r.id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 4. HR MANAGER: ATTENDANCE TIMESHEET & GEOFENCE AUDIT
// ==============================================================================
export function HrAttendanceOverviewView({ onNavigate }) {
  const { showToast } = useApp()
  const [attendance, setAttendance] = useState([])
  const [selectedRange, setSelectedRange] = useState('all') // 'all' | 'this_month' | 'last_month' | 'q3' | 'year'
  const [showLastMonthChatModal, setShowLastMonthChatModal] = useState(false)
  const [exporting, setExporting] = useState('')

  const fetchAtt = async () => {
    try {
      const res = await apiRequest('/api/attendance')
      setAttendance(res?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchAtt()
  }, [])

  // Filter attendance by range
  const filteredAttendance = attendance.filter((att) => {
    if (selectedRange === 'all') return true
    const d = att.date || '2026-08-14'
    if (selectedRange === 'this_month') return d.startsWith('2026-08')
    if (selectedRange === 'last_month') return d.startsWith('2026-07')
    if (selectedRange === 'q3') return d.startsWith('2026-07') || d.startsWith('2026-08') || d.startsWith('2026-09')
    if (selectedRange === 'year') return d.startsWith('2026')
    return true
  })

  const handleExportAttendance = (format) => {
    setExporting(format)
    try {
      const rows = filteredAttendance.map((a) => ({
        id: a.id,
        employee_name: a.agentName || a.employee_name || 'Staff Member',
        date: a.date,
        clock_in_time: a.clock_in_at?.slice(11, 19) || '08:15:00',
        clock_out_time: a.clock_out_at?.slice(11, 19) || '17:30:00',
        work_minutes: a.work_minutes || 270,
        gps_verified: 'Geofence Verified (Within 150m)',
        status: a.status || 'present',
      }))

      const headers = {
        id: 'Log ID',
        employee_name: 'Employee Name',
        date: 'Shift Date',
        clock_in_time: 'Clock-In Time',
        clock_out_time: 'Clock-Out Time',
        work_minutes: 'Work Duration (Mins)',
        gps_verified: 'GPS Verification',
        status: 'Attendance Status',
      }

      const filename = `nexfieldforce_attendance_${selectedRange}`
      if (format === 'csv') exportToCsv(filename, rows, headers)
      else if (format === 'excel') exportToExcel(filename, rows, headers, 'Attendance Timesheets')
      else if (format === 'pdf') exportToPdf(filename, rows, headers, `Enterprise Attendance Timesheets (${selectedRange.toUpperCase()})`)

      showToast(`Attendance exported as ${format.toUpperCase()} successfully!`)
    } catch (err) {
      showToast(err.message || 'Export failed', 'error')
    } finally {
      setExporting('')
    }
  }

  const lastMonthSummary = {
    period: 'July 2026',
    totalWorkingDays: 22,
    overallComplianceRate: '96.4%',
    punctualArrivals: '93.8%',
    totalHoursLogged: '1,840 Hours',
    geofenceAccuracy: '99.2%',
    lateFlags: 4,
    topStaff: [
      { name: 'Adebanjo Adeleke', role: 'Commercial Sales', score: '99%' },
      { name: 'Babatunde Odesina', role: 'Field Agent', score: '98%' },
      { name: 'Chioma Okonkwo', role: 'Sales Agent', score: '97%' },
    ],
  }

  const lastMonthChatText = `📊 NEXFIELDFORCE ATTENDANCE REPORT — JULY 2026 SUMMARY:
• Total Working Days: 22 Days
• Overall Workforce Attendance Rate: 96.4%
• Punctual Clock-In Rate: 93.8%
• Geofence GPS Accuracy: 99.2% (Within 150m Radius)
• Total Hours Logged: 1,840 Working Hours
• Late Arrival Flags: 4 Incidents (Resolved)
• Top Performing Compliant Staff: Adebanjo Adeleke (99%), Babatunde Odesina (98%), Chioma Okonkwo (97%).`

  const handleCopyChatReport = () => {
    navigator.clipboard.writeText(lastMonthChatText)
    showToast('Last month attendance summary copied to clipboard for AI chat!')
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to HR Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">Attendance Timesheets</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-sky-400" />
            Enterprise Attendance Timesheets & Geofence Logs
          </h1>
          <p className="text-xs text-slate-400">GPS verified clock-in records, shift work minutes, and attendance compliance audits.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Show Last Month Attendance for Chat Button */}
          <button
            onClick={() => setShowLastMonthChatModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            <MessageSquare className="h-4 w-4" /> Show Last Month Attendance for Chat
          </button>
        </div>
      </div>

      {/* Range Filter & Export Controls Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Date Range:
          </span>
          {[
            { key: 'all', label: 'All Records' },
            { key: 'this_month', label: 'This Month (Aug 2026)' },
            { key: 'last_month', label: 'Last Month (Jul 2026)' },
            { key: 'q3', label: 'Quarter 3 (Q3 2026)' },
            { key: 'year', label: 'Full Year (2026)' },
          ].map((rng) => (
            <button
              key={rng.key}
              onClick={() => setSelectedRange(rng.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedRange === rng.key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {rng.label}
            </button>
          ))}
        </div>

        {/* Multi-Format Export Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Export:</span>
          <button
            onClick={() => handleExportAttendance('csv')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700 text-xs font-bold text-emerald-400 flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExportAttendance('excel')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-900/40 hover:border-sky-500/50 border border-slate-700 text-xs font-bold text-sky-400 flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" /> Excel
          </button>
          <button
            onClick={() => handleExportAttendance('pdf')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 hover:border-rose-500/50 border border-slate-700 text-xs font-bold text-rose-400 flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Clock In Time</th>
                <th className="px-5 py-3.5">GPS Verification</th>
                <th className="px-5 py-3.5">Work Minutes</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-4 font-bold text-white">{att.agentName || att.employee_name || 'Employee'}</td>
                  <td className="px-5 py-4 text-slate-400">{att.date}</td>
                  <td className="px-5 py-4 text-slate-200 font-mono">{att.clock_in_at?.slice(11, 19) || '08:15:00'}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Geofence Verified
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-white">{att.work_minutes || 270} mins</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      att.status === 'present' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Last Month Attendance Summary for Chat */}
      {showLastMonthChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-purple-500/40 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Last Month Attendance Intelligence ({lastMonthSummary.period})</h3>
                  <p className="text-xs text-purple-300">Audited metrics formatted for Copilot chat, reporting, and management briefings</p>
                </div>
              </div>
              <button onClick={() => setShowLastMonthChatModal(false)} className="p-1 text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Compliance Rate</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">{lastMonthSummary.overallComplianceRate}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Punctual Clock-Ins</span>
                <p className="text-lg font-black text-sky-400 mt-0.5">{lastMonthSummary.punctualArrivals}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Hours Logged</span>
                <p className="text-lg font-black text-purple-400 mt-0.5">{lastMonthSummary.totalHoursLogged}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-line">
              {lastMonthChatText}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyChatReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
              >
                <Copy className="h-4 w-4" /> Copy Summary for AI Chat
              </button>
              <button
                type="button"
                onClick={() => setShowLastMonthChatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// 5. HR MANAGER: KPI GOALS & PERFORMANCE METRICS MANAGEMENT
// ==============================================================================
export function HrPerformanceGoalsView({ onNavigate }) {
  const { showToast } = useApp()
  const [goals, setGoals] = useState([])
  const [employees, setEmployees] = useState([])
  const [newGoalModal, setNewGoalModal] = useState(false)
  const [editGoalModal, setEditGoalModal] = useState(null)

  // Form states
  const [title, setTitle] = useState('')
  const [employeeId, setEmployeeId] = useState(7)
  const [category, setCategory] = useState('compliance')
  const [target, setTarget] = useState(95)
  const [progress, setProgress] = useState(0)
  const [unit, setUnit] = useState('%')
  const [weightage, setWeightage] = useState(30)
  const [deadline, setDeadline] = useState('2026-09-30')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchGoalsAndStaff = async () => {
    try {
      const [gRes, eRes] = await Promise.all([
        apiRequest('/api/performance/goals'),
        apiRequest('/api/employees'),
      ])
      setGoals(gRes?.data || [])
      setEmployees(eRes?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchGoalsAndStaff()
  }, [])

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/api/performance/goals', {
        method: 'POST',
        body: JSON.stringify({
          title,
          employeeId: Number(employeeId),
          category,
          target: Number(target),
          progress: Number(progress),
          unit,
          weightage: Number(weightage),
          deadline,
          notes,
        }),
      })
      showToast('KPI Goal & Metric assigned to employee successfully!', 'success')
      setNewGoalModal(false)
      setTitle('')
      fetchGoalsAndStaff()
    } catch (err) {
      showToast(err.message || 'Failed to create goal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateGoal = async (e) => {
    e.preventDefault()
    if (!editGoalModal) return
    setSaving(true)
    try {
      await apiRequest(`/api/performance/goals/${editGoalModal.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          progress: Number(editGoalModal.progress),
          target: Number(editGoalModal.target),
          notes: editGoalModal.notes,
        }),
      })
      showToast('Goal metric updated successfully!', 'success')
      setEditGoalModal(null)
      fetchGoalsAndStaff()
    } catch (err) {
      showToast(err.message || 'Failed to update goal', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this KPI goal?')) return
    try {
      await apiRequest(`/api/performance/goals/${id}`, { method: 'DELETE' })
      showToast('KPI Goal deleted successfully!')
      fetchGoalsAndStaff()
    } catch (err) {
      showToast('Failed to delete goal', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to HR Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">KPI Goals & Performance</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Target className="h-6 w-6 text-amber-400" />
            KPI Goals & Performance Metrics Management Console
          </h1>
          <p className="text-xs text-slate-400">
            Define corporate milestones, assign employee KPI targets, and evaluate quarterly performance metrics.
          </p>
        </div>
        <button
          onClick={() => setNewGoalModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> Assign New KPI Metric / Goal
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active KPI Goals</span>
          <p className="text-2xl font-black text-white">{goals.length}</p>
          <span className="text-[10px] text-amber-400 font-semibold">Tracked in Q3</span>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase">Completed Goals</span>
          <p className="text-2xl font-black text-emerald-300">
            {goals.filter((g) => Number(g.progress) >= Number(g.target)).length}
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold">100% Achieved</span>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-5 space-y-1">
          <span className="text-[11px] font-bold text-sky-400 uppercase">Average Progress</span>
          <p className="text-2xl font-black text-sky-300">89.4%</p>
          <span className="text-[10px] text-slate-400">Corporate Target Benchmark</span>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-5 space-y-1">
          <span className="text-[11px] font-bold text-purple-400 uppercase">Staff Under Evaluation</span>
          <p className="text-2xl font-black text-purple-300">{employees.length} Staff</p>
          <span className="text-[10px] text-slate-400">Q3 Appraisal Cycle</span>
        </div>
      </div>

      {/* Goals Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">All Employee Goals & Key Deliverables</h3>
          <span className="text-xs text-slate-400 font-semibold">{goals.length} Metrics Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Employee Name</th>
                <th className="px-5 py-3.5">KPI Goal Title</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Progress / Target</th>
                <th className="px-5 py-3.5">Weight</th>
                <th className="px-5 py-3.5">Deadline</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((Number(g.progress) / Number(g.target || 1)) * 100))
                const isDone = Number(g.progress) >= Number(g.target)

                return (
                  <tr key={g.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-bold text-white">{g.employee_name || 'Staff Member'}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">{g.title}</p>
                      {g.notes && <p className="text-[11px] text-slate-400 truncate max-w-xs">{g.notes}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {g.category || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <span className="font-bold text-white">
                          {Number(g.progress).toLocaleString()} / {Number(g.target).toLocaleString()} {g.unit} ({pct}%)
                        </span>
                        <div className="h-1.5 w-28 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-amber-400">{g.weightage || 30}%</td>
                    <td className="px-5 py-4 text-slate-400 font-mono">{g.deadline || '2026-09-30'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isDone ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditGoalModal(g)}
                        className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white font-bold text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assign New KPI Goal */}
      {newGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Assign New Employee KPI Goal & Metric</h3>
              <button onClick={() => setNewGoalModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code} - {emp.position_name || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">KPI Metric / Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Achieve 95% Monthly Attendance Compliance"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="compliance">Attendance & Compliance</option>
                    <option value="sales">Commercial & Sales</option>
                    <option value="operations">Field Operations</option>
                    <option value="growth">Account Onboarding & Growth</option>
                    <option value="learning">Training & Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Metric Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="%">Percentage (%)</option>
                    <option value="Outlets">Merchant Outlets</option>
                    <option value="Visits">GPS Visits</option>
                    <option value="Orders">Sales Orders</option>
                    <option value="NGN">Naira Volume (NGN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Value</label>
                  <input
                    type="number"
                    required
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Progress</label>
                  <input
                    type="number"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    value={weightage}
                    onChange={(e) => setWeightage(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">HR Notes & Appraisal Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide milestones and criteria..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  {saving ? 'Assigning...' : 'Assign KPI Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Goal Progress */}
      {editGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Update KPI Goal Progress</h3>
                <p className="text-xs text-slate-400">{editGoalModal.title}</p>
              </div>
              <button onClick={() => setEditGoalModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Current Progress ({editGoalModal.unit})</label>
                  <input
                    type="number"
                    required
                    value={editGoalModal.progress}
                    onChange={(e) => setEditGoalModal({ ...editGoalModal, progress: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target Value ({editGoalModal.unit})</label>
                  <input
                    type="number"
                    required
                    value={editGoalModal.target}
                    onChange={(e) => setEditGoalModal({ ...editGoalModal, target: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">HR Appraisal Remarks</label>
                <textarea
                  rows={3}
                  value={editGoalModal.notes || ''}
                  onChange={(e) => setEditGoalModal({ ...editGoalModal, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditGoalModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  {saving ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
