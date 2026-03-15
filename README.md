# Clinica SaaS

Aplicacao Next.js para gestao de clinica odontologica, com agenda, pacientes, servicos e agendamento publico.

## Setup rapido

1. Instale dependencias:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Preencha as variaveis do Supabase no `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Rode o projeto:

```bash
npm run dev
```

## Configuracao do WhatsApp

O envio de lembrete usa `src/lib/whatsapp.ts` e suporta 3 provedores:

- `zapi`
- `evolution`
- `twilio`

Defina no `.env`:

```env
WHATSAPP_PROVIDER=zapi
WHATSAPP_API_URL=
WHATSAPP_INSTANCE_ID=
WHATSAPP_TOKEN=
WHATSAPP_CLIENT_TOKEN=
WHATSAPP_FROM=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

### 1) Z-API

Use:

```env
WHATSAPP_PROVIDER=zapi
WHATSAPP_API_URL=https://api.z-api.io
WHATSAPP_INSTANCE_ID=<instance-id>
WHATSAPP_TOKEN=<token>
WHATSAPP_CLIENT_TOKEN=<client-token-opcional>
```

`WHATSAPP_FROM` nao e necessario no modo `zapi`.
Se sua conta exigir `client-token`, preencha `WHATSAPP_CLIENT_TOKEN`.

### 2) Evolution API

Use:

```env
WHATSAPP_PROVIDER=evolution
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_INSTANCE_ID=<nome-ou-id-da-instancia>
WHATSAPP_TOKEN=<apikey>
```

`WHATSAPP_FROM` nao e necessario no modo `evolution`.

### 3) Twilio WhatsApp

Use:

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<AC...>
TWILIO_AUTH_TOKEN=<token>
WHATSAPP_FROM=+14155238886
```

Observacao: `WHATSAPP_FROM` deve ser o numero/sender habilitado no Twilio (com codigo do pais).

## Lembretes automaticos (cron)

A rota de lembrete e:

- `GET /api/cron/reminders`

Ela valida cabecalho com segredo:

```env
CRON_SECRET=<seu-segredo>
```

No deploy com Vercel, o agendamento esta em `vercel.json` para rodar a cada 10 minutos.

## Teste manual do lembrete

Com app rodando, teste no terminal:

```powershell
Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/cron/reminders" -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

Resposta esperada:

- `checked`: quantos agendamentos foram avaliados
- `sent`: quantas mensagens foram enviadas
- `failures`: lista de falhas por `appointment.id`

## Teste manual de WhatsApp (direto)

Para validar o provedor sem depender da janela de 2h/24h, use:

- `POST /api/whatsapp/test`

Exemplo PowerShell:

```powershell
$secret = (Get-Content .env | Where-Object { $_ -match '^CRON_SECRET=' } | Select-Object -First 1).Split('=')[1]

Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/whatsapp/test" `
	-Headers @{ Authorization = "Bearer $secret"; "Content-Type" = "application/json" } `
	-Body '{"to":"5511999998888","message":"Teste de envio WhatsApp da Clinica SaaS"}'
```

Se a porta `3000` estiver ocupada, troque para `3001` no comando.

## Formato de telefone recomendado

Para reduzir falhas de entrega, salve telefone dos pacientes com DDI, por exemplo:

- `5511999998888`
- `+5511999998888`

## Troubleshooting rapido

- `Credenciais da Z-API nao configuradas`: falta `WHATSAPP_API_URL`, `WHATSAPP_INSTANCE_ID` ou `WHATSAPP_TOKEN`.
- Erro `your client-token is not configured`: preencha `WHATSAPP_CLIENT_TOKEN` no `.env`.
- `Credenciais da Evolution API nao configuradas`: falta `WHATSAPP_API_URL`, `WHATSAPP_INSTANCE_ID` ou `WHATSAPP_TOKEN`.
- `Credenciais do Twilio nao configuradas`: falta `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ou `WHATSAPP_FROM`.
- Se `sent` ficar `0` com `checked > 0`, confira se ha consultas na janela de 24h ou 2h.
