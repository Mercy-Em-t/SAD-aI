import Link from 'next/link'

const features = [
  { icon: '🤖', title: 'Multi-Agent Pipeline', desc: 'Five specialized AI agents working in sequence: Requirements → Modeling → Design → Testing → Documentation' },
  { icon: '📊', title: 'Auto-Generated Diagrams', desc: 'Automatic UML diagram generation — Use Case, Sequence, and ER diagrams from your specification' },
  { icon: '🔄', title: 'Self-Refinement Loop', desc: 'Quality scoring engine automatically re-runs agents below threshold for better outputs' },
  { icon: '📋', title: 'Structured Spec Form', desc: 'Guided input form ensures complete project specifications for best AI results' },
  { icon: '⚡', title: 'Full System Design', desc: 'Complete architecture, API design, database schema, test plans, and documentation in minutes' },
  { icon: '🏗️', title: 'Professional Output', desc: 'Export-ready professional system design documents following industry standards' },
]

const agents = [
  { name: 'Requirements Agent', role: 'Understands & extracts all system requirements', color: 'bg-blue-500' },
  { name: 'Modeling Agent', role: 'Structures entities, use cases & system logic', color: 'bg-violet-500' },
  { name: 'Design Agent', role: 'Engineers architecture & technical design', color: 'bg-emerald-500' },
  { name: 'Testing Agent', role: 'Creates comprehensive test plans & cases', color: 'bg-amber-500' },
  { name: 'Documentation Agent', role: 'Produces polished professional docs', color: 'bg-rose-500' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-6">🧠🔥</div>
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
            SAD-GENIUS AI
          </h1>
          <p className="text-xl text-slate-300 mb-4 font-medium">
            Multi-Agent AI System Engineer
          </p>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Transform your project idea into a complete professional system design — requirements, architecture, diagrams, tests, and documentation — powered by specialized AI agents.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/new" className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg">
              🚀 Start New Project
            </Link>
            <Link href="/projects" className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all">
              View Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Pipeline Flow */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            {['📝 Spec Form', '⚙️ Runner Engine', '🤖 AI Agents', '📊 Diagrams', '📄 Output'].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap">
                  {step}
                </div>
                {i < 4 && <div className="text-slate-400 text-2xl hidden md:block">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-4">AI Agent Specialists</h2>
          <p className="text-center text-slate-500 mb-12">Each agent is independent, replaceable, and upgradable</p>
          <div className="grid md:grid-cols-5 gap-4">
            {agents.map((agent, i) => (
              <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm border border-slate-200">
                <div className={`w-3 h-3 rounded-full ${agent.color} mx-auto mb-3`} />
                <h3 className="font-semibold text-slate-800 text-sm mb-2">{agent.name}</h3>
                <p className="text-xs text-slate-500">{agent.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">System Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-slate-200 hover:border-sky-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-sky-600 to-violet-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Design Your System?</h2>
          <p className="text-sky-100 mb-8">Fill in your project spec and let AI agents do the work in minutes.</p>
          <Link href="/new" className="bg-white text-sky-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-sky-50 transition-colors inline-block">
            🚀 Launch Your Project
          </Link>
        </div>
      </section>
    </div>
  )
}
