"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="wrap error-page">
      <p className="eyebrow">Something went wrong</p>
      <h1>Let’s try that again.</h1>
      <p>
        The page could not be loaded. You can retry or return to the homepage.
      </p>
      <div className="actions">
        <button className="button primary" onClick={reset}>
          Try again
        </button>
        <Link className="button secondary" href="/">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
