// ==============================================================================
// UNIFIED ENTERPRISE API CLIENT (NEXFIELDFORCE & EDGEWFORCE)
// Supports Offline Caching, Sync Queues, Token Management, and Dual Method Signatures
// ==============================================================================

import localforage from 'localforage'
import { cacheApiResponse, getCachedApiResponse, enqueueOfflineAction } from './offline.js'

export const APP_TOKEN_KEY = 'routeforce360-access-token'
export const EWF_TOKEN_KEY = 'ewf_token'

export const getApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin.replace(/\/$/, '')
  return ''
}

export const hasApiBaseUrl = () => Boolean(getApiBaseUrl())

export const getAccessToken = async () => {
  const forageToken = await localforage.getItem(APP_TOKEN_KEY)
  if (forageToken) return forageToken
  const localToken = localStorage.getItem(EWF_TOKEN_KEY) || localStorage.getItem('token') || sessionStorage.getItem(EWF_TOKEN_KEY)
  return localToken || ''
}

export const setAccessToken = async (token) => {
  await localforage.setItem(APP_TOKEN_KEY, token)
  if (token) {
    localStorage.setItem(EWF_TOKEN_KEY, token)
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem(EWF_TOKEN_KEY)
    localStorage.removeItem('token')
  }
}

export const clearAccessToken = async () => {
  await localforage.removeItem(APP_TOKEN_KEY)
  localStorage.removeItem(EWF_TOKEN_KEY)
  localStorage.removeItem('token')
  sessionStorage.removeItem(EWF_TOKEN_KEY)
}

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(EWF_TOKEN_KEY, token)
    localStorage.setItem('token', token)
    localforage.setItem(APP_TOKEN_KEY, token).catch(() => {})
  } else {
    clearToken()
  }
}

export const getToken = () => {
  return localStorage.getItem(EWF_TOKEN_KEY) || localStorage.getItem('token') || sessionStorage.getItem(EWF_TOKEN_KEY) || ''
}

export const clearToken = () => {
  localStorage.removeItem(EWF_TOKEN_KEY)
  localStorage.removeItem('token')
  sessionStorage.removeItem(EWF_TOKEN_KEY)
  localforage.removeItem(APP_TOKEN_KEY).catch(() => {})
}

export async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  let token = getToken()
  if (!token) {
    try {
      token = await getAccessToken()
    } catch {}
  }

  const isFormData = options.body instanceof FormData
  const baseUrl = getApiBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const fullPath = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`
  const url = path.startsWith('http') ? path : `${baseUrl}${fullPath}`

  // Offline GET fallback
  if (!navigator.onLine && method === 'GET') {
    const cached = await getCachedApiResponse(fullPath)
    if (cached !== null && cached !== undefined) return cached
  }

  // Offline mutation queue
  if (!navigator.onLine && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    let payload = {}
    if (typeof options.body === 'string') {
      try {
        payload = JSON.parse(options.body)
      } catch {
        payload = { raw: options.body }
      }
    } else if (isFormData) {
      options.body.forEach((val, key) => {
        payload[key] = val
      })
    } else if (options.body && typeof options.body === 'object') {
      payload = options.body
    }

    await enqueueOfflineAction(fullPath, method, payload, `Offline ${method} ${fullPath}`)
    return {
      success: true,
      queued: true,
      message: 'Network offline. Action saved locally and will sync when internet returns.'
    }
  }

  const headers = new Headers(options.headers || {})
  if (!isFormData && !headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  } else if (!isFormData && !headers.has('Content-Type') && options.body && typeof options.body === 'object') {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let finalBody = options.body
  if (finalBody && typeof finalBody === 'object' && !isFormData && !(finalBody instanceof Blob) && !(finalBody instanceof ArrayBuffer)) {
    finalBody = JSON.stringify(finalBody)
  }

  try {
    const res = await fetch(url, {
      ...options,
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : finalBody
    })

    const text = await res.text()
    let json = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { message: text }
    }

    if (!res.ok) {
      if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/me')) {
        if (json.error?.code === 'TOKEN_EXPIRED' || json.error?.code === 'USER_INACTIVE') {
          clearToken()
          window.dispatchEvent(new CustomEvent('ewf_unauthorized'))
        }
      }
      const errorMsg = json.error?.message || json.message || `Request failed with status ${res.status}`
      const err = new Error(errorMsg)
      err.code = json.error?.code || 'API_ERROR'
      err.status = res.status
      err.data = json
      throw err
    }

    // Return the appropriate payload format
    const data = json.data !== undefined ? json.data : json

    if (method === 'GET') {
      cacheApiResponse(fullPath, data)
    }

    return data
  } catch (err) {
    if (method === 'GET') {
      const cached = await getCachedApiResponse(fullPath)
      if (cached !== null && cached !== undefined) return cached
    }

    if (!navigator.onLine) {
      err.isOffline = true
      err.message = 'No internet connection. Data will be synchronized when network returns.'
    }
    throw err
  }
}

export const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, {
    method: 'POST',
    body,
    ...options
  }),
  put: (path, body, options) => request(path, {
    method: 'PUT',
    body,
    ...options
  }),
  patch: (path, body, options) => request(path, {
    method: 'PATCH',
    body,
    ...options
  }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options })
}

/**
 * Universal apiRequest supporting both:
 * 1) apiRequest(path, options) -> NexFieldForce style
 * 2) apiRequest(path, method, body, options) -> EdgeWForce style
 */
export async function apiRequest(path, methodOrOptions = 'GET', body = null, extraOptions = {}) {
  if (typeof methodOrOptions === 'object' && methodOrOptions !== null) {
    const options = methodOrOptions
    return request(path, options)
  }

  const method = (typeof methodOrOptions === 'string' ? methodOrOptions : 'GET').toUpperCase()
  return request(path, {
    method,
    body,
    ...extraOptions
  })
}

export default api
