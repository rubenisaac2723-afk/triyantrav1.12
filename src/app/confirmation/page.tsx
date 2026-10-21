import { cookies } from "next/headers";
import Link from "next/link";
import { verifyReceipt } from "@/lib/delivery";
import { FormSuccessMotion } from "@/components/ui-motion";
import { AnimatedArrow } from "@/components/animated-arrow";
export const metadata = {
  title: "Request status | TriYantra",
  description: "Check the status of your TriYantra request.",
  robots: { index: false, follow: false },
};
export default async function Confirmation() {
  const kind = verifyReceipt((await cookies()).get("triyantra_receipt")?.value);
  return (
    <section className="confirmation wrap">
      <div className="confirmation-symbol" aria-hidden="true">
        {kind ? <FormSuccessMotion /> : "i"}
      </div>
      <p className="eyebrow">Request status</p>
      <h1>
        {kind
          ? "Your request has been received."
          : "No confirmed submission yet."}
      </h1>
      <p>
        {kind === "demo"
          ? "Your demo request has been received. This is not a confirmed appointment; the next step is to agree on a suitable time."
          : kind === "quote"
            ? "Your quote request has been received. The next step is to discuss your devices, commercial model and requirements."
            : "We cannot confirm a request from this visit. Please use the quote or demo form to get started."}
      </p>
      <div className="actions">
        <Link className="button primary" href={kind ? "/platform" : "/contact"}>
          {kind ? "Explore the platform" : "Get a Quote"} <AnimatedArrow direction="up-right" size="sm" />
        </Link>
        <Link className="button secondary" href="/">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
