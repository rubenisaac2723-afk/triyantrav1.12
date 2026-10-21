import { deviceCategories } from "./content.ts";

export type ServiceType = "rent" | "procure" | "manage";
export type DeviceType = "business-laptop" | "performance-laptop" | "macbook" | "desktop" | "accessories";
export type EstimateInput = {
  service: ServiceType;
  deviceType: DeviceType;
  quantity: number;
  durationMonths?: number;
  unitCost: number;
};
export type PricingConfig = {
  mode: "illustrative";
  version: string;
  services: readonly { id: ServiceType; label: string; requirementType: string; description: string; rateLabel: string }[];
  devices: readonly { id: DeviceType; label: string; rates: Record<ServiceType, number> }[];
  limits: { quantity: readonly [number, number]; durationMonths: readonly [number, number]; unitCost: readonly [number, number] };
  defaults: EstimateInput;
  disclaimer: string;
  exclusions: string;
};

// Demonstration assumptions only, not a TriYantra rate card or market-price evidence.
// Taxonomy: content.ts deviceCategories / services. All rates are editable by the visitor.
export const estimatorConfig: PricingConfig = {
  mode: "illustrative",
  version: "1.0.0",
  services: [
    { id: "rent", label: "Rent", requirementType: "Rent", description: "Plan a device rental over a fixed subscription term.", rateLabel: "Monthly rental per device (₹)" },
    { id: "procure", label: "Procure", requirementType: "Purchase", description: "Plan a one-time hardware purchase.", rateLabel: "Purchase cost per device (₹)" },
    { id: "manage", label: "Manage", requirementType: "Asset Management", description: "Manage existing hardware inventory. Hardware costs excluded.", rateLabel: "Monthly management per device (₹)" },
  ],
  devices: [
    { id: "business-laptop", label: deviceCategories[0], rates: { rent: 1500, procure: 50000, manage: 250 } },
    { id: "performance-laptop", label: deviceCategories[1], rates: { rent: 2500, procure: 85000, manage: 250 } },
    { id: "macbook", label: deviceCategories[2], rates: { rent: 3500, procure: 110000, manage: 250 } },
    { id: "desktop", label: deviceCategories[3], rates: { rent: 2000, procure: 65000, manage: 250 } },
    { id: "accessories", label: deviceCategories[4], rates: { rent: 500, procure: 15000, manage: 250 } },
  ],
  limits: { quantity: [0, 10000], durationMonths: [1, 60], unitCost: [1, 1000000] },
  defaults: { service: "rent", deviceType: "business-laptop", quantity: 0, durationMonths: 12, unitCost: 1500 },
  disclaimer: "Illustrative estimate only. Final pricing depends on device specifications, quantity, service scope, location, duration and commercial terms.",
  exclusions: "Excludes GST, deposits, delivery, setup, insurance, repairs and additional support. No discounts, inflation, resale value or savings are assumed. Management covers a planning allowance only; service scope is confirmed in your quotation.",
};
