import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    project: 'Maquina Team Gym System',
    version: '0.1.0',
    phase: 'Fase 1 — Base arquitetural',
    timestamp: new Date().toISOString(),
  });
}
