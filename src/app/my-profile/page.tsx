"use client";
import Calendar from "@/components/Calendar";
import { useEffect, useState } from "react";

const MyProfile = () => {
  const [userInfo, setUserInfo] = useState({
    email: "",
    name: "",
    birth: "",
  });
  const [lastResult, setLastResult] = useState<null | {
    id?: string;
    takenAt?: string;
    score?: number;
    label?: string;
    summary?: string;
  }>(null);
  const [lastLoading, setLastLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setUserInfo({
          email: data.email,
          name: data.name,
          birth: data.birth,
        });
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    fetchUserInfo();
    async function fetchLastMeasurement() {
      try {
        const res = await fetch("/api/measurements/last");
        if (!res.ok) throw new Error("Failed to fetch last measurement");
        const data = await res.json();
        setLastResult(data);
      } catch (err) {
        console.error("Error fetching last measurement:", err);
        setLastResult(null);
      } finally {
        setLastLoading(false);
      }
    }
    fetchLastMeasurement();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">사용자 정보</h2>
        <div className="space-y-2 text-gray-700 text-sm">
          <p>
            <span className="font-medium">이메일:</span>{" "}
            {userInfo.email || "admin@naver.com"}
          </p>
          <p>
            <span className="font-medium">이름:</span>{" "}
            {userInfo.name || "김춘삼"}
          </p>
          <p>
            <span className="font-medium">생년월일:</span>{" "}
            {userInfo.birth || "1945-08-15"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="rounded-lg mt-4 bg-white p-4 shadow-sm h-[450px]">
          <Calendar size="md" className="w-full" />
        </div>
        <div className="rounded-lg mt-4 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">마지막 측정 결과</h2>
          {lastLoading ? (
            <p className="text-sm text-gray-500">불러오는 중…</p>
          ) : lastResult ? (
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">측정일:</span>{" "}
                {lastResult.takenAt
                  ? new Date(lastResult.takenAt).toLocaleString()
                  : "-"}
              </p>
              <p>
                <span className="font-medium">점수:</span>{" "}
                {typeof lastResult.score === "number" ? lastResult.score : "-"}
              </p>
              {lastResult.label && (
                <p>
                  <span className="font-medium">판정:</span> {lastResult.label}
                </p>
              )}
              {lastResult.summary && (
                <p className="text-gray-600 whitespace-pre-line">
                  {lastResult.summary}
                </p>
              )}
              {lastResult.id && (
                <p className="text-xs text-gray-400">ID: {lastResult.id}</p>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 space-y-2">
              <p>
                안녕하세요. 81세의 나이에 주먹 쥐기와 풍선 터뜨리기 결과를 함께
                살펴보겠습니다.
              </p>
              <p>
                주먹 쥐기에서는 30초 동안 38회로 측정되어 위험군에
                분류되었습니다. 이는 운동의 빈도와 리듬이 낮은 편임을 나타내며,
                나이에 따라 피로 저항성이 저하된 것일 수 있습니다.
              </p>
              <p>
                풍선 터뜨리기에서는 30초 동안 44개를 터뜨려 초당 1.47개의 반응
                속도를 보였습니다. 이는 시지각-운동 협응과 주의 집중의 측면에서
                양호한 결과로 해석될 수 있습니다.
              </p>
              <p>
                하지만 주먹 쥐기의 결과가 위험군에 해당하므로, 낙상 예방을 위한
                예방 조치를 고려해 보시는 것이 좋습니다. 병원에서의 상담도
                권장드립니다.
              </p>
              <p>
                측정 과정에서 발생할 수 있는 오차가 있을 수 있으니, 카메라
                각도나 조명 상태, 손 지배성 등을 신경 써 주시면 좋겠습니다. 동일
                조건에서 재측정을 원하신다면, 같은 시간대에 조용한 환경에서
                측정해 보시고, 손에 익숙한 도구를 사용하시는 것이 도움이 될
                것입니다.
              </p>
              <p>
                현재 주먹 쥐기 결과가 위험군인 만큼, 일상에서 간단한 손 운동을
                꾸준히 하시고, 주의력을 높이기 위한 간단한 게임이나 퍼즐 활동을
                추가해 보세요.
              </p>
              <p>
                신경학적으로는, 현재의 결과가 파킨슨병의 서동증이나 주의력
                저하와 연관될 수 있는 가능성이 있으나, 이는 단순한 경향성일
                뿐입니다. 자가진단은 지양하시고, 필요시 전문가와 상담하시길
                권장합니다. 본 결과는 참고용이며 의료진의 진료를 대체하지
                않습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
