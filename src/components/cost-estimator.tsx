"use client";
import { useRef, useState } from "react";
import { estimatorConfig as config, type ServiceType } from "@/lib/estimator-config";
import { calculateEstimate } from "@/lib/estimator-engine";
import { track } from "./analytics";
import { useRGBInteraction } from "./rgb-interaction";
import { EstimateProjection } from "./estimate-projection";
import { CustomSelect } from "./custom-select";
import "./cost-estimator.css";

function initialState() {
  return {
    service: config.defaults.service,
    deviceType: config.defaults.deviceType,
    quantity: String(config.defaults.quantity),
    durationMonths: String(config.defaults.durationMonths),
    unitCost: String(config.defaults.unitCost),
  };
}

export function CostEstimator() {
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);
  const [state, setState] = useState(initialState);
  useRGBInteraction(ref, "[data-rgb]");
  const service = config.services.find((s) => s.id === state.service)!;
  const result = calculateEstimate({
    ...state,
    quantity: state.quantity === "" ? NaN : Number(state.quantity),
    durationMonths: state.service === "procure" ? undefined : state.durationMonths === "" ? NaN : Number(state.durationMonths),
    unitCost: state.unitCost === "" ? NaN : Number(state.unitCost),
  });
  const errors = result.ok ? {} : result.errors;
  function start() {
    if (started.current) return;
    started.current = true;
    track("estimator_started");
  }
  function selectService(id: ServiceType) {
    if (id === state.service) return;
    start();
    const device = config.devices.find((d) => d.id === state.deviceType)!;
    setState({ ...state, service: id, unitCost: String(device.rates[id]) });
    track("estimator_service_selected", { service: id });
  }
  return (
    <section ref={ref} className="section wrap cost-estimator" id="cost-estimator" aria-labelledby="estimator-title">
      <div className="section-head">
        <p className="eyebrow">Planning Tool</p>
        <h2 id="estimator-title">Estimate your workplace technology cost</h2>
        <p className="lead">Model your device requirements with editable planning estimates, then request a custom quote.</p>
      </div>
      <div className="estimator-layout">
        <div className="estimator-controls">
          <div className="estimator-control-heading">
            <h3>Your requirement</h3>
            <button type="button" className="estimator-reset" data-rgb onClick={() => setState(initialState())}>Reset</button>
          </div>
          <div role="radiogroup" aria-label="Service" className="estimator-services">
            {config.services.map((option, index) => (
              <button key={option.id} type="button" role="radio" data-rgb
                aria-checked={state.service === option.id}
                tabIndex={state.service === option.id ? 0 : -1}
                onClick={() => selectService(option.id)}
                onKeyDown={(event) => {
                  const offset = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
                  if (!offset && event.key !== "Home" && event.key !== "End") return;
                  event.preventDefault();
                  const next = event.key === "Home" ? 0 : event.key === "End" ? config.services.length - 1 : (index + offset + config.services.length) % config.services.length;
                  selectService(config.services[next].id);
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
                }}>{option.label}</button>
            ))}
          </div>
          <p className="estimator-service-note">{service.description}</p>
          <div className="field">
            <label htmlFor="estimate-device">Device category</label>
            <CustomSelect
              id="estimate-device"
              name="deviceType"
              value={state.deviceType}
              onChange={(val) => {
                const device = config.devices.find((d) => d.id === val);
                if (!device) return;
                start();
                setState({
                  ...state,
                  deviceType: device.id,
                  unitCost: String(device.rates[state.service]),
                });
              }}
              options={config.devices.map((device) => ({
                value: device.id,
                label: device.label,
              }))}
              label="Device category"
            />
          </div>
          <div className="estimator-numeric-fields">
            <div className="field">
              <label htmlFor="estimate-quantity">{state.service === "manage" ? "Managed devices" : "Device quantity"}</label>
              <input id="estimate-quantity" type="number" inputMode="numeric" min={config.limits.quantity[0]} max={config.limits.quantity[1]} step="1" value={state.quantity}
                aria-invalid={!!errors.quantity} aria-describedby={errors.quantity ? "estimate-quantity-error" : undefined}
                onChange={(event) => { start(); setState({ ...state, quantity: event.target.value }); }} />
              {errors.quantity && <span className="estimator-hint" id="estimate-quantity-error">{errors.quantity}</span>}
            </div>
            <div className="field" hidden={state.service === "procure"}>
              <label htmlFor="estimate-duration">{state.service === "rent" ? "Rental months" : "Management months"}</label>
              <input id="estimate-duration" type="number" inputMode="numeric" min={config.limits.durationMonths[0]} max={config.limits.durationMonths[1]} step="1" value={state.durationMonths}
                aria-invalid={!!errors.durationMonths} aria-describedby={errors.durationMonths ? "estimate-duration-error" : undefined}
                onChange={(event) => { start(); setState({ ...state, durationMonths: event.target.value }); }} />
              {errors.durationMonths && <span className="estimator-hint" id="estimate-duration-error">{errors.durationMonths}</span>}
            </div>
          </div>
          <div className="field">
            <label htmlFor="estimate-rate">{service.rateLabel}</label>
            <input id="estimate-rate" type="number" inputMode="decimal" min={config.limits.unitCost[0]} max={config.limits.unitCost[1]} step="0.01" value={state.unitCost}
              aria-invalid={!!errors.unitCost} aria-describedby="estimate-rate-help"
              onChange={(event) => { start(); setState({ ...state, unitCost: event.target.value }); }} />
            <span className="estimator-hint" id="estimate-rate-help">{errors.unitCost || "Example assumption: edit to use your own budget. Not a TriYantra price."}</span>
          </div>
        </div>
        <EstimateProjection result={result} />
      </div>
    </section>
  );
}
