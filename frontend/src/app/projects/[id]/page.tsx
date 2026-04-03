'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { apiClient } from '../../../lib/api'
import AuthGate from '../../../components/AuthGate'

const MermaidDiagram = dynamic(() => import('../../../components/MermaidDiagram'), { ssr: false })

interface StageOutput {
  stage: string
  output: Record<string, unknown>
  score: { completeness: number; clarity: number; standardCompliance: number }
  completedAt: string
}

interface DiagramOutput {
  type: string
  title: string
  mermaid: string
}

interface FinalOutput {
  requirements: Record<string, unknown>
  systemModel: Record<string, unknown>
  design: Record<string, unknown>
  testCases: Record<string, unknown>
  documentation: Record<string, unknown>
  diagrams: DiagramOutput[]
}

interface Project {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed'
  spec: Record<string, unknown>
  stages: StageOutput[]
  finalOutput?: FinalOutput
  createdAt: string
  completedAt?: string
}

const stageInfo: Record<string, { icon: string; label: string; color: string }> = {
  requirements: { icon: '📋', label: 'Requirements', color: 'text-blue-600' },
  modeling: { icon: '🏗️', label: 'Modeling', color: 'text-violet-600' },
  design: { icon: '⚙️', label: 'Design', color: 'text-emerald-600' },
  testing: { icon: '🧪', label: 'Testing', color: 'text-amber-600' },
  documentation: { icon: '📄', label: 'Documentation', color: 'text-rose-600' },
}

const allStages = ['requirements', 'modeling', 'design', 'testing', 'documentation']

function ScoreBadge({ score }: { score: { completeness: number; clarity: number; standardCompliance: number } }) {
  const avg = ((score.completeness + score.clarity + score.standardCompliance) / 3).toFixed(1)
  return (
    <div className="flex gap-3 text-xs flex-wrap">
      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Completeness: {score.completeness}/10</span>
      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Clarity: {score.clarity}/10</span>
      <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded">Standards: {score.standardCompliance}/10</span>
      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold">Avg: {avg}/10</span>
    </div>
  )
}

function OutputSection({ title, data }: { title: string; data: unknown }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-800"
      >
        <span>{title}</span>
        <span className="text-slate-400">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="p-5 bg-white">
          {renderOutput(data)}
        </div>
      )}
    </div>
  )
}

function renderOutput(data: unknown): React.ReactNode {
  if (typeof data === 'string') return <p className="text-slate-700 text-sm whitespace-pre-wrap">{data}</p>
  if (Array.isArray(data)) {
    return (
      <ul className="space-y-1">
        {data.map((item, i) => (
          <li key={i} className="text-sm text-slate-700">• {typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    )
  }
  if (typeof data === 'object' && data !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, val]) => (
          <div key={key}>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{key}</span>
            <div className="mt-1 ml-2">{renderOutput(val)}</div>
          </div>
        ))}
      </div>
    )
  }
  return <span className="text-sm text-slate-700">{String(data)}</span>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pipeline' | 'diagrams' | 'output'>('pipeline')

  const fetchProject = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/projects/${projectId}`)
      setProject(res.data.project)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
    const interval = setInterval(() => {
      if (project?.status === 'running') fetchProject()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchProject, project?.status])

  if (loading) return <div className="text-center py-24 text-slate-400">Loading project...</div>
  if (!project) return <div className="text-center py-24 text-slate-500">Project not found.</div>

  const completedStages = project.stages.map(s => s.stage)

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <AuthGate />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
            <p className="text-slate-500 text-sm">{project.spec.projectType as string} · Created {new Date(project.createdAt).toLocaleString()}</p>
          </div>
          <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
            project.status === 'completed' ? 'bg-green-100 text-green-700' :
            project.status === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {project.status === 'running' ? '⚙️ Running...' :
             project.status === 'completed' ? '✅ Completed' : '❌ Failed'}
          </span>
        </div>
      </div>

      {/* Pipeline Progress */}
      {project.status === 'running' && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 mb-8">
          <p className="text-sky-800 font-semibold mb-3">⚙️ AI Pipeline Running...</p>
          <div className="flex gap-2">
            {allStages.map(stage => {
              const info = stageInfo[stage]
              const done = completedStages.includes(stage)
              const current = completedStages.length < allStages.length && allStages[completedStages.length] === stage
              return (
                <div key={stage} className={`flex-1 rounded-lg p-2 text-center text-xs font-medium ${
                  done ? 'bg-green-100 text-green-700' :
                  current ? 'bg-sky-100 text-sky-700 animate-pulse' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {info.icon} {info.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {(['pipeline', 'diagrams', 'output'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'pipeline' ? '⚙️ Pipeline' : tab === 'diagrams' ? '📊 Diagrams' : '📄 Output'}
          </button>
        ))}
      </div>

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {allStages.map(stageName => {
            const info = stageInfo[stageName]
            const stageData = project.stages.find(s => s.stage === stageName)
            const isDone = !!stageData
            const isCurrent = !isDone && completedStages.length < allStages.length && allStages[completedStages.length] === stageName

            return (
              <div key={stageName} className={`rounded-2xl border p-5 ${
                isDone ? 'border-green-200 bg-green-50' :
                isCurrent ? 'border-sky-200 bg-sky-50' :
                'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold flex items-center gap-2 ${info.color}`}>
                    <span className="text-lg">{info.icon}</span>
                    {info.label} Agent
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isDone ? 'bg-green-100 text-green-700' :
                    isCurrent ? 'bg-sky-100 text-sky-700' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {isDone ? '✓ Done' : isCurrent ? '⚙️ Running' : 'Pending'}
                  </span>
                </div>
                {stageData && <ScoreBadge score={stageData.score} />}
              </div>
            )
          })}
        </div>
      )}

      {/* Diagrams Tab */}
      {activeTab === 'diagrams' && (
        <div>
          {project.finalOutput?.diagrams?.length ? (
            <div className="grid gap-6">
              {project.finalOutput.diagrams.map((diagram, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">{diagram.title}</h3>
                  <MermaidDiagram chart={diagram.mermaid} id={`diagram-${i}`} />
                  <details className="mt-4">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">View Mermaid Source</summary>
                    <pre className="mt-2 text-xs bg-slate-50 rounded-lg p-3 overflow-x-auto text-slate-600">{diagram.mermaid}</pre>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              {project.status === 'running' ? '⏳ Diagrams will appear after the pipeline completes...' : 'No diagrams generated yet.'}
            </div>
          )}
        </div>
      )}

      {/* Output Tab */}
      {activeTab === 'output' && (
        <div>
          {project.finalOutput ? (
            <div className="space-y-3">
              <OutputSection title="📋 Requirements" data={project.finalOutput.requirements} />
              <OutputSection title="🏗️ System Model" data={project.finalOutput.systemModel} />
              <OutputSection title="⚙️ Technical Design" data={project.finalOutput.design} />
              <OutputSection title="🧪 Test Plan" data={project.finalOutput.testCases} />
              <OutputSection title="📄 Documentation" data={project.finalOutput.documentation} />
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              {project.status === 'running' ? '⏳ Output will appear after the pipeline completes...' : 'No output available.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
