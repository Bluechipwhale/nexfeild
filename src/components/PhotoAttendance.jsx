import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../lib/api.js'

export default function PhotoAttendance() {
  const video = useRef(null)
  const stream = useRef(null)
  const [photo, setPhoto] = useState('')
  const [records, setRecords] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const stop = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null }
  const load = async () => { try { const result = await apiRequest('/api/photo-attendance/mine'); setRecords(result.data || []) } catch (error) { setMessage(error.message) } }
  useEffect(() => { load(); return stop }, [])
  const openCamera = async () => {
    try {
      stop()
      setPhoto('')
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      video.current.srcObject = stream.current
      await video.current.play()
      setMessage('Position your face in the camera and take a photo.')
    } catch { setMessage('Camera unavailable. Allow camera access and try again.') }
  }
  const capture = () => {
    if (!video.current?.videoWidth) return setMessage('Open the camera first.')
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 960 / video.current.videoWidth)
    canvas.width = Math.round(video.current.videoWidth * scale)
    canvas.height = Math.round(video.current.videoHeight * scale)
    canvas.getContext('2d').drawImage(video.current, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/jpeg', 0.8))
    stop()
    setMessage('Photo captured. Check it before clocking in.')
  }
  const submit = async (action) => {
    if (action === 'clock-in' && !photo) return setMessage('Take a photo before clocking in.')
    setBusy(true)
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }))
      const result = await apiRequest(`/api/photo-attendance/${action}`, { method: 'POST', body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, ...(action === 'clock-in' ? { photo } : {}) }) })
      setMessage(result.message || 'Attendance recorded.')
      setPhoto('')
      await load()
    } catch (error) { setMessage(error.message || 'Unable to record clock-in. Check location permission and connection.') }
    finally { setBusy(false) }
  }
  return <section className="space-y-5 max-w-2xl mx-auto">
    <div><h1 className="text-xl font-bold text-white">Photo clock-in</h1><p className="text-sm text-slate-400 mt-1">Take a photo and share your current location to record attendance. Your photo is attendance evidence, not automatic identity verification.</p></div>
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4">
      <video ref={video} muted playsInline className={photo ? 'hidden' : 'w-full rounded-xl bg-slate-950 min-h-48'} />
      {photo && <img src={photo} alt="Clock-in photo preview" className="w-full rounded-xl" />}
      <div className="flex flex-wrap gap-2"><button type="button" onClick={openCamera} className="px-4 py-2 rounded-lg bg-slate-700 text-white">{photo ? 'Retake photo' : 'Open camera'}</button><button type="button" onClick={capture} className="px-4 py-2 rounded-lg bg-slate-700 text-white">Take photo</button><button type="button" onClick={() => submit('clock-in')} disabled={busy || !photo} className="px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-50">{busy ? 'Recording...' : 'Clock in'}</button><button type="button" onClick={() => submit('clock-out')} disabled={busy} className="px-4 py-2 rounded-lg bg-rose-700 text-white disabled:opacity-50">Clock out</button></div>
      {message && <p role="status" className="text-sm text-slate-300">{message}</p>}
    </div>
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="font-semibold text-white">Recent attendance</h2>{records.length ? <ul className="mt-3 space-y-2">{records.map(row => <li key={row.id} className="text-sm text-slate-300">{String(row.attendance_date).slice(0, 10)} | In: {row.clock_in_at ? new Date(row.clock_in_at).toLocaleString() : '-'} | Out: {row.clock_out_at ? new Date(row.clock_out_at).toLocaleString() : '-'}</li>)}</ul> : <p className="text-sm text-slate-400 mt-3">No attendance records available.</p>}</div>
  </section>
}
