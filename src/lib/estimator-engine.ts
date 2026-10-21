import { estimatorConfig, type EstimateInput } from "./estimator-config.ts";

export type EstimateResult =
  | { ok: false; errors: Partial<Record<keyof EstimateInput | "form", string>> }
  | { ok: true; input: EstimateInput; monthly: number | null; annual: number | null; total: number; unitCost: number; deviceLabel: string; serviceLabel: string; assumptions: readonly string[] };

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0,
});
export function formatINR(value: number) {
  return Number.isFinite(value) && value >= 0 ? currency.format(value) : "—";
}

export function calculateEstimate(value: unknown): EstimateResult {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { ok: false, errors: { form: "Choose a requirement to view an estimate." } };
  const input = value as Record<string, unknown>;
  const errors: Partial<Record<keyof EstimateInput, string>> = {};
  const service = estimatorConfig.services.find((s) => s.id === input.service);
  const device = estimatorConfig.devices.find((d) => d.id === input.deviceType);
  if (!service) errors.service = "Choose a listed service.";
  if (!device) errors.deviceType = "Choose a listed device category.";
  for (const key of ["quantity", "durationMonths", "unitCost"] as const) {
    if (key === "durationMonths" && service?.id === "procure") continue;
    const number = input[key];
    const [min, max] = estimatorConfig.limits[key];
    const precisionValid = typeof number === "number" && (key === "unitCost"
      ? Math.abs(number * 100 - Math.round(number * 100)) < 0.000001
      : Number.isInteger(number));
    if (typeof number !== "number" || !Number.isFinite(number) || number < min || number > max || !precisionValid)
      errors[key] = key === "unitCost"
        ? `Enter a cost from ${formatINR(min)} to ${formatINR(max)}, with at most two decimal places.`
        : `Enter a whole number from ${min} to ${max.toLocaleString("en-IN")}.`;
  }
  if (Object.keys(errors).length || !service || !device) return { ok: false, errors };
  const valid = input as EstimateInput;
  // Integer paise first; round the purchase subtotal / monthly subtotal once to whole rupees.
  // Recurring projections multiply that rounded monthly amount so visible totals reconcile.
  const subtotal = Math.round((Math.round(valid.unitCost * 100) * valid.quantity) / 100);
  const oneTime = service.id === "procure";
  const monthly = oneTime ? null : subtotal;
  return {
    ok: true, input: valid, unitCost: valid.unitCost,
    monthly, annual: monthly === null ? null : monthly * 12,
    total: oneTime ? subtotal : subtotal * (valid.durationMonths ?? 1),
    deviceLabel: device.label, serviceLabel: service.label,
    assumptions: [
      "Example unit costs are editable planning assumptions, not published TriYantra prices. Changing service or category restores its example rate.",
      "Device count and rates stay constant. Subtotals round to the nearest rupee; recurring totals use that rounded monthly amount. Annual cost means 12 months at the same rate, even when your selected period is shorter.",
      estimatorConfig.exclusions,
    ],
  };
}
