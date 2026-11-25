import { memoryStore } from '../config/db.js'

export const listDocuments = async (req, res) => {
  const list = memoryStore.employee_documents.map((d) => {
    const emp = memoryStore.employees.find((e) => e.id === d.employee_id) || {}
    return {
      ...d,
      employee_name: `${emp.first_name || 'Staff'} ${emp.last_name || 'Member'}`,
    }
  })
  return res.json({ success: true, data: list })
}

export const createDocument = async (req, res) => {
  const { title = 'Document' } = req.body || {}
  const doc = {
    id: memoryStore.employee_documents.length + 1,
    employee_id: 2,
    title,
    document_type_name: 'Compliance',
    expiry_date: '2027-01-01',
  }
  memoryStore.employee_documents.push(doc)
  return res.status(201).json({ success: true, message: 'Document registered', id: doc.id })
}

export const getExpiringDocuments = async (req, res) => {
  return res.json({ success: true, data: memoryStore.employee_documents })
}
