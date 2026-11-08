"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./PropertyDetailMapInner"), { ssr: false });

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function PropertyDetailMap(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[300px] bg-gray-100 animate-pulse" />;
  return <Map {...props} />;
}
