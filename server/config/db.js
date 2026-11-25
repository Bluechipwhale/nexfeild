import mysql from 'mysql2/promise'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../../')

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

export const HAS_MYSQL = Boolean(process.env.DB_USER && process.env.DB_NAME)

let dbPool = null
if (HAS_MYSQL) {
  try {
    dbPool = mysql.createPool(DB_CONFIG)
  } catch (err) {
    console.warn('[MySQL Pool Notice]:', err.message)
  }
}

// Deprecated compatibility export. Production persistence is MySQL-only.
export const supabaseClient = null

export const getPool = () => dbPool

export const query = async (sql, params = []) => {
  if (dbPool) {
    const [rows] = await dbPool.query(sql, params)
    return rows
  }
  return []
}

export const execute = async (sql, params = []) => {
  if (dbPool) {
    const [result] = await dbPool.execute(sql, params)
    return result
  }
  return { insertId: 0, affectedRows: 0 }
}

// ==============================================================================
// ENTERPRISE PRODUCTION IN-MEMORY RESILIENT ENGINE
// Supported Roles: SUPER_ADMIN, AGENT_ADMIN, SUPERVISOR, SALES_AGENT, FIELD_AGENT, HR_MANAGER, EMPLOYEE/STAFF
// ==============================================================================
export const memoryStore = {
  companies: [{"id":1,"uuid":"00000000-0000-4000-8000-000000000001","code":"NXF-HQ-001","name":"NexFieldForce","currency":"NGN","timezone":"Africa/Lagos"}],
  roles: [{"id":1,"code":"SUPER_ADMIN","name":"SUPER ADMIN","is_system":1},{"id":2,"code":"COMPANY_ADMIN","name":"COMPANY ADMIN","is_system":1},{"id":3,"code":"AGENT_ADMIN","name":"AGENT ADMIN","is_system":1},{"id":4,"code":"SUPERVISOR","name":"SUPERVISOR","is_system":1},{"id":5,"code":"SALES_AGENT","name":"SALES AGENT","is_system":1},{"id":6,"code":"FIELD_AGENT","name":"FIELD AGENT","is_system":1},{"id":7,"code":"HR_MANAGER","name":"HR MANAGER","is_system":1},{"id":8,"code":"FINANCE","name":"FINANCE","is_system":1},{"id":9,"code":"DRIVER","name":"DRIVER","is_system":1},{"id":10,"code":"CLIENT","name":"CLIENT","is_system":1},{"id":11,"code":"VIEWER","name":"VIEWER","is_system":1},{"id":12,"code":"EMPLOYEE","name":"EMPLOYEE","is_system":1}],
  departments: [{"id":1,"company_id":1,"name":"Executive"},{"id":2,"company_id":1,"name":"Human Resources"},{"id":3,"company_id":1,"name":"Sales & Marketing"},{"id":4,"company_id":1,"name":"Operations"},{"id":5,"company_id":1,"name":"Information Technology"},{"id":6,"company_id":1,"name":"Finance"}],
  positions: [],
  users: [],
  employees: [],
  groups: [],
  regions: [],
  sub_regions: [],
  markets: [],
  products: [],
  territories: [],
  customers: [],
  orders: [],
  payments: [],
  field_visits: [],
  attendance: [],
  location_logs: [],
  red_flags: [],
  tasks: [],
  field_assignments: [],
  expenses: [],
  schedules: [],
  sales_targets: [],
  routes: [],
  vehicles: [],
  requests: [],
  leave_types: [{"id":1,"company_id":1,"code":"ANNUAL","name":"Annual Leave","days_allowed_per_year":20},{"id":2,"company_id":1,"code":"SICK","name":"Sick Leave","days_allowed_per_year":12},{"id":3,"company_id":1,"code":"CASUAL","name":"Casual Leave","days_allowed_per_year":5}],
  leave_balances: [],
  leave_requests: [],
  registration_requests: [],
  employee_documents: [],
  salary_records: [],
  announcements: [],
  notifications: [],
  jobs: [],
  job_postings: [],
  candidates: [],
  employee_onboarding: [],
  commissions: [],
  competitor_intel: [],
  leads: [],
  applications: [],
  audit_logs: [],
  alerts: [],
  password_resets: {},
}

export const initializeDatabase = async () => {
  console.log('[DB] Initializing Clean Unified NexFieldForce Database Storage...')
  if (dbPool) {
    try {
      const schemaPath = path.join(ROOT_DIR, 'mysql-schema.sql')
      const schemaSql = await fs.readFile(schemaPath, 'utf8')
      const statements = schemaSql.replace(/^\s*--.*$/gm, '').split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)
      for (const statement of statements) {
        try { await dbPool.query(statement) } catch (error) {
          if (process.env.NODE_ENV === 'production') throw error
          console.warn('[MySQL Schema Statement Warning]:', error.message)
        }
      }
      await seedMySqlReferenceData()
      console.log('[DB] MySQL Schema initialized.')
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err
      console.warn('[MySQL Schema Init Warning]:', err.message)
    }
  } else {
    console.log('[DB] Running with Clean In-Memory Resilient Engine.')
  }
}

const seedMySqlReferenceData = async () => {
  const roles = [
    ['SUPER_ADMIN', 'Platform Super Administrator', 'Full platform governance', 1],
    ['COMPANY_ADMIN', 'Company Administrator', 'Tenant administration', 1],
    ['AGENT_ADMIN', 'Agent Administrator', 'Field operations administration', 1],
    ['SUPERVISOR', 'Supervisor', 'Team supervision', 1],
    ['SALES_AGENT', 'Sales Agent', 'Commercial sales access', 1],
    ['FIELD_AGENT', 'Field Agent', 'Field execution access', 1],
    ['HR_MANAGER', 'HR Manager', 'Human resources administration', 1],
    ['FINANCE', 'Finance Officer', 'Finance operations', 1],
    ['DRIVER', 'Driver', 'Assigned vehicle and trip operations', 1],
    ['CLIENT', 'Client', 'Client dashboard and approved exports', 1],
    ['VIEWER', 'Viewer', 'Read-only operational access', 1],
    ['EMPLOYEE', 'Staff Member', 'Employee self-service', 1],
  ]

  await dbPool.query(
    `INSERT INTO companies (uuid, code, name, legal_name, email, currency, timezone)
     VALUES (?, 'NXF-HQ-001', 'NexFieldForce', 'NexFieldForce', ?, 'NGN', 'Africa/Lagos')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [randomUUID(), process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@nexfieldforce.com']
  )
  for (const [code, name, description, isSystem] of roles) {
    await dbPool.query(
      `INSERT INTO roles (code, name, description, is_system) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
      [code, name, description, isSystem]
    )
  }

  if (process.env.DB_SEED_ON_START !== 'true') return

  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || ''
  if (!email || !password) return

  const [[existing]] = await dbPool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
  if (existing) return
  const [[role]] = await dbPool.query("SELECT id FROM roles WHERE code = 'SUPER_ADMIN' LIMIT 1")
  const passwordHash = await bcrypt.hash(password, 12)
  await dbPool.query(
    `INSERT INTO users (uuid, company_id, email, password_hash, full_name, role_id, is_super_admin, status)
     VALUES (?, 1, ?, ?, 'Platform Administrator', ?, 1, 'active')`,
    [randomUUID(), email, passwordHash, role.id]
  )
}
