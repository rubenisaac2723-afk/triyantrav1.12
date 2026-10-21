import Link from "next/link";
import { estimatorConfig as config } from "@/lib/estimator-config";
import { formatINR, type EstimateResult } from "@/lib/estimator-engine";
import { Arrow } from "./shared";
import { AnimatedArrow } from "./animated-arrow";
import { track } from "./analytics";

export function EstimateProjection({ result }: { result: EstimateResult }) {
  const oneTime = result.ok && result.input.service === "procure";
  const label = oneTime ? "Estimated procurement total" : result.ok && result.input.service === "manage" ? "Projected monthly management" : "Projected monthly cost";
  const service = result.ok ? config.services.find((s) => s.id === result.input.service) : undefined;
  const query = result.ok && service ? new URLSearchParams({
    type: service.requirementType, device: result.deviceLabel,
    devices: String(result.input.quantity),
    ...(oneTime ? {} : { months: String(result.input.durationMonths) }),
  }) : null;
  return (
    <div className="estimate-projection">
      <p className="eyebrow">Illustrative estimate</p>
      <div className="estimate-summary" role="status" aria-live="polite" aria-atomic="true">
        {result.ok ? <>
          <h3>{label}</h3>
          <p className="estimate-number" data-large={(oneTime ? result.total : result.monthly!) >= 100000000} key={`${result.input.service}-${result.monthly}-${result.total}`}>{formatINR(oneTime ? result.total : result.monthly!)}</p>
          {!oneTime && <dl className="estimate-totals">
            <div><dt>Estimated {result.input.durationMonths}-month total</dt><dd data-estimate-total>{formatINR(result.total)}</dd></div>
            {result.input.durationMonths !== 12 && <div><dt>Projected annual cost <span>(12 months)</span></dt><dd>{formatINR(result.annual!)}</dd></div>}
          </dl>}
        </> : <p className="estimate-empty">Enter a valid quantity, duration and unit cost to view your estimate.</p>}
      </div>
      {result.ok && <>
        <dl className="estimate-breakdown">
          <div><dt>Requirement</dt><dd>{result.serviceLabel} · {result.deviceLabel}</dd></div>
          <div><dt>Calculation</dt><dd>{result.input.quantity.toLocaleString("en-IN")} devices × {formatINR(result.unitCost)}{oneTime ? " once" : " / month"}</dd></div>
          <div><dt>Scope</dt><dd>{oneTime ? "Device purchase only" : result.input.service === "manage" ? "Management allowance only · no hardware" : "Device rental only"}</dd></div>
        </dl>
        <details className="estimate-assumptions">
          <summary>
            How this estimate is calculated{" "}
            <AnimatedArrow direction="down" size="xs" />
          </summary>
          {result.assumptions.map((assumption) => <p key={assumption}>{assumption}</p>)}
        </details>
      </>}
      <p className="estimate-disclaimer">{config.disclaimer}</p>
      <Link className="button primary" data-rgb data-cta="Estimator quote" href={query ? `/contact?${query}` : "/contact"}
        onClick={() => track("estimator_quote_clicked", { status: result.ok ? "valid_estimate" : "requirement_incomplete" })}>
        Get a Quote <Arrow />
      </Link>
      <p className="estimator-hint">{result.ok ? "Your requirement carries over. A formal quote confirms the price." : "You can also discuss your requirement directly."}</p>
    </div>
  );
}
