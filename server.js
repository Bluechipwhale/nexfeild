import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import apiRoutes from './server/routes/index.js'
import { initializeDatabase } from './server/config/db.js'
import { reminderWorker } from './server/src/services/reminderWorker.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, 'dist')
const UPLOADS_DIR = path.resolve(__dirname, 'uploads')
const PORT = Number(process.env.PORT || 3000)
const isProduction = process.env.NODE_ENV === 'production'

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

const ensureProductionConfiguration = () => {
  if (!isProduction) return

  const jwtSecret = process.env.JWT_SECRET || ''
  if (jwtSecret.length < 48) {
    throw new Error('Production requires a JWT_SECRET of at least 48 characters.')
  }

  if (process.env.DB_SEED_ON_START === 'true') {
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || ''
    if (bootstrapPassword.length < 14 || bootstrapPassword === 'ChangeMe123!') {
      throw new Error('Production seeding requires a unique BOOTSTRAP_ADMIN_PASSWORD of at least 14 characters.')
    }
  }

  if (configuredOrigins.length === 0) {
    throw new Error('Production requires CORS_ORIGIN to be configured.')
  }

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Production requires Hostinger MySQL: set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME.')
  }
}

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const app = express()
app.set('trust proxy', 1)

// Security & Performance Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
)
app.use(compression())
app.use(
  cors({
    origin(origin, callback) {
      // Browsers making same-origin requests and server-to-server clients omit Origin.
      if (!origin || configuredOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true)
      }
      // Omit CORS headers for disallowed browser origins instead of converting a
      // normal request into a server error. The browser then blocks access.
      return callback(null, false)
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

// Mount Uploads Directory
app.use('/uploads', express.static(UPLOADS_DIR))

// Mount API Routes
app.use('/api', apiRoutes)

// Serve Static Assets specifically from dist/assets (with strict 404 for missing chunk hashes)
app.use(
  '/assets',
  express.static(path.join(DIST_DIR, 'assets'), {
    immutable: true,
    maxAge: '1y',
    fallthrough: false,
  })
)

// Serve other static files (favicon, manifest, images)
app.use(
  express.static(DIST_DIR, {
    etag: true,
    index: false,
  })
)

// SPA Fallback for Client-Side Routing (Serve index.html with no-cache headers)
app.get('{*any}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ success: false, message: 'Resource not found' })
  }

  const indexPath = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    return res.sendFile(indexPath)
  }
  return res.status(404).send('Frontend build not found. Please run npm run build.')
})

// Central API Error Handler (Always returns clean JSON)
app.use((err, req, res, _next) => {
  console.error('[Server Error]:', err.message || err)
  const status = Number(err.status || err.statusCode || 500)
  const message = status >= 500 && isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  return res.status(status).json({
    success: false,
    message,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
  })
})

// Initialize Database & Background Services & Start Server
const startServer = async () => {
  // Fail closed before any database connection or background process can start.
  ensureProductionConfiguration()

  try {
    await initializeDatabase()
  } catch (dbErr) {
    if (isProduction) throw dbErr
    console.warn('[Database Notice]:', dbErr.message)
  }

  try {
    reminderWorker.start(15000)
  } catch (svcErr) {
    console.warn('[Background Worker Notice]:', svcErr.message)
  }

  app.listen(PORT, () => {
    console.log(`NexFieldForce server operational on port ${PORT}`)
    console.log(`🔗 Base API URL: http://localhost:${PORT}/api`)
  })
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err.message)
  process.exit(1)
})

export default app
