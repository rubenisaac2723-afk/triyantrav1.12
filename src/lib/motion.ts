export const motion = {
  duration: {
    micro: 0.16,
    ui: 0.28,
    section: 0.6,
    story: 0.8,
    intro: 6.0,
  },
  ease: {
    out: "power3.out",
    inOut: "power2.inOut",
  },
  stagger: {
    tight: 0.04,
    standard: 0.08,
  },
  distance: {
    micro: 4,
    ui: 12,
    section: 24,
  },
} as const;
