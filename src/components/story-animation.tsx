"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { StoryMotionProps } from "./story-motion";
import { motion } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function StoryAnimation({
  root,
  kind,
  phase,
}: StoryMotionProps) {
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const ruleSelector =
          kind === "device" ? ".device-story-rule" : ".connection-line";
        const ruleTargets = root.current?.querySelectorAll(ruleSelector);
        if (ruleTargets && ruleTargets.length > 0) {
          gsap.fromTo(
            ruleTargets,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "left",
              duration: motion.duration.section,
              stagger: motion.stagger.standard,
              ease: motion.ease.out,
              clearProps: "transform",
            },
          );
        }

        if (kind === "portals") {
          const trackTargets = root.current?.querySelectorAll(".pipeline-track i");
          const orchTrigger = root.current?.querySelector(".orchestration");
          if (trackTargets && trackTargets.length > 0 && orchTrigger) {
            gsap.fromTo(
              trackTargets,
              { scaleX: 0 },
              {
                scaleX: 1,
                transformOrigin: "left",
                duration: motion.duration.ui,
                stagger: motion.stagger.standard,
                ease: motion.ease.out,
                scrollTrigger: {
                  trigger: orchTrigger,
                  start: "top 90%",
                  once: true,
                },
              },
            );
          }
        }
      });
      return () => media.revert();
    },
    { scope: root },
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const indexSelector =
          kind === "device"
            ? ".device-chapter-index"
            : ".connection-center strong";
        const indexTargets = root.current?.querySelectorAll(indexSelector);
        if (indexTargets && indexTargets.length > 0) {
          gsap.fromTo(
            indexTargets,
            { opacity: 0.85 },
            {
              opacity: 1,
              duration: motion.duration.ui,
              ease: motion.ease.out,
              clearProps: "all",
            },
          );
        }
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [phase], revertOnUpdate: true },
  );
  return null;
}
