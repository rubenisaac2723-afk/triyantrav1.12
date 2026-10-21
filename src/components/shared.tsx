import Image from "next/image";
import Link from "next/link";
import { faqs } from "@/lib/content";
import { AnimatedArrow, type ArrowDirection, type ArrowSize } from "./animated-arrow";
export function Logo({
  small = false,
  priority = false,
}: {
  small?: boolean;
  priority?: boolean;
}) {
  return (
    <span className={small ? "logo small" : "logo"}>
      <Image
        className="brand-source"
        src="/triyantra-logo.png"
        alt="TriYantra - EMPOWER. OPTIMIZE. ELEVATE."
        width={540}
        height={216}
        quality={75}
        sizes={small ? "120px" : "(max-width: 760px) 140px, 180px"}
        priority={priority}
        draggable={false}
      />
    </span>
  );
}
export function SplitText({
  text,
  accessible = true,
}: {
  text: string;
  accessible?: boolean;
}) {
  return (
    <span className="split-text" data-reveal="text">
      {accessible && <span className="sr-only">{text}</span>}
      <span aria-hidden="true">
        {text.split(" ").map((word, index) => (
          <span className="word-mask" key={index}>
            <span className="word">{word}</span>{" "}
          </span>
        ))}
      </span>
    </span>
  );
}
export function Arrow({
  direction = "up-right",
  size = "md",
}: {
  direction?: ArrowDirection;
  size?: ArrowSize;
} = {}) {
  return <AnimatedArrow direction={direction} size={size} />;
}
export function ArrowAction({
  direction = "external",
}: {
  direction?: "external" | "next" | "advance";
} = {}) {
  const dir = direction === "next" || direction === "advance" ? "right" : "up-right";
  return (
    <span className="arrow-action" aria-hidden="true">
      <span className="arrow-action-glyph">
        <AnimatedArrow direction={dir} size="sm" />
      </span>
    </span>
  );
}
export function Actions({
  primary = "Get a Quote",
  href = "/contact",
  secondaryLabel = "Explore Platform",
  secondaryHref = "/platform",
  demo = true,
}: {
  primary?: string;
  href?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  demo?: boolean;
}) {
  return (
    <div className="actions">
      <Link className="button primary" href={href} data-rgb data-cta={primary}>
        {primary}
        <Arrow />
      </Link>
      {demo && (
        <Link
          className="button secondary"
          href={secondaryHref}
          data-rgb
          data-cta={secondaryLabel}
        >
          {secondaryLabel} <Arrow direction="right" />
        </Link>
      )}
    </div>
  );
}
export function Breadcrumb({
  label,
  parent,
}: {
  label: string;
  parent?: { label: string; href: string };
}) {
  return (
    <nav className="breadcrumb wrap" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span>/</span>
      {parent && (
        <>
          <Link href={parent.href}>{parent.label}</Link>
          <span>/</span>
        </>
      )}
      <span aria-current="page">{label}</span>
    </nav>
  );
}
export function Hero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero wrap">
      <p className="eyebrow">{eyebrow}</p>
      <h1>
        <SplitText text={title} />
      </h1>
      <p className="lead">{intro}</p>
      {children}
    </section>
  );
}
export function SectionHead({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>
        <SplitText text={title} />
      </h2>
      {text && <p className="lead">{text}</p>}
    </div>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="wrap final-cta-inner">
        <div>
          <p className="eyebrow">Get Started</p>
          <h2>
            Ready to equip your
            <br />
            workplace?
          </h2>
          <p>
            Tell us what your team needs. We will outline the right
            devices, commercial model, and delivery schedule.
          </p>
        </div>
        <Actions />
      </div>
    </section>
  );
}
export function FAQ({
  items = faqs,
}: {
  items?: readonly (readonly string[])[];
}) {
  return (
    <div className="faq-list">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <AnimatedArrow direction="down" size="xs" />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
export function PointList({
  points,
  headingLevel = 3,
}: {
  points: readonly (readonly string[])[];
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="point-list">
      {points.map(([title, text], i) => (
        <article key={title}>
          <span className="number">0{i + 1}</span>
          <div>
            <Heading>{title}</Heading>
            <p>{text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
