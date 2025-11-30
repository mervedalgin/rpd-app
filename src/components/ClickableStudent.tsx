"use client";

import { useRouter } from "next/navigation";

interface ClickableStudentProps {
  studentName: string;
  classDisplay?: string;
  className?: string;
}

export function ClickableStudent({ studentName, classDisplay, className = "" }: ClickableStudentProps) {
  const router = useRouter();

  const handleClick = () => {
    // URL parametreleri ile öğrenci listesi sayfasına yönlendir
    const params = new URLSearchParams();
    params.set("student", studentName);
    if (classDisplay) {
      params.set("class", classDisplay);
    }
    router.push(`/panel/ogrenci-listesi?${params.toString()}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`text-left font-medium text-slate-800 hover:text-blue-600 hover:underline cursor-pointer transition-colors ${className}`}
    >
      {studentName}
    </button>
  );
}
