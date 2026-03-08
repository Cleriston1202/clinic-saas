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
  const { supabase } = context;
  const { data, error } = await supabase
    .from("patients")
    .update({
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      birth_date: body.birth_date ?? null,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
