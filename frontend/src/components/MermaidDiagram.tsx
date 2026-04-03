'use client'

import { useEffect, useRef } from 'react'

interface MermaidDiagramProps {
  chart: string
  id: string
}

export default function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderDiagram = async () => {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      })

      if (ref.current) {
        try {
          const { svg } = await mermaid.render(`mermaid-${id}`, chart)
          ref.current.innerHTML = svg
        } catch (err) {
          console.warn('Mermaid render error:', err)
          ref.current.innerHTML = `<pre class="text-xs text-red-500 p-4 bg-red-50 rounded-lg">${chart}</pre>`
        }
      }
    }

    renderDiagram()
  }, [chart, id])

  return (
    <div
      ref={ref}
      className="flex justify-center overflow-x-auto py-4 bg-slate-50 rounded-xl min-h-[200px] items-center"
    >
      <div className="text-slate-400 text-sm">Rendering diagram...</div>
    </div>
  )
}
