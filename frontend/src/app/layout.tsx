import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SAD-GENIUS AI – Multi-Agent System Engineer',
  description: 'Transform structured input into professional system designs with AI',
}

const CURRENT_YEAR = new Date().getFullYear()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              SAD-GENIUS AI
            </span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-300">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <a href="/auth" className="hover:text-white transition-colors">Login</a>
            <a href="/projects" className="hover:text-white transition-colors">Projects</a>
            <a href="/new" className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-colors">
              + New Project
            </a>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-400 text-center text-sm py-6 mt-16">
          <p>SAD-GENIUS AI — Multi-Agent System Engineer © {CURRENT_YEAR}</p>
        </footer>
      </body>
    </html>
  )
}
