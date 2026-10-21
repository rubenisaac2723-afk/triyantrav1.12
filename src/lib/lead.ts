export const fields = [
  {
    name: "fullName",
    label: "Full Name",
    required: true,
    type: "text",
    autoComplete: "name",
    max: 100,
  },
  {
    name: "workEmail",
    label: "Work Email",
    required: true,
    type: "email",
    autoComplete: "email",
    max: 254,
  },
  {
    name: "companyName",
    label: "Company Name",
    required: true,
    type: "text",
    autoComplete: "organization",
    max: 160,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    autoComplete: "tel",
    max: 40,
  },
  { name: "employees", label: "Number of Employees", type: "number", max: 7 },
  {
    name: "devices",
    label: "Number of Devices Required",
    type: "number",
    max: 7,
  },
  {
    name: "requirementType",
    label: "Requirement Type",
    type: "select",
    max: 30,
  },
  {
    name: "deviceType",
    label: "Device Type / Configuration",
    type: "text",
    max: 500,
  },
  { name: "locations", label: "Location(s)", type: "text", max: 500 },
  { name: "startDate", label: "Expected Start Date", type: "date", max: 10 },
  {
    name: "message",
    label: "Message / Additional Requirements",
    type: "textarea",
    max: 3000,
  },
] as const;
export const requirementTypes = [
  "Rent",
  "Purchase",
  "DaaS",
  "Asset Management",
  "Not Sure",
];
export type Lead = {
  kind: "quote" | "demo";
  requestId: string;
  [key: string]: string;
};
export function validateLead(value: unknown): {
  data?: Lead;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { errors: { form: "Enter a valid request." } };
  const input = value as Record<string, unknown>;
  const data: Record<string, string> = {};
  const allowed = new Set<string>([
    "kind",
    "requestId",
    "website",
    ...fields.map((f) => f.name),
  ]);
  if (Object.keys(input).some((k) => !allowed.has(k)))
    errors.form = "The request contains an unsupported field.";
  if (input.kind !== "quote" && input.kind !== "demo")
    errors.form = "Choose a quote or demo request.";
  if (
    typeof input.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.requestId,
    )
  )
    errors.form = "Please refresh the form and try again.";
  if (input.website !== undefined && input.website !== "")
    errors.form = "The request could not be accepted.";
  for (const f of fields) {
    const v = input[f.name];
    if (v !== undefined && typeof v !== "string") {
      errors[f.name] = "Enter a valid value.";
      continue;
    }
    const text = typeof v === "string" ? v.trim() : "";
    data[f.name] = text;
    if ("required" in f && f.required && !text)
      errors[f.name] = `${f.label} is required.`;
    if (text.length > f.max)
      errors[f.name] = `Use ${f.max} characters or fewer.`;
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))
      errors[f.name] = "Remove unsupported characters.";
  }
  if (data.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail))
    errors.workEmail = "Enter a valid work email address.";
  if (data.phone && !/^[+\d() .-]{7,40}$/.test(data.phone))
    errors.phone =
      "Enter a valid phone number, including the country code if needed.";
  for (const key of ["employees", "devices"])
    if (data[key] && !/^[1-9]\d{0,6}$/.test(data[key]))
      errors[key] = "Enter a whole number from 1 to 9,999,999.";
  if (data.requirementType && !requirementTypes.includes(data.requirementType))
    errors.requirementType = "Choose a listed requirement type.";
  if (data.startDate) {
    const d = new Date(data.startDate + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) ||
      Number.isNaN(d.getTime()) ||
      d.toISOString().slice(0, 10) !== data.startDate
    )
      errors.startDate = "Enter a valid calendar date.";
  }
  return {
    data: Object.keys(errors).length
      ? undefined
      : ({ ...data, kind: input.kind, requestId: input.requestId } as Lead),
    errors,
  };
}
