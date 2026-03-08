import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

interface Params {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const payload: Record<string, unknown> = {};

  if (body.start_time) payload.start_time = body.start_time;
  if (body.end_time) payload.end_time = body.end_time;
  if (body.status) payload.status = body.status;
  if (body.notes !== undefined) payload.notes = body.notes;

  const { data, error } = await context.supabase
    .from("appointments")
    .update(payload)
    .eq("id", params.id)
    .select("*, patient:patients(id,name,phone), doctor:doctors(id,name,specialty)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
