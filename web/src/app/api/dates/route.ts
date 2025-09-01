// src/app/api/tests/dates/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD
  const userId = searchParams.get("userId");

  // TODO: 실제로는 DB에서 userId + 날짜 범위로 조회
  // 데모: 2025년 8월에 한정하여 특정 날짜만 체크
  if (!from || !to) return NextResponse.json([], { status: 200 });

  const [y, m] = from.split("-").map(Number);
  let demo: string[] = [];

  if (m === 8) {
    demo = [
      `${y}-08-20`,
      `${y}-08-21`,
      `${y}-08-23`,
      `${y}-08-26`,
      `${y}-08-27`,
    ];
  }

  return NextResponse.json(demo);
}
