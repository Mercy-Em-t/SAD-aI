# 🧠🔥 SAD-GENIUS AI

**Multi-Agent AI System Engineer** — Transform structured project specs into complete professional system designs.

## What It Does

SAD-GENIUS AI uses a pipeline of 5 specialized AI agents to generate:
- 📋 **Requirements Document** — Functional, non-functional, user stories, constraints
- 🏗️ **System Model** — Entities, use cases, data flows, ER relationships
- ⚙️ **Technical Design** — Architecture, components, API endpoints, database schema
- 🧪 **Test Plan** — Unit, integration, E2E, performance, security tests
- 📄 **Documentation** — Executive summary, deployment guide, user manual
- 📊 **UML Diagrams** — Auto-generated Use Case, Sequence, and ER diagrams

## System Architecture

```
[ USER ] → [ UI FORM ] → [ API ] → [ PROJECT RUNNER ] → [ AI AGENTS ] → [ DIAGRAM ENGINE ] → [ OUTPUT ]
```

## AI Agent Pipeline

| Agent | Role |
|-------|------|
| Requirements Agent | Understands & extracts system requirements |
| Modeling Agent | Structures entities, use cases, system logic |
| Design Agent | Engineers architecture & technical design |
| Testing Agent | Creates comprehensive test plans |
| Documentation Agent | Produces polished professional docs |

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Mermaid.js
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI API (GPT-4o-mini)
- **Database**: PostgreSQL
- **Deployment**: Frontend → Vercel, Backend → Railway/Render, DB → Supabase

## Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000

### Docker (Full Stack)
```bash
OPENAI_API_KEY=your_key docker-compose up
```

## Usage

1. Click **+ New Project**
2. Fill the System Spec Form (project overview, requirements, modules, integrations)
3. Launch the AI pipeline
4. Watch agents work in real-time
5. View generated diagrams and full system design output

## Security & Tenant Isolation

> ⚠️ **IMPORTANT (Production)**  
> The current implementation uses an in-memory auth/session store and frontend `localStorage` token storage for prototype simplicity.  
> Before production deployment, migrate to persistent PostgreSQL-backed auth/session storage and secure `httpOnly` cookie-based auth.

- Authentication endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Project endpoints now require `Authorization: Bearer <token>`.
- Each project is bound to the authenticated user (`userId`), and users can only list/read/create their own projects.
- Cross-account access is denied (non-owned project IDs return not found).
- Session lifetime is configurable with `AUTH_SESSION_DURATION_MS` (defaults to 2 hours).
- In production builds, insecure localStorage auth is blocked by default unless `NEXT_PUBLIC_ALLOW_INSECURE_LOCALSTORAGE_AUTH=true` is explicitly set.

### Production security notes

- Current auth/user/session storage is in-memory and resets on restart; replace with persistent PostgreSQL-backed auth/session storage before production deployment.
- Current frontend stores bearer token in `localStorage` for simplicity; for production SaaS, move to secure `httpOnly` cookies and apply strong CSP/XSS protections.
