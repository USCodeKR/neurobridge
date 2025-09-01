import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 2초 딜레이를 주어 실제 네트워크처럼 보이게 합니다.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 가짜 로그인 성공/실패 로직
    if (email === "admin@naver.com" && password === "12345678") {
      // 성공 시
      return NextResponse.json({
        message: "로그인 성공!",
        user: { id: 1, name: "권진" },
      });
    } else {
      // 실패 시: 401 Unauthorized 에러를 보냅니다.
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    // 그 외 서버 에러
    return NextResponse.json(
      { message: "서버에 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}
