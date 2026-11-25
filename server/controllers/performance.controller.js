import { memoryStore } from '../config/db.js'

export const listGoals = async (req, res) => {
  try {
    if (!Array.isArray(memoryStore.goals) || memoryStore.goals.length === 0) {
      memoryStore.goals = [
        {
          id: 1,
          employee_id: 7,
          title: 'Achieve 95% Monthly Attendance Compliance',
          category: 'compliance',
          progress: 92,
          target: 95,
          unit: '%',
          weightage: 30,
          deadline: '2026-09-30',
          status: 'in_progress',
          notes: 'Clocking in regularly with GPS verification',
        },
        {
          id: 2,
          employee_id: 7,
          title: 'Complete Q3 Field Compliance Certification',
          category: 'learning',
          progress: 100,
          target: 100,
          unit: '%',
          weightage: 30,
          deadline: '2026-09-30',
          status: 'completed',
          notes: 'Assessment passed with 100% score',
        },
        {
          id: 3,
          employee_id: 7,
          title: 'Onboard 15 New Merchant Accounts',
          category: 'growth',
          progress: 12,
          target: 15,
          unit: 'Outlets',
          weightage: 40,
          deadline: '2026-09-30',
          status: 'in_progress',
          notes: '12 Tier-1 retail merchants onboarded in Lagos Island',
        },
        {
          id: 4,
          employee_id: 4,
          title: 'Achieve ₦10,000,000 Monthly Sales Target',
          category: 'sales',
          progress: 8900000,
          target: 10000000,
          unit: 'NGN',
          weightage: 50,
          deadline: '2026-08-31',
          status: 'in_progress',
          notes: '89% achieved as of week 3',
        },
        {
          id: 5,
          employee_id: 5,
          title: 'Complete 120 Route GPS Visits',
          category: 'operations',
          progress: 95,
          target: 120,
          unit: 'Visits',
          weightage: 40,
          deadline: '2026-08-31',
          status: 'in_progress',
          notes: 'Active daily territory coverage',
        },
      ]
    }

    const { employeeId } = req.query || {}
    let list = memoryStore.goals

    if (employeeId) {
      list = list.filter((g) => Number(g.employee_id) === Number(employeeId))
    }

    const emps = Array.isArray(memoryStore.employees) ? memoryStore.employees : []
    const depts = Array.isArray(memoryStore.departments) ? memoryStore.departments : []

    const enriched = list.map((g) => {
      const emp = emps.find((e) => Number(e.id) === Number(g.employee_id)) || {}
      const dept = depts.find((d) => Number(d.id) === Number(emp.department_id)) || {}
      return {
        ...g,
        employee_name: g.employee_name || `${emp.first_name || 'Staff'} ${emp.last_name || 'Member'}`.trim(),
        department_name: dept.name || 'Operations & Administration',
      }
    })

    return res.json({ success: true, data: enriched })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to list goals' })
  }
}

export const createGoal = async (req, res) => {
  try {
    const {
      title,
      employeeId = 7,
      employeeName,
      category = 'performance',
      target = 100,
      progress = 0,
      unit = '%',
      weightage = 20,
      deadline = '2026-09-30',
      notes = '',
    } = req.body || {}

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Goal title is required' })
    }

    if (!Array.isArray(memoryStore.goals)) memoryStore.goals = []

    const emp = (memoryStore.employees || []).find((e) => Number(e.id) === Number(employeeId))
    const assignedName = employeeName || (emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Member')

    const newGoal = {
      id: memoryStore.goals.length + 1,
      company_id: req.authUser?.companyId || 1,
      employee_id: Number(employeeId),
      employee_name: assignedName,
      title: title.trim(),
      category: category.toLowerCase(),
      target: Number(target) || 100,
      progress: Number(progress) || 0,
      unit: unit || '%',
      weightage: Number(weightage) || 20,
      deadline: deadline || '2026-09-30',
      status: Number(progress) >= Number(target) ? 'completed' : 'in_progress',
      notes: notes || 'Assigned by HR Department',
      created_at: new Date().toISOString(),
    }

    memoryStore.goals.push(newGoal)
    return res.status(201).json({ success: true, message: 'KPI Goal assigned successfully', data: newGoal })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create goal' })
  }
}

export const updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params
    const { progress, notes, status, target } = req.body || {}

    if (!Array.isArray(memoryStore.goals)) memoryStore.goals = []
    const goal = memoryStore.goals.find((g) => String(g.id) === String(id))

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' })

    if (progress !== undefined) goal.progress = Number(progress)
    if (target !== undefined) goal.target = Number(target)
    if (notes !== undefined) goal.notes = notes
    if (status !== undefined) goal.status = status
    else if (goal.progress >= goal.target) goal.status = 'completed'

    goal.updated_at = new Date().toISOString()

    return res.json({ success: true, message: 'Goal progress updated successfully', data: goal })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to update goal' })
  }
}

export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params
    if (!Array.isArray(memoryStore.goals)) memoryStore.goals = []
    const idx = memoryStore.goals.findIndex((g) => String(g.id) === String(id))
    if (idx !== -1) {
      memoryStore.goals.splice(idx, 1)
      return res.json({ success: true, message: 'Goal deleted successfully' })
    }
    return res.status(404).json({ success: false, message: 'Goal not found' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const listReviews = async (_req, res) => {
  return res.json({
    success: true,
    data: [
      { id: 1, employee_name: 'Tariq Al-Mansoor', period: 'Q2 2026', overall_rating: '4.8 / 5.0 (Exceeds Expectations)', reviewer: 'HR Manager Ngozi Eze', date: '2026-06-30' },
      { id: 2, employee_name: 'Adebanjo Adeleke', period: 'Q2 2026', overall_rating: '4.6 / 5.0 (Exceeds Expectations)', reviewer: 'Supervisor Folake Johnson', date: '2026-06-30' },
    ],
  })
}
