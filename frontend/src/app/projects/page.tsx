'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '../../lib/api'
import AuthGate from '../../components/AuthGate'

interface Project {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed'
  spec: { projectType?: string; description?: string }
  stages: unknown[]
  createdAt: string
}

const statusColors: Record<string, string> = {
  running: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const statusIcons: Record<string, string> = {
  running: '⚙️',
  completed: '✅',
  failed: '❌',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.get('/api/projects')
        setProjects(res.data.projects)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
    const interval = setInterval(fetchProjects, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <AuthGate />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">📁 Projects</h1>
          <p className="text-slate-500">Your AI-designed system projects</p>
        </div>
        <Link href="/new" className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-3 rounded-xl transition-colors">
          + New Project
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-xl text-slate-600 font-medium mb-2">No projects yet</p>
          <p className="text-slate-400 mb-6">Create your first system design project</p>
          <Link href="/new" className="bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-500 transition-colors">
            Start Your First Project
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-sky-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-slate-900">{p.name}</h2>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status]}`}>
                        {statusIcons[p.status]} {p.status}
                      </span>
                    </div>
                    {p.spec.projectType && (
                      <p className="text-sm text-slate-500 mb-1">📌 {p.spec.projectType}</p>
                    )}
                    {p.spec.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{p.spec.description as string}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400 mt-1">{p.stages.length} stages done</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
