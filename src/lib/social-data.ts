export interface SocialChannel {
  readonly id: "linkedin" | "youtube" | "instagram";
  readonly platform: string;
  readonly label: string;
  readonly url: string;
  readonly verified: boolean;
  readonly description: string;
}

export const officialSocialChannels: readonly SocialChannel[] = [
  {
    id: "linkedin",
    platform: "LinkedIn",
    label: "Follow TriYantra on LinkedIn",
    url: "https://www.linkedin.com/company/triyantra/",
    verified: true,
    description: "Workplace technology insights, enterprise procurement & updates",
  },
  {
    id: "youtube",
    platform: "YouTube",
    label: "Subscribe to TriYantra on YouTube",
    url: "https://www.youtube.com/@Triyantra-matrix",
    verified: true,
    description: "Product walk-throughs, device showcases & hardware guides",
  },
  {
    id: "instagram",
    platform: "Instagram",
    label: "Follow TriYantra on Instagram",
    url: "https://www.instagram.com/triyantraofficial?vrfl=MmJ2YTNhMWc4cjQw&utm_source=qr",
    verified: true,
    description: "Workplace culture, device showcases & team highlights",
  },
] as const;
