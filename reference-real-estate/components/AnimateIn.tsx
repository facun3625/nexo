"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  from?: "up" | "left" | "right";
  delay?: number;
}

export default function AnimateIn({ children, className = "", from = "up", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.dataset.animate = from;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("animate-in"), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [from, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
