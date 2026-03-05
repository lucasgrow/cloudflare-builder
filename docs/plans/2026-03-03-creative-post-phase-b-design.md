# Creative Post Phase B — Web App + Agent SDK

**Date:** 2026-03-03
**Status:** approved
**Depends on:** Phase A (skill local, done)

## Goal

Web app pra produção de criativos estáticos para clientes médicos. Usuário faz onboarding de projeto (cliente), cola briefing, Agent interpreta e extrai copies, usuário revisa, gera em batch via Gemini, refina interativamente.

## Architecture

```
[Browser] → [Next.js (Cloudflare Pages)]
                ↓ write job
         [D1: configs, jobs, users]
                ↓ enqueue
         [Cloudflare Queue]
                ↓ consume
         [Worker + Agent SDK]
                ↓ generate
         [Gemini API] (logo + foto + refs as base64 inline_data)
                ↓ save
         [R2: assets + criativos]
                ↓ serve
         [Gallery: download + click-to-edit]
```

## Users & Auth

- Login simples: email + senha (NextAuth.js credentials)
- Sem roles no MVP — todos fazem tudo (onboard projetos + gerar criativos)

## Data Model

### D1 Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  palette_json TEXT NOT NULL,       -- {"accent":"#B8964E","dark":"#2C2C2C",...}
  typography_json TEXT NOT NULL,    -- {"headline":"Playfair Display","body":"Montserrat"}
  logo_description TEXT,            -- text description for prompt context
  prompt_injection TEXT NOT NULL,   -- full brand prompt injection block
  logo_dark_r2_key TEXT,
  logo_light_r2_key TEXT,
  photo_r2_key TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE project_refs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id),
  r2_key TEXT NOT NULL,
  type TEXT NOT NULL,               -- 'style_ref' | 'extra_photo'
  label TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  prompt_template TEXT NOT NULL,
  layout_description TEXT,
  is_custom INTEGER DEFAULT 0,
  project_id TEXT REFERENCES projects(id),  -- NULL = global, set = project-specific
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id),
  template_id TEXT NOT NULL REFERENCES templates(id),
  headline TEXT NOT NULL,
  benefits_json TEXT,               -- ["benefit 1","benefit 2","benefit 3"]
  cta_text TEXT NOT NULL,
  keywords_json TEXT,               -- ["keyword1","keyword2"]
  status TEXT NOT NULL DEFAULT 'queued',  -- queued | processing | done | failed
  error_message TEXT,
  output_r2_key TEXT,
  parent_job_id TEXT REFERENCES jobs(id),  -- for regenerations/edits
  edit_prompt TEXT,                  -- for click-to-edit refinements
  edit_region_json TEXT,            -- {"x":120,"y":300,"w":200,"h":80}
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE briefings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id),
  input_text TEXT NOT NULL,         -- raw briefing text
  extracted_json TEXT,              -- agent-extracted creatives array
  status TEXT DEFAULT 'pending',    -- pending | processed | approved
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
```

### R2 Key Structure

```
projects/{project_id}/assets/logo-dark.png
projects/{project_id}/assets/logo-light.png
projects/{project_id}/assets/photo-professional.jpg
projects/{project_id}/assets/extra/{filename}
projects/{project_id}/refs/{ref_id}.jpg
projects/{project_id}/outputs/{job_id}.jpg
projects/{project_id}/outputs/{job_id}_v2.jpg   (edit iterations)
```

## Core Flows

### Flow 1: Onboarding de Projeto

1. Form: nome, slug
2. Upload assets: logo (dark + light), foto profissional, fotos extras → R2
3. Identidade visual: color pickers (accent, dark, light, text), font dropdowns
4. Prompt injection: auto-gerado a partir dos campos, textarea editável
5. Upload refs: 2-3 criativos existentes como referência de estilo → R2
6. Preview: gera 1 criativo teste pra validar configs
7. Salva no D1

### Flow 2: Briefing → Extração → Revisão

1. Textarea: usuário cola doc estruturado OU briefing livre
2. "Processar" → Agent SDK (Claude) interpreta:
   - Recebe briefing + contexto do projeto (palette, specialty)
   - Extrai N criativos: headline, benefits, CTA, keywords, template sugerido
   - Retorna JSON array
3. Salva no D1 (briefings table, extracted_json)
4. Renderiza cards editáveis:
   - Cada card: headline (textarea), benefits (3 inputs), CTA (input), keywords (tags), template (dropdown)
   - Pode editar, remover, adicionar
5. "Aprovar e Gerar" → cria N jobs no D1, enfileira na Queue

### Flow 3: Geração (Background Worker)

1. Worker consome job da Queue
2. Carrega do D1: project configs, template prompt
3. Carrega do R2: logo, foto profissional, style refs → base64
4. Monta prompt (mesma lógica Phase A): template + substituição de variáveis + design principles + brand injection
5. Chama Gemini (gemini-3-pro-image-preview) com text + inline_data images
6. Salva resultado no R2
7. Atualiza D1: status=done, output_r2_key, completed_at

### Flow 4: Gallery + Click-to-Edit

1. Lista criativos por projeto, mais recentes primeiro
2. Status em tempo real (polling 5s enquanto processing)
3. Click pra ver full size
4. Download direto do R2
5. Click-to-edit:
   - Clica numa região da imagem → marca bounding box
   - Escreve instrução ("headline maior", "CTA em verde")
   - Cria novo job: parent_job_id + edit_prompt + edit_region_json
   - Gemini recebe imagem original + instrução de edição
   - Nova versão aparece ao lado pra comparar

## Tech Stack

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js 15 (App Router, RSC) |
| Styling | Tailwind CSS |
| Auth | NextAuth.js (credentials) |
| Database | Cloudflare D1 |
| Storage | Cloudflare R2 |
| Queue | Cloudflare Queues |
| Worker | Cloudflare Worker (Bun) |
| AI — Generation | Gemini 3 Pro Image Preview |
| AI — Briefing | Claude Agent SDK (briefing interpretation) |
| Deploy | Cloudflare Pages + Workers |
| Monorepo | Turborepo |

## Monorepo Structure

```
creative-post/
├── apps/
│   └── web/                    # Next.js (Cloudflare Pages)
│       ├── app/
│       │   ├── (auth)/         # login, register
│       │   ├── projects/       # list, new, [id]
│       │   ├── projects/[id]/
│       │   │   ├── generate/   # briefing + review cards
│       │   │   └── gallery/    # histórico + click-to-edit
│       │   └── api/            # API routes (D1/R2 bindings)
│       └── lib/
│           ├── db.ts           # D1 queries
│           ├── r2.ts           # R2 upload/download/presigned
│           └── queue.ts        # enqueue jobs
├── workers/
│   └── generator/              # Agent SDK Worker
│       ├── index.ts            # Queue consumer entry
│       ├── agent.ts            # Claude Agent SDK (briefing interpretation)
│       ├── gemini.ts           # Gemini generation (prompt building, API call)
│       └── utils.ts            # base64 encoding, image processing
├── packages/
│   └── shared/                 # shared types, schema, validation
│       ├── types.ts
│       └── schema.ts
├── wrangler.toml               # D1, R2, Queue bindings
└── turbo.json
```

## MVP Scope

### In
- Auth (login simples)
- CRUD projetos com upload assets
- Briefing → Agent extração → review cards editáveis
- Geração batch (background jobs)
- Gallery com download
- Click-to-edit refinamento (bounding box + prompt)
- 6 templates pré-cadastrados

### Out (futuro)
- Google Drive auto-sync
- Custom templates por projeto
- Multi-user collaboration real-time
- Analytics (custo por geração, performance por template)
- WhatsApp bot integration
- Webhooks/API pública

## Unresolved

- Click-to-edit com bounding box: Gemini edit API suporta região? Ou manda prompt descritivo? Testar.
- Next.js no Cloudflare Pages: @cloudflare/next-on-pages vs opennextjs-cloudflare adapter?
- Agent SDK no Worker: precisa de Bun runtime? Workers suporta?
- Upload de assets grandes (fotos HEIC/RAW): converter server-side ou client-side?
