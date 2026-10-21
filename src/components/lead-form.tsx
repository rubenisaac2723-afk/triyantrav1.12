"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fields, requirementTypes, validateLead } from "@/lib/lead";
import { track } from "./analytics";
import { AnimatedArrow } from "./animated-arrow";
import { CustomSelect } from "./custom-select";

const primaryNames: Record<"quote" | "demo", readonly string[]> = {
  quote: ["fullName", "workEmail", "companyName", "requirementType", "deviceType"],
  demo: ["fullName", "workEmail", "companyName"],
};

const randomUUID = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : (() => {
        const b = crypto.getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const hex = (i: number, n: number) =>
          Array.from(b.slice(i, i + n), (x) => x.toString(16).padStart(2, "0")).join(
            "",
          );
        return `${hex(0, 4)}-${hex(4, 2)}-${hex(6, 2)}-${hex(8, 2)}-${hex(10, 6)}`;
      })();

export function LeadForm({
  kind = "quote",
  initial = {},
}: {
  kind?: "quote" | "demo";
  initial?: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [offline, setOffline] = useState(false);
  const [slow, setSlow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectValues, setSelectValues] = useState<Record<string, string>>(() => ({
    requirementType: initial.requirementType || "Not Sure",
  }));
  const [failure, setFailure] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const requestId = useRef("");
  const requestContent = useRef("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [pending]);
  const visible =
    kind === "demo"
      ? fields.filter((f) =>
          ["fullName", "workEmail", "companyName", "phone", "message"].includes(
            f.name,
          ),
        )
      : fields;
  const primarySet = new Set<string>(primaryNames[kind]);
  const primary = visible.filter((f) => primarySet.has(f.name));
  const optional = visible.filter((f) => !primarySet.has(f.name));
  const hasOptionalInitial = optional.some((f) => Boolean(initial[f.name]));

  useEffect(() => {
    if (hasOptionalInitial && moreRef.current) {
      moreRef.current.open = true;
    }
  }, [hasOptionalInitial]);
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const values = {
      ...Object.fromEntries(new FormData(e.currentTarget)),
      kind,
    };
    const content = JSON.stringify(values);
    if (content !== requestContent.current) {
      requestId.current = randomUUID();
      requestContent.current = content;
    }
    const payload = { ...values, requestId: requestId.current };
    const check = validateLead(payload);
    setErrors(check.errors);
    setFailure("");
    if (!check.data) {
      const names = Object.keys(check.errors);
      const name =
        names.find((n) => formRef.current?.querySelector(`[name="${n}"], #${n}`)) ??
        names[0];
      if (name && !primarySet.has(name) && moreRef.current)
        moreRef.current.open = true;
      const el =
        formRef.current?.querySelector<HTMLElement>(`#${name}`) ||
        formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`);
      el?.focus();
      return;
    }
    if (!navigator.onLine) {
      setFailure(
        "You are offline, so your request has not been delivered. Reconnect, then try sending your request again.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setSlow(false);
    setPending(true);
    track(kind === "demo" ? "demo_request" : "quote_request", {
      status: "attempted",
    });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok || !result.accepted) {
        if (result.errors) setErrors(result.errors);
        throw new Error(
          result.message ||
            "Your request could not be confirmed. Please try again.",
        );
      }
      track("form_completion", { kind, status: "accepted" });
      router.push("/confirmation");
    } catch (error) {
      setFailure(
        error instanceof Error &&
          error.name !== "TimeoutError" &&
          error.name !== "TypeError"
          ? error.message
          : "We could not confirm delivery. Your request has not been delivered. Your details are still here. Please try again when the connection is available.",
      );
      setPending(false);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  const renderField = (f: (typeof fields)[number]) => (
    <div
      className={
        "field " +
        (f.type === "textarea" || f.name === "deviceType" ? "full" : "")
      }
      key={f.name}
    >
      <label htmlFor={f.name} id={`${f.name}-label`}>
        {f.label}
        {"required" in f && f.required ? " *" : ""}
      </label>
      {f.type === "select" ? (
        <CustomSelect
          id={f.name}
          name={f.name}
          value={selectValues[f.name] || initial[f.name] || "Not Sure"}
          onChange={(val) => {
            setSelectValues((prev) => ({ ...prev, [f.name]: val }));
            if (errors[f.name]) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next[f.name];
                return next;
              });
            }
          }}
          options={requirementTypes.map((t) => ({ value: t, label: t }))}
          label={f.label}
          required={"required" in f && Boolean(f.required)}
          error={errors[f.name]}
          ariaDescribedBy={errors[f.name] ? f.name + "-error" : undefined}
        />
      ) : f.type === "textarea" ? (
        <textarea
          id={f.name}
          name={f.name}
          rows={4}
          maxLength={f.max}
          defaultValue={initial[f.name] || ""}
          aria-invalid={!!errors[f.name]}
          aria-describedby={errors[f.name] ? f.name + "-error" : undefined}
        />
      ) : (
        <input
          id={f.name}
          name={f.name}
          type={f.type}
          required={"required" in f && f.required}
          autoComplete={"autoComplete" in f ? f.autoComplete : undefined}
          maxLength={f.max}
          min={f.type === "number" ? 1 : undefined}
          max={f.type === "number" ? 9999999 : undefined}
          step={f.type === "number" ? 1 : undefined}
          defaultValue={initial[f.name] || ""}
          aria-invalid={!!errors[f.name]}
          aria-describedby={errors[f.name] ? f.name + "-error" : undefined}
          onBlur={(e) => {
            if (
              e.target.value &&
              f.type === "email" &&
              !e.target.validity.valid
            )
              setErrors((prev) => ({
                ...prev,
                [f.name]: "Enter a valid work email address.",
              }));
          }}
        />
      )}
      {errors[f.name] && (
        <span id={f.name + "-error"} className="field-error">
          {errors[f.name]}
        </span>
      )}
    </div>
  );
  const alternative =
    kind === "demo"
      ? { href: "/contact", label: "Prepare a quote request" }
      : { href: "/contact", label: "Contact our team" };
  return (
    <form ref={formRef} className="lead-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <h2>{kind === "demo" ? "Book a Demo" : "Get a Quote"}</h2>
        <p>* Required fields</p>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="lead-website">
          Website
          <input id="lead-website" name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>
      <fieldset className="form-grid" disabled={pending} aria-busy={pending}>
        <legend className="sr-only">
          {kind === "demo" ? "Demo request" : "Business requirement"}
        </legend>
        {primary.map(renderField)}
      </fieldset>
      {optional.length > 0 && (
        <details className="form-more" ref={moreRef}>
          <summary>
            Add more detail <span className="form-more-hint">(optional)</span>
          </summary>
          <fieldset className="form-grid" disabled={pending}>
            {optional.map(renderField)}
          </fieldset>
        </details>
      )}
      <p className="form-note">
        Please provide work contact information only. Do not submit passwords or sensitive personal data.
      </p>
      <button
        className="button primary"
        type="submit"
        disabled={pending}
        data-rgb
        data-processing={pending ? "" : undefined}
        aria-busy={pending}
      >
        {pending
          ? "Sending request…"
          : kind === "demo"
            ? "Request a Demo"
            : "Get a Quote"}
        <AnimatedArrow direction="up-right" size="sm" />
      </button>
      <div role="status" aria-atomic="true" className="request-status">
        {offline
          ? "You’re offline. Your details are still here; reconnect before sending."
          : pending
            ? slow
              ? "This is taking a little longer. Please keep this page open while we confirm delivery."
              : "Sending your request. Please keep this page open."
            : ""}
      </div>
      {(failure || errors.form) && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="form-error">
          {failure || errors.form}{" "}
          <span>Your entered details remain in this form.</span>{" "}
          <Link className="form-error-link" href={alternative.href}>
            {alternative.label}
          </Link>
        </div>
      )}
      <noscript>
        <p className="form-error">
          JavaScript is needed to submit this form. No request has been sent.
        </p>
      </noscript>
    </form>
  );
}
