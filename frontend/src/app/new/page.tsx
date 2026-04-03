'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '../../lib/api'
import AuthGate from '../../components/AuthGate'

const projectTypes = [
  'Web Application', 'Mobile App', 'API / Microservice', 'Desktop App',
  'E-commerce Platform', 'SaaS Platform', 'IoT System', 'Data Analytics Platform',
  'AI/ML System', 'ERP System', 'Other'
]

const commonModules = [
  'Authentication & Authorization', 'User Management', 'Dashboard & Analytics',
  'Payment Processing', 'Notifications', 'File/Media Management', 'Search',
  'Reporting', 'Admin Panel', 'Chat/Messaging', 'Email System', 'Audit Logs'
]

const commonIntegrations = [
  'Stripe (Payments)', 'SendGrid (Email)', 'Twilio (SMS)', 'Google OAuth',
  'GitHub OAuth', 'AWS S3 (Storage)', 'Firebase', 'Slack', 'Zapier',
  'Google Analytics', 'Sentry (Error Tracking)', 'Cloudinary (Media)'
]

const outputExpectations = [
  'Requirements Document', 'System Architecture', 'UML Diagrams',
  'API Documentation', 'Database Schema', 'Test Plan', 'Deployment Guide', 'User Manual'
]

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    projectName: '',
    description: '',
    projectType: '',
    targetUsers: '',
    requirements: [] as string[],
    modules: [] as string[],
    integrations: [] as string[],
    outputExpectations: [] as string[],
  })
  const [customReq, setCustomReq] = useState('')

  const toggleArrayItem = (field: 'modules' | 'integrations' | 'outputExpectations', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }

  const addRequirement = () => {
    if (customReq.trim()) {
      setForm(prev => ({ ...prev, requirements: [...prev.requirements, customReq.trim()] }))
      setCustomReq('')
    }
  }

  const removeRequirement = (idx: number) => {
    setForm(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.projectName || !form.description || !form.projectType) {
      setError('Please fill in Project Name, Description, and Project Type.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/api/projects', form)
      router.push(`/projects/${res.data.project.id}`)
    } catch (err: unknown) {
      const msg = 'Could not create project. Please login again if your session expired.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <AuthGate />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">🧾 New System Spec</h1>
        <p className="text-slate-500">Fill in your project details and AI agents will generate a complete system design.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Overview */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded text-sm font-bold">1</span>
            Project Overview
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={form.projectName}
                onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))}
                placeholder="e.g. E-commerce Platform"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your project idea, goals, and what problem it solves..."
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Type *</label>
              <select
                value={form.projectType}
                onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a type...</option>
                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Users</label>
              <input
                type="text"
                value={form.targetUsers}
                onChange={e => setForm(p => ({ ...p, targetUsers: e.target.value }))}
                placeholder="e.g. Small business owners, students, healthcare providers..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Requirements */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded text-sm font-bold">2</span>
            Key Requirements
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customReq}
              onChange={e => setCustomReq(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
              placeholder="Add a specific requirement and press Enter..."
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button type="button" onClick={addRequirement} className="bg-violet-600 text-white px-4 py-2.5 rounded-lg hover:bg-violet-700 font-medium">
              Add
            </button>
          </div>
          {form.requirements.length > 0 && (
            <ul className="space-y-2">
              {form.requirements.map((req, i) => (
                <li key={i} className="flex items-center justify-between bg-violet-50 rounded-lg px-4 py-2 text-sm text-violet-800">
                  <span>• {req}</span>
                  <button type="button" onClick={() => removeRequirement(i)} className="text-violet-400 hover:text-violet-600 ml-2 font-bold">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Section 3: Modules */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-bold">3</span>
            System Modules
          </h2>
          <div className="flex flex-wrap gap-2">
            {commonModules.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggleArrayItem('modules', m)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.modules.includes(m)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Integrations */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm font-bold">4</span>
            Integrations
          </h2>
          <div className="flex flex-wrap gap-2">
            {commonIntegrations.map(int => (
              <button
                key={int}
                type="button"
                onClick={() => toggleArrayItem('integrations', int)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.integrations.includes(int)
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        </section>

        {/* Section 5: Output */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm font-bold">5</span>
            Output Expectations
          </h2>
          <div className="flex flex-wrap gap-2">
            {outputExpectations.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => toggleArrayItem('outputExpectations', o)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.outputExpectations.includes(o)
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-600 to-violet-600 hover:from-sky-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Launching AI Pipeline...
            </span>
          ) : '🚀 Launch AI System Design Pipeline'}
        </button>
      </form>
    </div>
  )
}
