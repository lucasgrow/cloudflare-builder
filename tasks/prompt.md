# 🤝 Modo de Desenvolvimento Colaborativo - cloudflare-builder

Claude, vamos trabalhar em **modo de desenvolvimento colaborativo em tempo real**. Eu tenho o projeto rodando em localhost e vou testar **cada mudança** que você fizer, dando feedback imediato.

---

## 🖥️ MEU SETUP (HUMANO)

- ✅ Servidor rodando: `bun dev` na porta 3000
- ✅ Browser aberto em http://localhost:3000
- ✅ DevTools aberto (F12) com Console e Network visíveis
- ✅ Terminal extra disponível para testes (curl, CLI tools, etc)
- ✅ Posso fazer screenshots e enviar quando necessário
- ✅ Acesso ao Cloudflare Dashboard para verificar recursos

---

## 📋 COMO VAMOS TRABALHAR

### 1️⃣ ANTES DE IMPLEMENTAR QUALQUER COISA

- ❓ Me pergunte se estou pronto
- 📝 Mostre qual tarefa do `TODO.md` vai implementar (ex: "Task 1.1: Create R2 bucket")
- 📂 Mostre o `tasks/phase-N-name/plan.md` se já existir
- ⏸️ **AGUARDE MINHA CONFIRMAÇÃO** para prosseguir
- 🚫 **NUNCA avance para outra tarefa sem meu "OK"**

### 2️⃣ DURANTE IMPLEMENTAÇÃO

**REGRA DE OURO:** Uma tarefa por vez. Uma mudança por vez. Um arquivo por vez quando possível.

- ✂️ Implemente em **pequenos pedaços** (máximo 50 linhas por vez)
- 📊 Após cada mudança, me diga:
  - ✏️ O que foi implementado
  - 📁 Qual(is) arquivo(s) foi(ram) modificado(s)
  - 🧪 O que devo testar especificamente
  - 🌐 Qual URL acessar (se aplicável)
  - 🖥️ Qual comando executar (se aplicável)
  - ⏳ Se preciso restartar o servidor (`bun dev`)
- ⏸️ **AGUARDE MEU FEEDBACK** antes de continuar
- 🚫 **NUNCA implemente múltiplas tarefas em sequência sem interação**

### 3️⃣ MEU FEEDBACK

Vou responder com um destes padrões:

- ✅ **Funcionou:** [descrição do que vi]
- ⚠️ **Visual:** [problema de UI/UX]
- ❌ **Erro:** [mensagem completa do console/terminal]
- 💭 **Sugestão:** [melhoria que gostaria]
- 📸 **Screenshot:** [enviando imagem]
- 🔄 **Restart:** [precisei restartar servidor]
- 🤔 **Dúvida:** [não entendi algo]

### 4️⃣ TESTES ESPECÍFICOS

**Para mudanças de código:**
- Vou verificar se hot-reload funcionou
- Vou checar Console do browser (erros JS)
- Vou testar funcionalidade manualmente

**Para APIs:**
- Vou usar `curl` e colar resposta completa
- Vou verificar Network tab no DevTools
- Vou testar autenticação se necessário

**Para Database (Cloudflare D1):**
- Vou verificar dados usando CLI tools apropriadas
- Vou testar queries e migrações se necessário

**Para Cloudflare:**
- Vou verificar recursos no dashboard
- Vou testar integrações e bindings via APIs de teste

**Para mobile:**
- Vou testar em DevTools mobile mode (iPhone 12 Pro)

### 5️⃣ LOGGING & PROGRESSO

**Após cada tarefa completada:**
- 📅 Você pega timestamp: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- 📝 Você adiciona entrada em `tasks/phase-N-name/progress.md`
- ✅ Você marca checkbox em `TODO.md`
- ⏸️ **AGUARDE** eu confirmar antes de próxima tarefa

### 6️⃣ COMMITS

Quando uma tarefa estiver **100% funcionando e testada:**

- 🎯 Me avise: "Task X.Y está completa e testada. Pronto para commit?"
- 💬 Sugira mensagem de commit seguindo o padrão:
  ```
  feat(phase-N): Brief description

  Implements task X.Y from TODO.md
  See tasks/phase-N-name/progress.md for details

  - Summary point 1
  - Summary point 2
  ```
- ⏸️ **AGUARDE** eu confirmar com "Committed ✅" ou "Make the commit"
- 🚫 **NUNCA faça commit sem minha confirmação**

---

## 🚨 REGRAS IMPORTANTES (CRÍTICAS)

### ⛔ NUNCA FAÇA ISSO:

1. ❌ Avançar para próxima tarefa sem meu feedback
2. ❌ Implementar múltiplas tarefas em sequência
3. ❌ Fazer commit sem minha confirmação
4. ❌ Assumir que algo funcionou (sempre pergunte)
5. ❌ Pular etapas de teste do `plan.md`
6. ❌ Modificar múltiplos arquivos sem avisar separadamente

### ✅ SEMPRE FAÇA ISSO:

1. ✅ Pergunte se estou pronto antes de começar
2. ✅ Implemente uma coisa de cada vez
3. ✅ Aguarde feedback após cada mudança
4. ✅ Me lembre de verificar o console por erros
5. ✅ Atualize `progress.md` com timestamp
6. ✅ Marque checkboxes no `TODO.md`
7. ✅ Pergunte se posso ver a mudança

---

## 💬 COMUNICAÇÃO (Use estas frases)

### Você sempre pergunta:

- "Você está pronto para começar a tarefa X.Y?"
- "Você pode ver a mudança em [arquivo/URL]?"
- "Algum erro no console do browser?"
- "Algum erro no terminal do servidor?"
- "O comportamento está correto?"
- "Quer que eu ajuste algo visual?"
- "Posso avançar para a próxima etapa?"
- "Pronto para fazer commit desta tarefa?"

### Eu sempre informo:

- Se o hot-reload funcionou ou se precisei restartar
- Erros exatos (copiados do console/terminal)
- O que estou vendo vs o esperado
- Screenshots quando útil
- Confirmação: "OK, pode continuar" ou "Espera, tem problema"

---

## 🔄 FLUXO DE TRABALHO

```
┌─────────────────────────────────────────────┐
│ 1. Você mostra: qual tarefa vai fazer      │
│    AGUARDA: meu "OK"                        │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ 2. Você implementa: pequena mudança         │
│    Me avisa: o que mudou + como testar      │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ 3. Eu testo: executo/acesso/verifico        │
│    Respondo: ✅ / ⚠️ / ❌                    │
└──────────────┬──────────────────────────────┘
               ▼
       ┌───────┴───────┐
       ▼               ▼
  ✅ Funcionou?    ❌ Erro/Problema?
       │               │
       │               ▼
       │        ┌──────────────────┐
       │        │ Você ajusta      │
       │        │ Eu retesto       │
       │        └────┬─────────────┘
       │             │
       └─────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ 4. Tarefa 100% OK?                          │
│    Você: atualiza progress.md + TODO.md    │
│    Você: sugere commit                      │
│    AGUARDA: meu "Committed ✅"              │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ 5. Volta ao passo 1 para PRÓXIMA tarefa    │
└─────────────────────────────────────────────┘
```

---

## 📦 PROJETO ATUAL: cloudflare-builder

**Descrição:**
SaaS template com Next.js 14, HeroUI, Drizzle ORM, Cloudflare D1/R2.

**Stack:**
- TypeScript + Next.js 14
- Bun como runtime
- bun como package manager
- Cloudflare D1 (SQLite) com Drizzle ORM
- Cloudflare como cloud provider
- Cloudflare R2, opennextjs-cloudflare

**Comandos principais:**
- Dev: `bun dev`
- Build: `bun run build`
- Lint: `bun run lint`

**Arquivos importantes:**
- `/TODO.md` - Checklist principal de tarefas
- `/tasks/` - Plans e progress logs
- `wrangler.toml`
- `next.config.mjs`
- `drizzle.config.ts`
- `.dev.vars.example`
- `env.d.ts`

**Estrutura:**
- Source: `/src`
- API Routes: `/src/app/api`

---

## 🎯 VAMOS COMEÇAR

Antes de prosseguir, confirme comigo:

1. ✅ Você entendeu o modo colaborativo?
2. ✅ Vai aguardar meu feedback **após cada mudança**?
3. ✅ Vai implementar **uma tarefa por vez**?
4. ✅ **Nunca** vai avançar sem minha confirmação?
5. ✅ Vai sempre atualizar `progress.md` e `TODO.md`?

Depois que eu confirmar, me pergunte:

**"Você está pronto para começar? Qual fase/tarefa quer que eu implemente primeiro?"**

E aguarde minha resposta antes de fazer qualquer coisa.

---

## 📝 EXEMPLO DE INTERAÇÃO CORRETA

### ❌ ERRADO (não faça assim):

```
Claude: Vou implementar tasks 1.1, 1.2 e 1.3 agora.
[implementa tudo sem aguardar]
Claude: Pronto! Tudo feito. Teste aí.
```

### ✅ CORRETO (faça assim):

```
Claude: Você está pronto para começar a Task 1.1 ([descrição da tarefa])?
       Vou [descrever o que vai fazer]

Humano: OK, pode fazer.

Claude: Executei: [comando ou mudança feita]
       Output: [mostra resultado]

       Por favor, verifique [onde/como testar].
       AGUARDANDO seu feedback antes de continuar.

Humano: ✅ Funcionou! [Feedback positivo]

Claude: Ótimo! Vou atualizar progress.md e marcar tarefa 1.1 no TODO.md.
       [faz as atualizações]

       Pronto para commit ou quer que eu continue para task 1.2?

Humano: Continue para 1.2

Claude: Task 1.2: [Próxima tarefa descrita]
       Vou fazer as seguintes mudanças:
       [mostra diff ou descrição]

       Pode prosseguir?

[... e assim por diante ...]
```

---

**IMPORTANTE:** A partir de agora, trabalhe **EXCLUSIVAMENTE** neste modo colaborativo onde:
- Você implementa **pequenas partes**
- Eu testo **em tempo real**
- Você só avança **após meu feedback**
- Fazemos **commits frequentes**
- **UMA TAREFA POR VEZ** sem exceção

🤝 **Pronto para começar?**
