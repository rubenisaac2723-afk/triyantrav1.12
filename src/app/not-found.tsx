import Link from "next/link";
import type { Metadata } from "next";
import { AnimatedArrow } from "@/components/animated-arrow";
export const metadata: Metadata = {
  title: "Page not found | TriYantra",
};
export default function NotFound() {
  return (
    <section className="wrap error-page">
      <p className="eyebrow">404 / A different path</p>
      <h1>Let’s get you to the right place.</h1>
      <p>
        This page couldn’t be found. Explore our solutions, return home, or tell
        us what your business needs.
      </p>
      <div className="actions">
        <Link className="button primary" href="/">
          Back to Home <AnimatedArrow direction="right" size="sm" />
        </Link>
        <Link className="button secondary" href="/contact">
          Get a Quote <AnimatedArrow direction="up-right" size="sm" />
        </Link>
        <Link className="text-link" href="/platform">
          Explore the platform <AnimatedArrow direction="right" size="xs" />
        </Link>
      </div>
    </section>
  );
}
