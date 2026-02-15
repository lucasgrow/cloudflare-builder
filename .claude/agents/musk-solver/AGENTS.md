# Musk-Solver Operating Manual

## Golden Rule

> "If you want to remember something, write it to a file. Mental notes don't survive."

WORKING.md é o arquivo mais importante. Leia primeiro, atualize sempre.

---

## Session Structure

```
sessions/musk-{timestamp}/
├── WORKING.md                 # MAIS IMPORTANTE - estado atual
├── memory/
│   ├── MEMORY.md              # Learnings permanentes
│   └── YYYY-MM-DD.md          # Daily notes
├── shared/
│   ├── tasks.json             # Tasks e status
│   ├── comments.json          # Discussão entre subagents
│   └── activity.json          # Feed de atividades
├── phases/
│   ├── 00_problem.md
│   ├── 01_assumptions.md
│   ├── 02_decomposition.md
│   ├── 03_optimization.md
│   ├── 04_acceleration.md
│   └── 05_conclusion.md
└── summary.md                 # Session summary
```

---

## Subagents

| Agent | Session Key | Papel |
|-------|-------------|-------|
| decomposer | `musk:decomposer:{session}` | Quebrar problemas, 5-whys, atomizar |
| critic | `musk:critic:{session}` | Revisar outputs, questionar suposições |
| simplifier | `musk:simplifier:{session}` | Combinar, reduzir, usar code-simplifier |
| tester | `musk:tester:{session}` | Validar hipóteses, testar mudanças |

---

## 🔴 Shared Brain Protocol (CRÍTICO)

**Todo subagent DEVE atualizar o shared brain após completar seu trabalho.**

### O que significa "shared brain"
- `shared/tasks.json` - Tasks identificadas/atualizadas
- `shared/comments.json` - Comentários e resumos
- `shared/activity.json` - Log de ações
- `WORKING.md` - Estado atual da sessão
- `reviews/{agent}-review.md` - Report completo

### Workflow obrigatório de cada subagent

```
1. READ  → WORKING.md (entender estado)
2. READ  → shared/tasks.json (ver tasks existentes)
3. WORK  → Fazer análise/review
4. WRITE → reviews/{agent}-review.md (salvar report)
5. UPDATE → shared/tasks.json (adicionar novas tasks)
6. UPDATE → shared/comments.json (adicionar resumo)
7. UPDATE → shared/activity.json (registrar ação)
8. UPDATE → WORKING.md (atualizar estado)
```

### Por que isso importa
- Sem updates no shared brain, trabalho é **invisível** para outros agents
- Supervisor não sabe que trabalho foi feito
- Próximo agent não tem contexto
- Session fica inconsistente

### Formato de task (para adicionar)
```json
{
  "id": "task-{N}",
  "title": "Descrição curta",
  "phase": "review",
  "status": "pending",
  "owner": "{agent}",
  "created": "{ISO timestamp}",
  "notes": "Detalhes"
}
```

### Formato de comment (para adicionar)
```json
{
  "id": "c{N}",
  "timestamp": "{ISO timestamp}",
  "author": "{agent}",
  "phase": "review",
  "content": "Resumo em 1-2 frases",
  "report": "reviews/{agent}-review.md"
}
```

---

## Fases do Processo

### Fase 0: Setup
- Criar pasta de sessão
- Inicializar WORKING.md
- Inicializar shared/tasks.json

### Fase 1: Clareza (First Principles)
**Owner:** decomposer
**Output:** phases/00_problem.md

Critérios de saída:
- [ ] Problema descrito em até 1 página
- [ ] Escopo delimitado (DENTRO/FORA)
- [ ] Afirmação objetiva (1 frase)
- [ ] Ground truths identificadas (mínimo 3)
- [ ] Resultado desejado claro

### Fase 2: Suposições (Question)
**Owner:** decomposer + critic
**Output:** phases/01_assumptions.md

Critérios de saída:
- [ ] Todas suposições listadas
- [ ] 5-whys aplicado em cada uma
- [ ] Mínimo 30% marcadas "QUESTIONAR"
- [ ] Suposições ocultas identificadas
- [ ] critic revisou e aprovou

### Fase 3: Decomposição (Delete)
**Owner:** decomposer
**Human-in-loop:** OBRIGATÓRIO
**Output:** phases/02_decomposition.md

Critérios de saída:
- [ ] Problema decomposto em partes atômicas
- [ ] Mínimo 20% marcados "DELETAR"
- [ ] Humano aprovou deleções
- [ ] tester validou que deleções não quebram nada

### Fase 4: Otimização (Simplify)
**Owner:** simplifier
**Output:** phases/03_optimization.md

Critérios de saída:
- [ ] Complexidade reduzida em ≥30%
- [ ] code-simplifier aplicado (se código)
- [ ] Cada otimização TESTADA
- [ ] critic revisou

### Fase 5: Aceleração (Accelerate)
**Owner:** simplifier
**Output:** phases/04_acceleration.md

Critérios de saída:
- [ ] Tempo de ciclo reduzido
- [ ] Paralelizações identificadas
- [ ] Feedback loops documentados
- [ ] Interdependências eliminadas

### Fase 6: Conclusão (Automate)
**Owner:** supervisor
**Output:** phases/05_conclusion.md + summary.md

Critérios de saída:
- [ ] Solução final documentada
- [ ] Plano de ação claro
- [ ] Learnings em memory/MEMORY.md
- [ ] critic fez review final

---

## Heartbeat Protocol

A cada 15 minutos (ou ao acordar):

```markdown
1. [ ] Read WORKING.md
2. [ ] Check shared/tasks.json para minhas tasks
3. [ ] Scan shared/activity.json (últimas 2h)
4. [ ] Se tem trabalho: executar
5. [ ] Se blocked: reportar e notificar
6. [ ] Update WORKING.md
7. [ ] Post em shared/comments.json se relevante
8. [ ] Report HEARTBEAT_OK ou BLOCKED
```

---

## Task Management

### Status Flow
```
pending → in_progress → review → done
              ↓
           blocked
```

### Task Format (tasks.json)
```json
{
  "id": "task-001",
  "title": "Decompor custo de produção",
  "phase": 1,
  "status": "in_progress",
  "assignee": "decomposer",
  "blocked_by": null,
  "created": "2026-02-03T14:30:00Z",
  "updated": "2026-02-03T15:00:00Z"
}
```

### Comment Format (comments.json)
```json
{
  "id": "comment-001",
  "task_id": "task-001",
  "author": "critic",
  "text": "Suposição #3 não tem evidência. Precisa de teste.",
  "created": "2026-02-03T15:10:00Z"
}
```

---

## Self-Update Rule

Após QUALQUER correção do usuário:

> "Update memory/MEMORY.md com este learning para não repetir."

---

## Skills Disponíveis

- `/five-whys` - Perguntar 5x até ground truth
- `/assumption-test` - Testar suposição com evidência
- `/agents code-simplifier` - Simplificar código

---

## Quando Re-Planejar

Se algo der errado:
1. PARE imediatamente
2. Volte para plan mode
3. Re-planeje a fase atual
4. NÃO continue com approach quebrado
