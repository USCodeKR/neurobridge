"use client";

import Card from "@/components/Card";

import old1 from "@/assets/image/old1.png";
import old2 from "@/assets/image/old2.png";
import old3 from "@/assets/image/old3.png";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  const titleFull = "간편한 손동작 측정으로 뇌질환 위험,\n미리 대비하세요.";
  const descFull =
    "뉴럴브릿지는 매일 간단한 손동작을 측정하고 기록하여 뇌 건강의 변화를\n추적하고, 질환의 위험 신호를 조기에 발견할 수 있도록 돕는 서비스입니다.";

  const [titleTyped, setTitleTyped] = useState("");
  const [descTyped, setDescTyped] = useState("");
  const [isTitleDone, setIsTitleDone] = useState(false);
  const [showCaret, setShowCaret] = useState(true);

  useEffect(() => {
    // Blink caret
    const caretTimer = setInterval(() => setShowCaret((v) => !v), 500);
    return () => clearInterval(caretTimer);
  }, []);

  useEffect(() => {
    // Type the title first
    let i = 0;
    const speed = 35; // ms per character
    const timer = setInterval(() => {
      setTitleTyped(titleFull.slice(0, i + 1));
      i++;
      if (i >= titleFull.length) {
        clearInterval(timer);
        setIsTitleDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isTitleDone) return;
    // small delay before starting the description
    const delay = setTimeout(() => {
      let j = 0;
      const speed = 20; // ms per character for body
      const timer = setInterval(() => {
        setDescTyped(descFull.slice(0, j + 1));
        j++;
        if (j >= descFull.length) {
          clearInterval(timer);
        }
      }, speed);
      // cleanup for timer created in this scope
      return () => clearInterval(timer);
    }, 250);
    return () => clearTimeout(delay);
  }, [isTitleDone]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };
  return (
    <div>
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold text-slate-800 mb-6 break-keep whitespace-pre-line inline-block">
          {titleTyped}
          <span
            className={`ml-0.5 align-middle relative bottom-2 ${
              showCaret ? "opacity-100" : "opacity-0"
            }`}
          >
            |
          </span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto break-keep whitespace-pre-line">
          {descTyped}
        </p>
      </section>
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col gap-[100px] justify-center items-center">
          <Card phrase="행동분석이 필요한 부분을 찾습니다." image={old1} />
          <Card
            phrase="테스트를 통해 뇌 건강 신호를 확인합니다."
            image={old2}
          />
          <Card phrase="행동분석 결과를 분석합니다." image={old3} />
        </div>
        <div
          className="flex items-center justify-center cursor-pointer mt-[50px] mb-[40px] w-[300px] md:w-[700px] h-[56px] bg-[#4E3A00] rounded-2xl"
          onClick={toggleMenu}
        >
          <div className="text-[#ffffff]">측정 시작하기</div>
        </div>

        {isOpen && <Modal closeMenu={closeMenu} />}
      </div>
    </div>
  );
}
