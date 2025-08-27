"use client";
import HandTracker from "@/components/HandTracker";
import Image from "next/image";
import garlicImg from "@/assets/image/garlic.png";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GameMode = "balloon" | "garlic-grab" | "garlic-smash";

const BalloonGame: React.FC<{
  durationSec?: number;
  onComplete: (score: number) => void;
  gameMode: GameMode;
}> = ({ durationSec = 30, onComplete, gameMode }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [running, setRunning] = useState(true);
  const [balloons, setBalloons] = useState<
    {
      id: number;
      leftPct: number;
      size: number;
      speed: number;
      hue: number;
      breaking?: boolean;
    }[]
  >([]);
  const [bursts, setBursts] = useState<
    {
      id: number;
      x: number;
      y: number;
      type: "balloon" | "garlic";
      dx?: number;
      dy?: number;
      rot?: number;
    }[]
  >([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const spawnTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // 풍선/마늘 생성
  const spawnBalloon = useCallback(() => {
    setBalloons((prev) => {
      const id = ++idRef.current;
      const leftPct = Math.max(5, Math.min(95, Math.random() * 100));
      const isGarlic = gameMode !== "balloon";
      const size = isGarlic
        ? 36 + Math.round(Math.random() * 28)
        : 40 + Math.round(Math.random() * 50); // garlic smaller
      const speed =
        (isGarlic ? 2.4 : 2.0) + Math.random() * (isGarlic ? 1.6 : 2.0);
      const hue = Math.floor(Math.random() * 360);
      return [...prev, { id, leftPct, size, speed, hue, breaking: false }];
    });
  }, [gameMode]);

  // 풍선/마늘 터뜨리기
  const popBalloon = useCallback(
    (id: number, e?: React.PointerEvent<HTMLButtonElement>) => {
      if (!containerRef.current) return;
      // 위치 계산
      let x = 0,
        y = 0;
      if (e) {
        const rect = containerRef.current.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      if (gameMode === "balloon") {
        // 풍선: 즉시 제거 + 점수
        if (e) {
          const burstId = ++idRef.current;
          setBursts((prev) => [
            ...prev,
            { id: burstId, x, y, type: "balloon" },
          ]);
          window.setTimeout(() => {
            setBursts((prev) => prev.filter((b) => b.id !== burstId));
          }, 420);
        }
        setBalloons((prev) => prev.filter((b) => b.id !== id));
        setScore((s) => s + 1);
        return;
      }
      // 마늘: 깨짐 상태 → 250ms 후 제거
      setBalloons((prev) =>
        prev.map((b) => (b.id === id ? { ...b, breaking: true } : b))
      );
      // 파편 여러개 생성
      const pieces = 6;
      const base = idRef.current;
      const newBursts = Array.from({ length: pieces }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.6 - 0.3;
        const dist = 40 + Math.random() * 30;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist * -1; // 위쪽으로 약간
        const rot = Math.random() * 180 - 90;
        return { id: base + i + 1, x, y, type: "garlic" as const, dx, dy, rot };
      });
      idRef.current += pieces;
      setBursts((prev) => [...prev, ...newBursts]);
      window.setTimeout(() => {
        // 파편 삭제
        setBursts((prev) =>
          prev.filter((b) => !newBursts.some((nb) => nb.id === b.id))
        );
      }, 480);
      // 실제 제거 및 점수 반영 (깨짐 애니메이션 시간 후)
      window.setTimeout(() => {
        setBalloons((prev) => prev.filter((b) => b.id !== id));
        setScore((s) => s + 1);
      }, 250);
    },
    [gameMode]
  );

  const despawnBalloon = useCallback((id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // 타이머 & 스포너 세팅
  useEffect(() => {
    if (!running) return;
    // 350~700ms 사이 간격으로 생성 (난수)
    const spawn = () => {
      spawnBalloon();
      const next = 350 + Math.random() * 350;
      spawnTimerRef.current = window.setTimeout(spawn, next);
    };
    spawn();

    countdownRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, [running, spawnBalloon, gameMode]);

  // 종료 처리
  useEffect(() => {
    if (timeLeft === 0 && running) {
      setRunning(false);
      if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      // 300ms 후 완료 콜백 (마지막 렌더 여유)
      window.setTimeout(() => onComplete(score), 300);
    }
  }, [timeLeft, running, score, onComplete]);

  return (
    <div className="relative w-full max-w-3xl mx-auto bg-white rounded-lg shadow p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="text-sm text-gray-600">
          {gameMode === "balloon"
            ? "30초 안에 풍선을 최대한 많이 터뜨려 보세요!"
            : gameMode === "garlic-grab"
            ? "30초 동안 화면에 나타나는 마늘을 빠르게 집어보세요!"
            : "30초 동안 마늘을 재빨리 내리쳐 부수세요!"}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-gray-500">남은 시간</span>{" "}
            <span className="font-semibold">{timeLeft}s</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">점수</span>{" "}
            <span className="font-semibold">{score}</span>
          </div>
          <div className="hidden sm:block text-xs px-2 py-1 rounded bg-gray-100">
            {gameMode === "balloon"
              ? "풍선 터뜨리기"
              : gameMode === "garlic-grab"
              ? "마늘 잡기"
              : "마늘 부수기"}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[420px] bg-gradient-to-t from-sky-50 to-white select-none touch-manipulation"
      >
        {/* 풍선/마늘들 */}
        {balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            className={
              (gameMode === "balloon" ? "balloon" : "garlic") +
              (b.breaking ? " is-breaking" : "") +
              " focus:outline-none relative"
            }
            style={
              {
                ["--h"]: b.hue,
                ["--size"]: `${b.size}px`,
                ["--left"]: `${b.leftPct}%`,
                ["--speed"]: `${b.speed}s`,
              } as React.CSSProperties
            }
            onPointerDown={(e) => {
              if (!b.breaking) popBalloon(b.id, e);
            }}
            onAnimationEnd={() => despawnBalloon(b.id)}
            aria-label={
              gameMode === "balloon"
                ? "풍선 터뜨리기"
                : gameMode === "garlic-grab"
                ? "마늘 잡기"
                : "마늘 부수기"
            }
          >
            {gameMode === "balloon" ? (
              <>
                <span aria-hidden className="balloon-knot" />
                <span aria-hidden className="balloon-string" />
              </>
            ) : (
              <>
                {/* 실제 이미지 연결 (임시 경로) - 정적 import 사용 */}
                <Image
                  aria-hidden
                  className="garlic-img"
                  src={garlicImg}
                  alt="garlic"
                  fill
                  sizes="64px"
                  priority={false}
                  draggable={false}
                />
                {/* crack 오버레이 이미지는 준비되면 다시 추가 */}
              </>
            )}
          </button>
        ))}

        {/* 클릭 이펙트 (마늘/풍선 파편) */}
        {bursts.map((p) =>
          p.type === "garlic" ? (
            <span
              key={p.id}
              className="absolute pointer-events-none burst-garlic-piece"
              style={
                {
                  left: p.x,
                  top: p.y,
                  ["--dx"]: `${p.dx ?? 0}px`,
                  ["--dy"]: `${p.dy ?? -40}px`,
                  ["--rot"]: `${p.rot ?? 0}deg`,
                } as React.CSSProperties
              }
              aria-hidden
            />
          ) : (
            <span
              key={p.id}
              className="absolute pointer-events-none burst-balloon"
              style={{ left: p.x, top: p.y }}
              aria-hidden
            />
          )
        )}

        {/* 하단 바닥선 */}
        <div className="absolute inset-x-0 bottom-0 h-2 bg-sky-200/60" />
      </div>

      <style jsx>{`
        :global(.cursor-grab) {
          cursor: grab;
        }
        :global(.cursor-punch) {
          cursor: pointer;
        }
        @keyframes rise {
          0% {
            bottom: -10%;
            opacity: 1;
          }
          90% {
            bottom: 95%;
            opacity: 1;
          }
          100% {
            bottom: 105%;
            opacity: 0;
          }
        }
        .balloon {
          position: absolute;
          left: var(--left);
          bottom: -10%;
          width: var(--size);
          height: calc(var(--size) * 1.3);
          transform: translateX(-50%);
          border-radius: 9999px;
          will-change: bottom, transform;
          animation: rise var(--speed) linear forwards,
            sway calc(var(--speed) * 0.9) ease-in-out infinite;
          /* Glossy layered gradient */
          background: radial-gradient(
              120% 100% at 28% 28%,
              hsl(var(--h) 90% 95%) 0%,
              hsla(var(--h), 95%, 95%, 0.6) 18%,
              transparent 22%
            ),
            radial-gradient(
              90% 70% at 60% 65%,
              hsla(var(--h), 70%, 35%, 0.35) 0%,
              transparent 60%
            ),
            radial-gradient(
              100% 100% at 50% 30%,
              hsl(var(--h) 85% 72%) 0%,
              hsl(var(--h) 80% 58%) 45%,
              hsl(var(--h) 75% 50%) 100%
            );
          box-shadow: inset -10px -12px 22px rgba(0, 0, 0, 0.18),
            inset 6px 8px 18px rgba(255, 255, 255, 0.55),
            0 6px 14px rgba(0, 0, 0, 0.14);
          border: 1px solid hsla(var(--h), 70%, 30%, 0.35);
        }
        .balloon::after {
          /* subtle specular highlight */
          content: "";
          position: absolute;
          top: 18%;
          left: 22%;
          width: 28%;
          height: 18%;
          border-radius: 50%;
          background: radial-gradient(
            closest-side,
            rgba(255, 255, 255, 0.9),
            rgba(255, 255, 255, 0.15) 70%,
            transparent 100%
          );
          filter: blur(0.5px);
          pointer-events: none;
        }
        .balloon:active {
          transform: translateX(-50%) scale(0.96);
        }
        .balloon-knot {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 8px;
          background: hsl(var(--h) 70% 45%);
          border-radius: 2px 2px 6px 6px;
          box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.18);
        }
        .balloon-string {
          position: absolute;
          bottom: -22px;
          left: 50%;
          width: 2px;
          height: 18px;
          transform: translateX(-50%);
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0.1)
          );
          border-radius: 1px;
        }
        .garlic {
          position: absolute;
          left: var(--left);
          bottom: -10%;
          width: var(--size);
          height: calc(var(--size) * 1.1);
          transform: translateX(-50%);
          border-radius: 10px;
          will-change: bottom, transform;
          animation: rise var(--speed) linear forwards,
            sway calc(var(--speed) * 0.9) ease-in-out infinite;
          background: none;
        }
        .garlic-img,
        .garlic-crack {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          user-select: none;
        }
        .garlic-crack {
          opacity: 0;
          transform: scale(0.95);
        }
        .garlic.is-breaking {
          animation: none; /* 깨질 때 상승 중지 */
          transform: translateX(-50%) scale(0.9);
        }
        .garlic.is-breaking .garlic-crack {
          opacity: 1;
          animation: crack 250ms ease-out forwards;
        }
        @keyframes crack {
          0% {
            opacity: 0;
            transform: scale(0.92) rotate(0deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.02) rotate(1.5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        .burst-garlic-piece {
          width: 18px;
          height: 18px;
          background-image: url("/assets/image/old2.png"); /* 임시 파편 이미지 - 교체 가능 */
          background-size: cover;
          background-repeat: no-repeat;
          transform: translate(-50%, -50%);
          animation: fly 420ms ease-out forwards;
          filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.18));
        }
        @keyframes fly {
          to {
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))
              rotate(var(--rot));
            opacity: 0;
          }
        }

        /* 클릭 이펙트 */
        @keyframes burstOut {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0.9;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0;
          }
        }
        .burst-balloon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: radial-gradient(
              circle,
              rgba(255, 255, 255, 0.9),
              rgba(255, 255, 255, 0) 60%
            ),
            conic-gradient(
              from 0deg,
              #ff9aa2,
              #ffb7b2,
              #ffdac1,
              #e2f0cb,
              #b5ead7,
              #c7ceea,
              #ff9aa2
            );
          position: absolute;
          transform: translate(-50%, -50%);
          animation: burstOut 420ms ease-out forwards;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
        }
        .burst-garlic {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: radial-gradient(
              circle at 40% 40%,
              rgba(255, 255, 255, 0.9),
              rgba(255, 255, 255, 0) 55%
            ),
            conic-gradient(
              from 0deg,
              #f5ead7,
              #efe0c4,
              #e2d2af,
              #c6b38a,
              #f5ead7
            );
          position: absolute;
          transform: translate(-50%, -50%);
          animation: burstOut 420ms ease-out forwards;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45);
        }
        @keyframes sway {
          0% {
            transform: translateX(-50%) rotate(-1.2deg);
          }
          50% {
            transform: translateX(calc(-50% + 3px)) rotate(1.2deg);
          }
          100% {
            transform: translateX(-50%) rotate(-1.2deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .balloon {
            animation: rise var(--speed) linear forwards;
          }
        }
      `}</style>
    </div>
  );
};

type AssessmentLevel = "정상" | "주의" | "위험";

const classify = (count: number): AssessmentLevel => {
  if (count >= 70) return "정상";
  if (count >= 55) return "주의"; // 관심 -> 주의 단계로 표현
  return "위험"; // 55회 이하
};

// 풍선 터뜨리기 분류: 45개 이상=정상, 20~44개=주의, 20미만=위험
const classifyBalloon = (hits: number): AssessmentLevel => {
  if (hits >= 45) return "정상";
  if (hits >= 20) return "주의";
  return "위험";
};

const makeLocalSummary = (
  count: number,
  seconds: number,
  level: AssessmentLevel
) => {
  const rate = (count / seconds).toFixed(2);
  const base = `측정 시간 동안 주먹을 ${count}회 쥐었습니다 (초당 ${rate}회). 결과는 \"${level}\" 범주입니다.`;
  if (level === "정상") {
    return (
      base +
      " 전반적으로 손 운동 빈도와 리듬이 충분히 유지되고 있어, 현재로서는 특이 소견이 낮습니다. 다만 일시적 피로, 카메라 각도, 조명 등 환경 요인에 따라 수치가 달라질 수 있으니 주기적으로 재측정을 권장합니다."
    );
  }
  if (level === "주의") {
    return (
      base +
      " 평균 권장 빈도에 약간 못 미치거나 변동성이 관찰될 수 있습니다. 최근 수면, 스트레스, 약물 복용 여부 등을 확인하고, 동일 조건에서 재측정해 일관성을 확인하세요. 증상이 지속되거나 손의 떨림/경직 등 다른 이상이 동반되면 전문의 상담을 권합니다."
    );
  }
  return (
    base +
    " 권장 기준에 현저히 미달하는 결과입니다. 측정 환경 문제를 먼저 점검(카메라 위치/밝기, 프레임 누락 등)한 뒤 재측정하시고, 동일 결과가 반복되면 신경과 전문 진료를 검토해 주세요."
  );
};

const Measurement = () => {
  const [seconds] = useState<number>(30);
  const [count, setCount] = useState<number | null>(null);
  const [level, setLevel] = useState<AssessmentLevel | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [age, setAge] = useState<number | "">("");
  const [started, setStarted] = useState<boolean>(false);

  const [balloonScore, setBalloonScore] = useState<number | null>(null);
  const [gameRunning, setGameRunning] = useState<boolean>(false);
  const [balloonCountdown, setBalloonCountdown] = useState<number | null>(null);
  const [balloonStarted, setBalloonStarted] = useState<boolean>(false);
  const [balloonSeconds] = useState<number>(30);

  const balloonLevel = useMemo(
    () => (balloonScore !== null ? classifyBalloon(balloonScore) : null),
    [balloonScore]
  );

  const handleComplete = useCallback(
    async (finalCount: number, durationSec?: number) => {
      const s = durationSec ?? seconds;
      setCount(finalCount);
      const l = classify(finalCount);
      setLevel(l);
      setLoading(true);

      // 1) 로컬 요약 즉시 표시 (빠른 피드백)
      const local = makeLocalSummary(finalCount, s, l);
      setSummary(local);
      setGameRunning(true);
      setBalloonCountdown(3);
      setBalloonStarted(false);

      // 2) (선택) 서버의 GPT API와 연동 시도. 실패해도 로컬 요약을 유지.
      try {
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count: finalCount,
            seconds: s,
            level: l,
            age: typeof age === "number" ? age : null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.message && typeof data.message === "string") {
            setSummary(data.message);
          }
        }
      } catch (_) {
        // API가 아직 없거나 실패한 경우: 로컬 요약 유지
      } finally {
        setLoading(false);
      }
    },
    [seconds, age]
  );
  useEffect(() => {
    if (!gameRunning) return;
    if (balloonCountdown === null) return;

    if (balloonCountdown > 0) {
      const t = window.setTimeout(
        () => setBalloonCountdown((c) => (c ?? 1) - 1),
        1000
      );
      return () => window.clearTimeout(t);
    }

    // balloonCountdown reached 0 -> start the BalloonGame and clear the counter
    setBalloonStarted(true);
    setBalloonCountdown(null);
  }, [gameRunning, balloonCountdown]);

  const headerText = useMemo(() => {
    if (level === "정상") return "정상 결과";
    if (level === "주의") return "주의 필요";
    if (level === "위험") return "위험: 추가 확인 권장";
    return "손동작 측정";
  }, [level]);

  const headerClass = useMemo(() => {
    if (level === "정상") return "text-emerald-600";
    if (level === "주의") return "text-amber-600";
    if (level === "위험") return "text-red-600";
    return "";
  }, [level]);

  const reset = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        {count === null && (
          <p className="text-lg text-gray-600 mt-2">
            웹캠을 켜고 카메라에 손바닥을 보여주세요. 주먹 쥐기 테스트를
            진행합니다.
          </p>
        )}
      </div>

      {!started && count === null && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-lg border bg-white/60">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            나이
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={age === "" ? "" : age}
            onChange={(e) => {
              const v = e.target.value;
              setAge(v === "" ? "" : Number(v));
            }}
            placeholder="예: 3 (만 3세), 35, 72"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring"
          />
          <p className="mt-2 text-xs text-gray-500">
            개인화된 분석을 위해 나이를 입력하세요.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setStarted(true)}
              disabled={age === ""}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인 후 측정 시작
            </button>
          </div>
        </div>
      )}

      {started && count === null ? (
        <HandTracker onComplete={handleComplete} targetSeconds={seconds} />
      ) : !started && count === null ? (
        <div className="max-w-2xl mx-auto text-center text-gray-500 py-10">
          나이를 입력하고 <span className="font-medium">확인</span> 버튼을
          누르면 측정을 시작합니다.
        </div>
      ) : null}

      {count !== null && gameRunning && (
        <section className="mt-8 relative">
          <h2 className="sr-only">풍선 터뜨리기</h2>

          {count !== null && gameRunning && balloonCountdown !== null && (
            <div className="max-w-3xl mx-auto mb-4 flex items-center justify-end gap-2 text-sm">
              <span className="text-gray-600">게임 모드:</span>
              {/* Note: 내부 상태를 상위에서 들고 있지 않으므로 안내용 라벨만 표시 */}
              <span className="px-2 py-1 rounded bg-gray-100">
                설정은 아래 컴포넌트 prop으로 전달됩니다
              </span>
            </div>
          )}

          {/* Countdown overlay: show when countdown is active and game not started */}
          {!balloonStarted && (
            <div className="relative w-full max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
              <div className="h-[420px] flex items-center justify-center bg-gradient-to-t from-sky-50 to-white">
                <div className="text-center select-none">
                  <div className="text-6xl md:text-7xl font-extrabold tracking-tight">
                    {balloonCountdown ?? 3}
                  </div>
                </div>
              </div>
            </div>
          )}

          {balloonStarted && (
            <BalloonGame
              durationSec={balloonSeconds}
              gameMode={level === "정상" ? "garlic-grab" : "garlic-smash"}
              onComplete={async (score) => {
                setBalloonScore(score);
                setLoading(true);
                try {
                  const res = await fetch("/api/assessment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      count: count!,
                      seconds,
                      level: level!,
                      age: typeof age === "number" ? age : null,
                      balloonHits: score,
                      balloonDuration: balloonSeconds,
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data?.message && typeof data.message === "string") {
                      setSummary(data.message);
                    } else {
                      setSummary(
                        (prev) =>
                          `${prev}\n보조 과제(풍선 터뜨리기): ${balloonSeconds}초 동안 ${score}개 성공 (분류: ${classifyBalloon(
                            score
                          )}).`
                      );
                    }
                  } else {
                    setSummary(
                      (prev) =>
                        `${prev}\n보조 과제(풍선 터뜨리기): ${balloonSeconds}초 동안 ${score}개 성공 (분류: ${classifyBalloon(
                          score
                        )}).`
                    );
                  }
                } catch (_) {
                  setSummary(
                    (prev) =>
                      `${prev}\n보조 과제(풍선 터뜨리기): ${balloonSeconds}초 동안 ${score}개 성공 (분류: ${classifyBalloon(
                        score
                      )}).`
                  );
                } finally {
                  setLoading(false);
                  setGameRunning(false);
                  setBalloonStarted(false);
                }
              }}
            />
          )}
        </section>
      )}

      {count !== null && !gameRunning && balloonScore !== null && (
        <section className="mt-8 max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">최종 결과</h2>
            </div>
            <button
              onClick={reset}
              className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
            >
              다시 측정
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded border">
              <div className="text-xs text-gray-500">주먹 쥔 총 횟수</div>
              <div className="text-xl font-bold">{count}회</div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-xs text-gray-500">측정 시간</div>
              <div className="text-xl font-bold">{seconds}초</div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-xs text-gray-500">분류</div>
              <div className="text-xl font-bold">{level}</div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-xs text-gray-500">풍선 터뜨린 개수</div>
              <div className="text-xl font-bold">
                {balloonScore}개 / {balloonSeconds}초
              </div>
            </div>
            <div className="p-4 rounded border">
              <div className="text-xs text-gray-500">풍선 분류</div>
              <div className="text-xl font-bold">{balloonLevel}</div>
            </div>
          </div>
          <div className="mt-6 leading-7">
            {loading ? (
              <div className="w-full mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 animate-progress" />
                </div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  분석 중… 잠시만 기다려주세요
                </p>
              </div>
            ) : (
              <div className="whitespace-pre-line">{summary}</div>
            )}
          </div>
          <style jsx>{`
            @keyframes progress {
              0% {
                width: 0%;
              }
              50% {
                width: 60%;
              }
              100% {
                width: 100%;
              }
            }
            .animate-progress {
              animation: progress 1.8s ease-in-out infinite;
            }
          `}</style>
        </section>
      )}
    </main>
  );
};

export default Measurement;
