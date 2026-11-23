"use client";

import { useEffect, useState } from "react";

interface SlaBadgeProps {
  dueAt: string;
  package: "standard" | "urgent";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function SlaBadge({
  dueAt,
  package: pkg,
  size = "md",
  showLabel = true,
}: SlaBadgeProps) {
  const [timeRemain, setTimeRemain] = useState<{ expired: boolean; text: string }>({
    expired: false,
    text: "",
  });

  useEffect(() => {
    const update = () => {
      const due = new Date(dueAt).getTime();
      const now = Date.now();
      const diff = due - now;
      if (diff <= 0) {
        setTimeRemain({ expired: true, text: "SLA дууссан" });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemain({ expired: false, text: `${hours}ц ${minutes}м үлдсэн` });
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [dueAt]);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
        timeRemain.expired
          ? "bg-red-100 text-red-800"
          : pkg === "urgent"
          ? "bg-orange-100 text-orange-800"
          : "bg-cobalt-100 text-cobalt-800"
      }`}
    >
      {showLabel && (
        <span className={timeRemain.expired ? "" : pkg === "urgent" ? "text-orange-600" : "text-cobalt-600"}>
          {pkg === "urgent" ? "⚡" : "⏱"}
        </span>
      )}
      <span>{timeRemain.text}</span>
    </span>
  );
}