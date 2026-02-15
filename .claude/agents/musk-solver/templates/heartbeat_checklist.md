# Heartbeat Checklist

Execute este checklist a cada wakeup (15 min ou ao iniciar):

## 1. Load Context
- [ ] Read WORKING.md
- [ ] Check minha fase atual
- [ ] Verificar meu status em subagent table

## 2. Check for Work
- [ ] Scan shared/tasks.json para tasks assigned a mim
- [ ] Check shared/comments.json para @mentions
- [ ] Scan shared/activity.json (últimas 2h)

## 3. Evaluate
- [ ] Tenho trabalho pendente? → Execute
- [ ] Estou blocked? → Reportar e notificar
- [ ] Nada para fazer? → HEARTBEAT_OK

## 4. Execute (se aplicável)
- [ ] Trabalhar na task atual
- [ ] Seguir critérios de saída da fase
- [ ] Documentar progresso

## 5. Update State
- [ ] Update WORKING.md com estado atual
- [ ] Post em shared/activity.json
- [ ] Post em shared/comments.json se relevante

## 6. Report
- [ ] HEARTBEAT_OK - nada pendente
- [ ] HEARTBEAT_WORKING - em progresso
- [ ] HEARTBEAT_BLOCKED - precisa de ajuda
- [ ] HEARTBEAT_DONE - fase completa

## Timestamp
Executed: {timestamp}
Result: {OK|WORKING|BLOCKED|DONE}
