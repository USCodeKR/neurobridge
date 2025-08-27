import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ---- Simple age-adjusted expectations (beta) ----
// NOTE: These are heuristic placeholders until we have enough in-app cohort data.
// They create a gentle decline with age and clamp to reasonable bounds for a 30s task.
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Expected counts in 30s for fist clenches
function expectedGrip30s(age?: number | null) {
  if (typeof age !== "number" || !isFinite(age)) return 70; // default adult
  // piecewise-linear: 20y -> 75, 60y -> 65, 80y -> 58, 90y -> 55
  const a = clamp(age, 3, 95);
  if (a <= 60) {
    return 75 - (a - 20) * (10 / 40); // 20~60: 75 -> 65
  } else if (a <= 80) {
    return 65 - (a - 60) * (7 / 20); // 60~80: 65 -> 58
  } else {
    return 58 - (a - 80) * (3 / 10); // 80~90: 58 -> 55
  }
}

// Expected balloon hits in 30s
function expectedBalloon30s(age?: number | null) {
  if (typeof age !== "number" || !isFinite(age)) return 45; // default adult
  // 20y -> 55, 60y -> 48, 80y -> 43, 90y -> 40
  const a = clamp(age, 3, 95);
  if (a <= 60) {
    return 55 - (a - 20) * (7 / 40); // 20~60: 55 -> 48
  } else if (a <= 80) {
    return 48 - (a - 60) * (5 / 20); // 60~80: 48 -> 43
  } else {
    return 43 - (a - 80) * (3 / 10); // 80~90: 43 -> 40
  }
}

// Convert a raw to an age-adjusted band by comparing to expectation
function bandFromRatio(ratio: number): "정상" | "주의" | "위험" {
  // >= 100% of expectation -> 정상, 80~99% -> 주의, <80% -> 위험
  if (ratio >= 1.0) return "정상";
  if (ratio >= 0.8) return "주의";
  return "위험";
}

export async function POST(req: NextRequest) {
  try {
    const { count, seconds, level, age, balloonHits, balloonDuration } =
      await req.json();

    if (typeof count !== "number" || typeof seconds !== "number" || !level) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    // 앱과 동일한 분류 규칙(안전하게 재확인)
    const band = count >= 70 ? "정상" : count >= 55 ? "주의" : "위험";

    // ---- Age-adjusted (beta) ----
    const expGrip = expectedGrip30s(age);
    const gripRatio = count / expGrip; // 1.0 == expected for age
    const bandGripAge = bandFromRatio(gripRatio);

    let bandBalloonAge: "정상" | "주의" | "위험" | null = null;
    let balloonRatio: number | null = null;
    if (
      typeof balloonHits === "number" &&
      typeof balloonDuration === "number" &&
      balloonDuration > 0
    ) {
      // Normalize hits to 30s equivalence to compare with expectation
      const hits30 = balloonHits * (30 / balloonDuration);
      const expBalloon = expectedBalloon30s(age);
      balloonRatio = hits30 / expBalloon;
      bandBalloonAge = bandFromRatio(balloonRatio);
    }

    const system = `
당신은 한국어 신경과 상담 도우미입니다. 사용자의 손동작 측정(주먹 쥐기)과 보조 과제(풍선 터뜨리기) 결과를 함께 고려해
친절하고 차분한 설명을 제공합니다. 과장하거나 단정적으로 진단하지 말고,
비의료적 참고 정보임을 분명히 하며, 필요 시 전문의 상담을 권고하세요.
- 주먹 쥐기: 반복 손 운동 빈도/리듬 → 운동 속도, 지속성, 피로 저항성.
- 풍선 터뜨리기: 시지각-운동 협응, 반응 속도, 선택/지속 주의, 처리 속도.
- 결과 해석 시 연령, 과제 난이도, 학습/게임 익숙함, 손 지배성(오른손/왼손) 등 교란요인을 반드시 언급.
- **절대 기준(앱 기본 임계값)**과 **연령 보정(기대치 대비 비율)**을 모두 제시하고, 상충 시 연령 보정 해석을 우선 제공.
- 신경학적 연관성은 가능성/경향성 수준으로만 설명(예: 파킨슨병의 서동증이 느린 반복 운동과 관련될 수 있음, 주의집중 저하가 반응 지연과 관련될 수 있음 등). 진단 단정 금지.
`;

    const user = `
입력 데이터:
- 사용자 나이: ${typeof age === "number" ? `${age}세` : "정보 없음"}
- 주먹 쥐기(절대 기준): 시간 ${seconds}초, 횟수 ${count}회, 분류 ${band} (정상: ≥70, 주의: 55~69, 위험: ≤55)
- 주먹 쥐기(연령 보정): 기대치 ${expGrip.toFixed(1)}회/30초 대비 ${(
      gripRatio * 100
    ).toFixed(0)}% → ${bandGripAge}
- 풍선 터뜨리기(절대 기준): ${
      typeof balloonHits === "number" && typeof balloonDuration === "number"
        ? `${balloonDuration}초 동안 ${balloonHits}개`
        : "실행 안 함/정보 없음"
    }
- 풍선 터뜨리기(연령 보정): ${
      typeof balloonRatio === "number" && balloonRatio !== null
        ? `30초 환산 ${(balloonHits! * (30 / balloonDuration!)).toFixed(
            1
          )}개 / 기대치 ${expectedBalloon30s(age).toFixed(1)}개 → ${(
            balloonRatio * 100
          ).toFixed(0)}% → ${bandBalloonAge}`
        : "정보 없음"
    }

요구사항:
1) 절대 기준과 연령 보정 결과를 함께 보여주되, 최종 해석은 연령 보정을 우선합니다. 6~10문장으로 쉽고 자연스럽게 설명하세요.
2) 나이를 고려한 톤 조절:
   - 영유아/어린이: 보호자 안내 중심(놀이 기반 훈련 팁 포함)
   - 성인: 자기관리 중심(집중/운동 훈련 루틴 제안)
   - 노년층: 예방/병원 상담 권고 톤(낙상 예방 등)
3) 측정 오차 가능성 1~2문장(카메라 각도/조명/프레임 드랍, 입력 지연, 손 지배성, 화면/입력 장치 익숙함, 난이도 등).
4) 동일 조건 재측정 팁 2~3가지 (간단·실천 가능).
5) 연령 보정 결과(${bandGripAge}${
      bandBalloonAge ? ` / 풍선 ${bandBalloonAge}` : ""
    })를 반영한 다음 행동 가이드를 제시.
6) 신경학적 관련성 설명은 가능성 수준으로만: 파킨슨병(서동증/운동 이행 지연), 본태성 떨림(정밀 클릭 어려움), 주의력 저하(ADHD 등), 경도인지장애/뇌졸중 후유(시공간/실행기능 저하). 단, 자가진단 경고 포함.
7) "본 결과는 참고용이며 의료진의 진료를 대체하지 않습니다." 반드시 포함.
8) 중복 표현 회피, 문장 연결 자연스럽게.
`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: "openai_error", detail: errText },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const message = data?.choices?.[0]?.message?.content?.trim();
    if (!message) {
      return NextResponse.json({ error: "no content" }, { status: 502 });
    }

    return NextResponse.json({ message }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
