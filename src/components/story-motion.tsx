"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type RefObject } from "react";

const Animation = dynamic(() => import("./story-animation"), { ssr: false });
export type StoryMotionProps = {
  root: RefObject<HTMLDivElement | null>;
  kind: "device" | "portals";
  phase: number;
};

export function StoryMotion(props: StoryMotionProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = props.root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [props.root]);
  return visible ? <Animation {...props} /> : null;
}
