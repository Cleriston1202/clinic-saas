import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

interface TestMessageBody {
  to?: string;
  message?: string;
}

function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "");
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  let body: TestMessageBody;
  try {
    body = (await request.json()) as TestMessageBody;
  } catch {
    return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 });
  }

  const to = normalizePhone(String(body.to ?? "").trim());
  const message = String(body.message ?? "").trim();

  if (!to) {
    return NextResponse.json({ error: "Campo 'to' e obrigatorio" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "Campo 'message' e obrigatorio" }, { status: 400 });
  }

  const result = await sendWhatsAppMessage({ to, message });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Falha no envio" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, provider: process.env.WHATSAPP_PROVIDER ?? "zapi", to });
}
