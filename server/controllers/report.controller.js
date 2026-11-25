import { memoryStore } from '../config/db.js'

export const getHeadcountReport = async (req, res) => {
  return res.json({
    success: true,
    data: {
      byDepartment: [
        { department: 'Commercial & Sales', headcount: 5 },
        { department: 'Field Operations', headcount: 4 },
        { department: 'Technology & IT', headcount: 2 },
        { department: 'Human Resources', headcount: 1 },
      ],
      byEmploymentType: [
        { employment_type: 'full_time', headcount: 10 },
        { employment_type: 'contract', headcount: 2 },
      ],
      byGender: [
        { gender: 'male', headcount: 7 },
        { gender: 'female', headcount: 5 },
      ],
    },
  })
}

export const getAttendanceReport = async (req, res) => {
  return res.json({ success: true, data: [] })
}
