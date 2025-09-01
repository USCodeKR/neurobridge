"use client";

import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

const Header = () => {
  const { isLoggedIn, login, logout } = useAuthStore();

  // 컴포넌트가 처음 렌더링될 때 로그인 상태 초기화
  useEffect(() => {
    const token = localStorage.getItem("user-token");
    if (token) {
      login(); // ✅ store 상태 갱신
    }
  }, [login]);

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem("user-token");
    logout(); // ✅ store 상태 갱신
    // 필요하다면 로그인 페이지로 이동
    // router.push("/signin");
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white lg:px-14 shadow-sm">
      <div>
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src="/logo.png" alt="logo-image" width={45} height={49} />
          <div className="hidden md:block font-bold text-lg text-gray-800">
            NeuroBridge
          </div>
        </Link>
      </div>
      <nav className="flex items-center gap-6 text-gray-700 font-medium">
        {isLoggedIn ? (
          // ✅ 로그인했을 때 메뉴
          <>
            <Link href="/" className="hover:text-blue-600 transition-colors">
              홈
            </Link>
            <Link
              href="/mesurement"
              className="hover:text-blue-600 transition-colors"
            >
              측정
            </Link>
            <Link
              href="/my-profile"
              className="hover:text-blue-600 transition-colors"
            >
              마이프로필
            </Link>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          </>
        ) : (
          // ❌ 로그인 안 했을 때 메뉴
          <>
            <Link
              href="/signin"
              className="hover:text-blue-600 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
