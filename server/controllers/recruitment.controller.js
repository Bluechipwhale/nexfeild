import { memoryStore } from '../config/db.js'

export const listJobs = async (req, res) => {
  try {
    if (!Array.isArray(memoryStore.job_postings) || memoryStore.job_postings.length === 0) {
      memoryStore.job_postings = [
        {
          id: 1,
          company_id: 1,
          title: 'Field Sales Representative (Lagos Island)',
          department_id: 4,
          employment_type: 'Full-time',
          location: 'Lagos Island, Nigeria',
          salary_range: '₦300,000 - ₦450,000 + Commission',
          description: 'Driving commercial retail merchant onboarding and order fulfillment.',
          requirements: 'Experience in FMCG distribution and key retail account management.',
          status: 'published',
          candidate_count: 2,
          created_at: '2026-08-10T09:00:00Z',
        },
        {
          id: 2,
          company_id: 1,
          title: 'Field Logistics Operations Officer',
          department_id: 3,
          employment_type: 'Full-time',
          location: 'Yaba / Mainland, Lagos',
          salary_range: '₦280,000 - ₦380,000',
          description: 'Coordinating territory routes and field check-in compliance.',
          requirements: 'Experience in route dispatch and mobile workforce tracking.',
          status: 'published',
          candidate_count: 1,
          created_at: '2026-08-12T11:00:00Z',
        },
      ]
    }

    const depts = Array.isArray(memoryStore.departments) ? memoryStore.departments : []
    const jobs = memoryStore.job_postings.map((j) => {
      const dept = depts.find((d) => d.id === j.department_id)
      return {
        ...j,
        department: j.department || dept?.name || 'Commercial & Sales Force',
        department_name: dept?.name || 'Commercial & Sales Force',
      }
    })
    return res.json({ success: true, data: jobs })
  } catch (err) {
    return res.json({ success: true, data: [] })
  }
}

export const createJob = async (req, res) => {
  try {
    const {
      title,
      departmentId = 4,
      department = 'Commercial & Sales Force',
      employmentType = 'Full-time',
      location = 'Lagos, Nigeria',
      salaryRange = '₦300,000 - ₦450,000',
      description,
      requirements,
    } = req.body || {}

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Job title is required' })
    }

    if (!Array.isArray(memoryStore.job_postings)) {
      memoryStore.job_postings = []
    }

    const newJob = {
      id: memoryStore.job_postings.length + 1,
      company_id: req.authUser?.companyId || 1,
      title: title.trim(),
      department_id: Number(departmentId),
      department: department || 'Commercial & Sales Force',
      employment_type: employmentType,
      location: location || 'Lagos, Nigeria',
      salary_range: salaryRange || '₦300,000 - ₦450,000',
      description: description || 'Driving commercial retail merchant onboarding and order fulfillment.',
      requirements: requirements || 'Strong commercial communication and FMCG market knowledge.',
      status: 'published',
      candidate_count: 0,
      created_at: new Date().toISOString(),
    }

    memoryStore.job_postings.unshift(newJob)
    return res.status(201).json({ success: true, message: 'Job opening published successfully', data: newJob })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create job' })
  }
}

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params
    if (!Array.isArray(memoryStore.job_postings)) memoryStore.job_postings = []
    const idx = memoryStore.job_postings.findIndex((j) => String(j.id) === String(id))
    if (idx !== -1) {
      memoryStore.job_postings.splice(idx, 1)
      return res.json({ success: true, message: 'Job posting deleted' })
    }
    return res.status(404).json({ success: false, message: 'Job not found' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const listCandidates = async (req, res) => {
  if (!Array.isArray(memoryStore.candidates) || memoryStore.candidates.length === 0) {
    memoryStore.candidates = [
      {
        id: 1,
        company_id: 1,
        full_name: 'Chinedu Eze',
        email: 'chinedu.eze@example.com',
        phone: '+2348099887766',
        job_title: 'Field Sales Representative',
        stage: 'INTERVIEWING',
        experience: '4 years FMCG sales, 120 retail outlets managed in Lagos Island',
        education: 'B.Sc. Economics (University of Lagos)',
        rating: 4.8,
        ai_score: 94,
        notes: 'Demonstrated exceptional understanding of wholesale credit terms.',
      },
      {
        id: 2,
        company_id: 1,
        full_name: 'Blessing Okafor',
        email: 'blessing.o@example.com',
        phone: '+2348088776655',
        job_title: 'Field Logistics Officer',
        stage: 'APPLIED',
        experience: '3 years fleet coordination and dispatch logistics',
        education: 'HND Business Admin (Yaba Tech)',
        rating: 4.5,
        ai_score: 88,
        notes: 'Proficient with GPS routing software and mobile tracking apps.',
      },
    ]
  }
  return res.json({ success: true, data: memoryStore.candidates })
}

export const createCandidate = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      jobTitle = 'Field Sales Representative',
      experience = '3+ years commercial field operations',
      education = 'University Graduate',
      notes = '',
    } = req.body || {}

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Candidate name is required' })
    }
    if (!Array.isArray(memoryStore.candidates)) memoryStore.candidates = []

    const newCand = {
      id: memoryStore.candidates.length + 1,
      company_id: req.authUser?.companyId || 1,
      full_name: fullName.trim(),
      email: email ? email.trim() : `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: phone ? phone.trim() : '+2348000000000',
      job_title: jobTitle,
      stage: 'APPLIED',
      experience,
      education,
      rating: 4.5,
      ai_score: 90,
      notes: notes || 'Applied via Careers Portal',
      created_at: new Date().toISOString(),
    }

    memoryStore.candidates.push(newCand)
    return res.status(201).json({ success: true, message: 'Candidate application added', data: newCand })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to add candidate' })
  }
}

export const updateApplicationStage = async (req, res) => {
  try {
    const { id } = req.params
    const { stage, notes } = req.body || {}
    if (!Array.isArray(memoryStore.candidates)) memoryStore.candidates = []
    if (!Array.isArray(memoryStore.employees)) memoryStore.employees = []
    if (!Array.isArray(memoryStore.employee_onboarding)) memoryStore.employee_onboarding = []

    const cand = memoryStore.candidates.find((c) => String(c.id) === String(id))
    if (!cand) return res.status(404).json({ success: false, message: 'Candidate not found' })

    cand.stage = stage.toUpperCase()
    if (notes) cand.notes = notes

    if (stage.toUpperCase() === 'HIRED') {
      const newEmpId = memoryStore.employees.length + 1
      memoryStore.employees.push({
        id: newEmpId,
        company_id: 1,
        user_id: Date.now(),
        employee_code: `NEX-${String(newEmpId).padStart(4, '0')}`,
        first_name: cand.full_name.split(' ')[0],
        last_name: cand.full_name.split(' ').slice(1).join(' ') || 'Hired Staff',
        phone: cand.phone,
        department_id: 4,
        position_id: 4,
        employment_type: 'full_time',
        employment_status: 'active',
        hire_date: new Date().toISOString().slice(0, 10),
      })
      memoryStore.employee_onboarding.push({
        id: memoryStore.employee_onboarding.length + 1,
        company_id: 1,
        employee_id: newEmpId,
        progress_percent: 0,
        status: 'in_progress',
      })
    }

    return res.json({ success: true, message: `Candidate moved to ${stage.toUpperCase()}`, data: cand })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to update stage' })
  }
}

export const screenCandidateWithAI = async (req, res) => {
  try {
    const { candidateId } = req.body || {}
    const cand = (memoryStore.candidates || []).find((c) => String(c.id) === String(candidateId)) || {}

    const analysis = {
      candidateName: cand.full_name || 'Candidate',
      targetRole: cand.job_title || 'Field Sales Representative',
      matchScore: cand.ai_score || 92,
      recommendation: 'STRONG CANDIDATE — PROCEED TO FINAL OFFER',
      keyStrengths: [
        'Demonstrated track record in retail merchant key account expansion',
        'Familiar with FMCG route-to-market and POS payment reconciliations',
        'Strong communication skills with native fluency in regional commercial hubs',
      ],
      potentialGaps: ['Requires onboarding on NexFieldForce GPS geofence automation tools'],
      suggestedQuestions: [
        'How do you manage disputes regarding credit payment cycles with wholesale merchants?',
        'Describe a situation where you exceeded your quarterly FMCG route distribution targets.',
        'How do you plan daily travel itineraries to maximize merchant audit frequency?',
      ],
    }

    return res.json({ success: true, data: analysis })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
