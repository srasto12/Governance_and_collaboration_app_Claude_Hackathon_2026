import { NextResponse } from "next/server";

export function json(data, init) {
  return NextResponse.json(data, init);
}

export function badRequest(message, status = 400) {
  return json({ error: message }, { status });
}
