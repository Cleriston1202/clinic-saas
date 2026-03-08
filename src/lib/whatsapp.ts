type WhatsAppProvider = "zapi" | "evolution" | "twilio";

export interface ReminderPayload {
  to: string;
  message: string;
}

const provider = (process.env.WHATSAPP_PROVIDER ?? "zapi") as WhatsAppProvider;

export async function sendWhatsAppMessage(payload: ReminderPayload) {
  if (!payload.to) {
    return { ok: false, error: "Telefone do paciente não informado" };
  }

  switch (provider) {
    case "evolution":
      return sendViaEvolution(payload);
    case "twilio":
      return sendViaTwilio(payload);
    case "zapi":
    default:
      return sendViaZApi(payload);
  }
}

async function sendViaZApi(payload: ReminderPayload) {
  const baseUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;

  if (!baseUrl || !token || !instanceId) {
    return { ok: false, error: "Credenciais da Z-API não configuradas" };
  }

  const response = await fetch(`${baseUrl}/instances/${instanceId}/token/${token}/send-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: payload.to, message: payload.message }),
  });

  return { ok: response.ok, error: response.ok ? undefined : await response.text() };
}

async function sendViaEvolution(payload: ReminderPayload) {
  const baseUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;

  if (!baseUrl || !token || !instanceId) {
    return { ok: false, error: "Credenciais da Evolution API não configuradas" };
  }

  const response = await fetch(`${baseUrl}/message/sendText/${instanceId}`, {
    method: "POST",
    headers: {
      apikey: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number: payload.to, text: payload.message }),
  });

  return { ok: response.ok, error: response.ok ? undefined : await response.text() };
}

async function sendViaTwilio(payload: ReminderPayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "Credenciais do Twilio não configuradas" };
  }

  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${payload.to}`,
    Body: payload.message,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  return { ok: response.ok, error: response.ok ? undefined : await response.text() };
}
