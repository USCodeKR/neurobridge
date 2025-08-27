"use client";
import { useRouter } from "next/navigation";

const Modal = ({ closeMenu }: ModalProps) => {
  const router = useRouter();
  const handleStart = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("user-token") : null;
    if (token) {
      router.push("/mesurement");
    } else {
      router.push("/signin");
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">측정 시작하기</h2>
        <p className="mb-4">
          측정을 시작하시겠습니까? 측정은 간단한 손동작으로 진행됩니다.
        </p>
        <div className="flex gap-4 ">
          <button
            onClick={handleStart}
            className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
          >
            시작하기
          </button>
          <button
            onClick={closeMenu}
            className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
          >
            취소하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

type ModalProps = {
  closeMenu: () => void;
};
