"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { vehicleCatalog as manqanebisKatalogi } from "@/data/vehicle-catalog";
import { gamotvaleManqanisGadasaxadebi } from "@/lib/vehicle-tax.mjs";
import NumberField from "@/components/NumberField";
import AssistedCostEstimator from "@/components/AssistedCostEstimator";
import ImportisDasabechdiAngarishi, { type KharjisVelisSakheli } from "./ImportisDasabechdiAngarishi";
import { formatireGelTanxa } from "@/lib/format-money";
import { STANDARTULI_SAKHELMTSIFO_MOSAKREBEBI_GEL, sheajameImportisKharjebi } from "@/lib/vehicle-import-costs.mjs";
import { sheamowmeIaponiuriChassis, sheamowmeVin } from "@/lib/vin.mjs";
import { vinidanDzravisMoculoba, manqanisAsaki, warmoebisTseliValiduria } from "@/lib/vehicle-import-inputs.mjs";
import { ipoveMarka, ipoveModeli, archeuliDzravisMoculoba, archevitiManqanisTipi, vinisDzravisTipi, martvisMkhare } from "@/lib/vehicle-selection.mjs";

const rsKalkulatorisMisamarti = "https://www.rs.ge/CarClearance-en";
type SavedEstimateDraft = {
  savedAt: string;
  year: number | null;
  declarationYear: number;
  makeName: string;
  modelName: string;
  engineId: string;
  engineCc: number | null;
  steering: string;
  hybrid: boolean;
  classicCar: boolean;
  preAprilRegime: boolean;
  purchase: number | null;
  auction: number | null;
  inland: number | null;
  shipping: number | null;
  insurance: number | null;
  port: number | null;
  delivery: number | null;
  vehicleIdentifier: string;
  identifiedVehicleName: string;
  lookupElectric: boolean;
  lookupFuelNeedsConfirmation: boolean;
  assistedCostFields: Record<KharjisVelisSakheli, boolean>;
};

const SAVED_ESTIMATE_KEY = "portavero.vehicle-import-draft.v1";

function arisChanaceri(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shenakhuliTanxaValiduria(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

const sheyvaniliJamiJgufi = (values: Array<number | null>) => {
  if (values.every((value) => value === null)) return "Not entered";
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return Number.isFinite(total) && total <= Number.MAX_SAFE_INTEGER / 100
    ? formatireGelTanxa(total)
    : "Check details";
};

export default function ManqanisImportisGverdi() {
  const [year, setYear] = useState<number | null>(null);
  const [declarationYear, setDeclarationYear] = useState(new Date().getFullYear());
  const [makeName, setMakeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [engineId, setEngineId] = useState("");
  const [engineCc, setEngineCc] = useState<number | null>(null);
  const [steering, setSteering] = useState("");
  const [hybrid, setHybrid] = useState(false);
  const [classicCar, setClassicCar] = useState(false);
  const [preAprilRegime, setPreAprilRegime] = useState(false);
  const [purchase, setPurchase] = useState<number | null>(null);
  const [auction, setAuction] = useState<number | null>(null);
  const [inland, setInland] = useState<number | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [insurance, setInsurance] = useState<number | null>(null);
  const [port, setPort] = useState<number | null>(null);
  const [delivery, setDelivery] = useState<number | null>(null);
  const [assistedCostFields, setAssistedCostFields] = useState<Record<KharjisVelisSakheli, boolean>>({
    purchase: false, auction: false, inland: false, shipping: false,
    insurance: false, port: false, delivery: false
  });
  const [vehicleIdentifier, setVehicleIdentifier] = useState("");
  const [identifiedVehicleName, setIdentifiedVehicleName] = useState("");
  const [lookupElectric, setLookupElectric] = useState(false);
  const [lookupFuelNeedsConfirmation, setLookupFuelNeedsConfirmation] = useState(false);
  const [savedDraftAvailable, setSavedDraftAvailable] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [documentMeta, setDocumentMeta] = useState({ reference: "", issuedAt: "" });
  const [invalidCostFields, setInvalidCostFields] = useState<Record<KharjisVelisSakheli, boolean>>({
    purchase: false,
    auction: false,
    inland: false,
    shipping: false,
    insurance: false,
    port: false,
    delivery: false
  });

  function shetaniliKharjisValiduroba(field: KharjisVelisSakheli, valid: boolean) {
    setInvalidCostFields((current) => {
      const invalid = !valid;
      return current[field] === invalid ? current : { ...current, [field]: invalid };
    });
  }

  function daaseteManualuriKharji(field: KharjisVelisSakheli, value: number | null) {
    setAssistedCostFields((current) => ({ ...current, [field]: false }));
    switch (field) {
      case "purchase": setPurchase(value); break;
      case "auction": setAuction(value); break;
      case "inland": setInland(value); break;
      case "shipping": setShipping(value); break;
      case "insurance": setInsurance(value); break;
      case "port": setPort(value); break;
      case "delivery": setDelivery(value); break;
    }
  }

  function miusadageDakhmarebuliKharji(field: KharjisVelisSakheli, amount: number) {
    if (!Number.isFinite(amount) || amount < 0) return;
    setAssistedCostFields((current) => ({ ...current, [field]: true }));
    setInvalidCostFields((current) => ({ ...current, [field]: false }));
    switch (field) {
      case "purchase": setPurchase(amount); break;
      case "auction": setAuction(amount); break;
      case "inland": setInland(amount); break;
      case "shipping": setShipping(amount); break;
      case "insurance": setInsurance(amount); break;
      case "port": setPort(amount); break;
      case "delivery": setDelivery(amount); break;
    }
  }

  useEffect(() => {
    const createdAt = new Date();
    const datePart = [
      createdAt.getFullYear(),
      String(createdAt.getMonth() + 1).padStart(2, "0"),
      String(createdAt.getDate()).padStart(2, "0")
    ].join("");
    const referenceSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    setDocumentMeta({
      reference: `PVR-${datePart}-${referenceSuffix}`,
      issuedAt: createdAt.toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    });

    const params = new URLSearchParams(window.location.search);
    const incomingVin = params.get("vin") ?? "";
    const incomingChassis = params.get("chassis") ?? "";
    const hasValidVin = sheamowmeVin(incomingVin).valid;
    const hasValidChassis = sheamowmeIaponiuriChassis(incomingChassis).valid;
    const incomingIdentifier = hasValidVin
      ? incomingVin.toUpperCase()
      : hasValidChassis
        ? incomingChassis.toUpperCase()
        : "";

    if (incomingIdentifier) {
      const make = (params.get("make") ?? "").slice(0, 80);
      const model = (params.get("model") ?? "").slice(0, 80);
      const matchingMake = ipoveMarka(manqanebisKatalogi, make);
      const matchingModel = ipoveModeli(matchingMake?.models, model);
      const modelYear = Number(params.get("year"));
      const capacityValue = Number(params.get("engineCc"));
      const capacity = vinidanDzravisMoculoba(capacityValue);
      const powertrain = vinisDzravisTipi({
        primaryFuelType: params.get("fuelPrimary") ?? params.get("fuel") ?? "",
        secondaryFuelType: params.get("fuelSecondary") ?? "",
        electrificationLevel: params.get("electrification") ?? ""
      });
      const reportedSteering = martvisMkhare(
        params.get("steering") ?? params.get("steeringLocation") ?? ""
      );
      const modelEngines = matchingModel?.engines ?? [];
      const capacityMatches = capacity === null
        ? []
        : modelEngines.filter((engine) => engine.cc > 0 && Math.abs(engine.cc - capacity) <= 2);
      const matchingEngine = modelEngines.find((engine) =>
        engine.fuel === powertrain.fuel &&
        (engine.cc === 0 || capacity === null || Math.abs(engine.cc - capacity) <= 2)
      ) ?? (capacityMatches.length === 1 ? capacityMatches[0] : undefined) ??
        (powertrain.isElectric ? modelEngines.find((engine) => engine.fuel === "Electric") : undefined);
      const effectiveFuelNeedsConfirmation = powertrain.needsConfirmation && !matchingEngine;
      const isElectric = matchingEngine?.fuel === "Electric" || powertrain.isElectric;
      const isHybrid = matchingEngine
        ? matchingEngine.fuel === "Hybrid" || matchingEngine.fuel === "Plug-in hybrid"
        : powertrain.isHybrid;

      setVehicleIdentifier(incomingIdentifier);
      setIdentifiedVehicleName([make, model].filter(Boolean).join(" ") || "Vehicle from lookup");
      setMakeName(matchingMake?.name ?? make);
      setModelName(matchingModel?.name ?? model);
      if (Number.isInteger(modelYear) && modelYear >= 1960 && modelYear <= new Date().getFullYear() + 2) {
        setYear(modelYear);
        if (modelYear > new Date().getFullYear()) setDeclarationYear(modelYear);
      }
      setEngineId(matchingEngine?.id ?? "");
      setEngineCc(isElectric ? null : vinidanDzravisMoculoba(capacity, matchingEngine?.cc));
      setHybrid(isHybrid);
      setLookupElectric(isElectric);
      setLookupFuelNeedsConfirmation(effectiveFuelNeedsConfirmation);
      setSteering(reportedSteering);
      setClassicCar(false);
    }
  }, []);

  useEffect(() => {
    try {
      setSavedDraftAvailable(Boolean(window.localStorage.getItem(SAVED_ESTIMATE_KEY)));
    } catch {
      setSavedDraftAvailable(false);
    }
  }, []);

  function sheinaxeMonakhazi() {
    if (hasInvalidCostField) {
      setDraftMessage("Fix the highlighted amount fields before saving this draft.");
      return;
    }

    const draft: SavedEstimateDraft = {
      savedAt: new Date().toISOString(),
      year, declarationYear, makeName, modelName, engineId, engineCc, steering,
      hybrid, classicCar, preAprilRegime, purchase, auction, inland, shipping,
      insurance, port, delivery, vehicleIdentifier, identifiedVehicleName,
      lookupElectric, lookupFuelNeedsConfirmation, assistedCostFields: { ...assistedCostFields }
    };

    try {
      window.localStorage.setItem(SAVED_ESTIMATE_KEY, JSON.stringify(draft));
      setSavedDraftAvailable(true);
      setDraftMessage("Draft saved on this device. It is not uploaded to an account.");
    } catch {
      setDraftMessage("This browser could not save the draft. Check its storage settings.");
    }
  }

  function chaitvirteMonakhazi() {
    try {
      const raw = window.localStorage.getItem(SAVED_ESTIMATE_KEY);
      if (!raw) {
        setSavedDraftAvailable(false);
        setDraftMessage("There is no saved draft on this device.");
        return;
      }
      const value: unknown = JSON.parse(raw);
      if (!arisChanaceri(value) || typeof value.savedAt !== "string") {
        throw new Error("Invalid saved draft");
      }

      const savedYear = shenakhuliTanxaValiduria(value.year);
      const savedDeclarationYear = shenakhuliTanxaValiduria(value.declarationYear);
      setYear(savedYear !== null && Number.isInteger(savedYear) && savedYear >= 1960 && savedYear <= new Date().getFullYear() + 2 ? savedYear : null);
      setDeclarationYear(savedDeclarationYear !== null && Number.isInteger(savedDeclarationYear) && savedDeclarationYear >= 2000 && savedDeclarationYear <= 2200 ? savedDeclarationYear : new Date().getFullYear());
      setMakeName(typeof value.makeName === "string" ? value.makeName.slice(0, 80) : "");
      setModelName(typeof value.modelName === "string" ? value.modelName.slice(0, 80) : "");
      setEngineId(typeof value.engineId === "string" ? value.engineId.slice(0, 100) : "");
      setEngineCc(shenakhuliTanxaValiduria(value.engineCc));
      setSteering(value.steering === "left" || value.steering === "right" ? value.steering : "");
      setHybrid(value.hybrid === true);
      setClassicCar(value.classicCar === true);
      setPreAprilRegime(value.preAprilRegime === true);
      setPurchase(shenakhuliTanxaValiduria(value.purchase));
      setAuction(shenakhuliTanxaValiduria(value.auction));
      setInland(shenakhuliTanxaValiduria(value.inland));
      setShipping(shenakhuliTanxaValiduria(value.shipping));
      setInsurance(shenakhuliTanxaValiduria(value.insurance));
      setPort(shenakhuliTanxaValiduria(value.port));
      setDelivery(shenakhuliTanxaValiduria(value.delivery));
      const savedCostSources = arisChanaceri(value.assistedCostFields) ? value.assistedCostFields : null;
      setAssistedCostFields({
        purchase: savedCostSources?.purchase === true,
        auction: savedCostSources?.auction === true,
        inland: savedCostSources?.inland === true,
        shipping: savedCostSources?.shipping === true,
        insurance: savedCostSources?.insurance === true,
        port: savedCostSources?.port === true,
        delivery: savedCostSources?.delivery === true
      });
      setVehicleIdentifier(typeof value.vehicleIdentifier === "string" ? value.vehicleIdentifier.slice(0, 34) : "");
      setIdentifiedVehicleName(typeof value.identifiedVehicleName === "string" ? value.identifiedVehicleName.slice(0, 160) : "");
      setLookupElectric(value.lookupElectric === true);
      setLookupFuelNeedsConfirmation(value.lookupFuelNeedsConfirmation === true);
      setInvalidCostFields({ purchase: false, auction: false, inland: false, shipping: false, insurance: false, port: false, delivery: false });
      setDraftMessage("Saved draft loaded. Check the vehicle details before relying on the estimate.");
    } catch {
      setDraftMessage("The saved draft could not be read. Remove it and save a new one.");
    }
  }

  function washaleMonakhazi() {
    try {
      window.localStorage.removeItem(SAVED_ESTIMATE_KEY);
      setSavedDraftAvailable(false);
      setDraftMessage("Saved draft removed from this device.");
    } catch {
      setDraftMessage("This browser could not remove the saved draft.");
    }
  }

  const selectedMake = manqanebisKatalogi.find((make) => make.name === makeName);
  const selectedModel = selectedMake?.models.find((model) => model.name === modelName);
  const selectedEngine = selectedModel?.engines.find((engine) => engine.id === engineId);
  const isElectric = selectedEngine?.fuel === "Electric" || lookupElectric;

  const currentYear = new Date().getFullYear();
  const vehicleAge = manqanisAsaki(year, declarationYear);
  const eligibleYear = warmoebisTseliValiduria(year, declarationYear);
  const validEngine = isElectric || (engineCc !== null && Number.isFinite(engineCc) && engineCc > 0);
  const validVehicleType = !classicCar || (vehicleAge !== null && vehicleAge > 30);
  const validSteering = steering === "left" || steering === "right";
  const canShowTaxEstimate = eligibleYear && validEngine && validVehicleType && validSteering && !lookupFuelNeedsConfirmation;
  const hasInvalidCostField = Object.values(invalidCostFields).some(Boolean);

  const result = useMemo(() => {
    const taxes = year === null
      ? { excise: Number.NaN, importDuty: Number.NaN, rate: Number.NaN }
      : gamotvaleManqanisGadasaxadebi({
      manufactureYear: year,
      declarationYear,
      engineCc: engineCc ?? 0,
      steering,
      hybrid,
      classicCar,
      isElectric,
      preAprilRegime
    });
    const costSummary = sheajameImportisKharjebi(
      { purchase, auction, inland, shipping, insurance, port, delivery },
      taxes.excise,
      taxes.importDuty,
      STANDARTULI_SAKHELMTSIFO_MOSAKREBEBI_GEL,
      hasInvalidCostField
    );
    return {
      excise: taxes.excise,
      importDuty: taxes.importDuty,
      knownCosts: costSummary.knownCosts,
      unknownCosts: costSummary.unknownCosts.length,
      invalidCosts: costSummary.invalidCosts,
      invalidTaxAmounts: costSummary.invalidTaxAmounts,
      invalidAmounts: costSummary.invalidAmounts,
      officialFees: STANDARTULI_SAKHELMTSIFO_MOSAKREBEBI_GEL,
      total: costSummary.total,
      rate: taxes.rate,
    };
  }, [year, declarationYear, steering, hybrid, classicCar, preAprilRegime, isElectric, engineCc, purchase, auction, inland, shipping, insurance, port, delivery, hasInvalidCostField]);

  const printableVehicleName = identifiedVehicleName || [makeName, modelName].filter(Boolean).join(" ") || "Vehicle not identified";
  const printableEngine = selectedEngine?.label ?? (
    isElectric
      ? "Electric powertrain"
      : engineCc === null
        ? "Not entered"
        : `${engineCc.toLocaleString("en-US")} cm³ · manual entry`
  );
  const printableSteering = steering === "right"
    ? "Right-hand drive"
    : steering === "left"
      ? "Left-hand drive"
      : "Not confirmed";
  const printableFuel = lookupFuelNeedsConfirmation ? "Not confirmed" : isElectric ? "Electric" : hybrid ? "Hybrid" : "Non-hybrid / other";
  const printableTotalAvailable = canShowTaxEstimate && result.total !== null && !result.invalidAmounts;
  const printableStatus = !printableTotalAvailable
    ? "INCOMPLETE · REVIEW REQUIRED"
    : result.unknownCosts > 0
      ? "PARTIAL ESTIMATE"
      : "ALL COST CATEGORIES ENTERED";
  const missingCostLabels = [
    purchase === null ? "Vehicle purchase price" : null,
    auction === null ? "Auction fees" : null,
    inland === null ? "Inland transport" : null,
    shipping === null ? "International shipping" : null,
    insurance === null ? "Insurance" : null,
    port === null ? "Port, broker and storage" : null,
    delivery === null ? "Local delivery / other costs" : null
  ].filter((label): label is string => label !== null);

  return (
    <div className="vehicle-import-page">
    <ImportisDasabechdiAngarishi
        documentMeta={documentMeta}
        vehicle={{
          name: printableVehicleName,
          identifier: vehicleIdentifier,
          manufactureYear: year,
          engine: printableEngine,
          declarationYear,
          age: vehicleAge,
          steering: printableSteering,
          fuel: printableFuel,
          preAprilRegime,
          classicCar,
          isElectric
        }}
        costs={{ purchase, auction, inland, shipping, insurance, port, delivery }}
        assistedCostFields={assistedCostFields}
        estimate={result}
        canShowTaxEstimate={canShowTaxEstimate}
        totalAvailable={printableTotalAvailable}
        status={printableStatus}
        missingCostLabels={missingCostLabels}
      />

      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Vehicle import planner</span>
          <h1>{vehicleIdentifier ? "Import estimate for this car" : "Estimate the cost of importing a car."}</h1>
          <p>{vehicleIdentifier ? "Available details from the vehicle lookup have been added below. Check them against the car and its documents, fill in anything missing, then add the costs you know." : "Start with a VIN check or enter the vehicle details manually. Check specifications against the car’s documents, fill in anything missing, then add its purchase, auction, shipping and local delivery costs."}</p>
          <div className="hero-actions planner-quick-actions">
            <button type="button" className="button button-dark" onClick={sheinaxeMonakhazi} disabled={hasInvalidCostField}>Save draft on this device</button>
            <details className="planner-more-actions">
              <summary>More actions</summary>
              <div className="planner-more-actions-menu">
                {savedDraftAvailable && <button type="button" className="button button-outline" onClick={chaitvirteMonakhazi}>Load saved draft</button>}
                {savedDraftAvailable && <button type="button" className="button button-outline" onClick={washaleMonakhazi}>Delete saved draft</button>}
                <button type="button" className="button button-outline print-trigger" onClick={() => window.print()}>Print Portavero document</button>
                <a href={rsKalkulatorisMisamarti} target="_blank" rel="noreferrer" className="button button-outline">Official tax calculator ↗</a>
                <Link href="/how-it-works" className="button button-outline">How estimates work</Link>
              </div>
            </details>
          </div>
          {draftMessage && <p className="draft-status" role="status" aria-live="polite">{draftMessage}</p>}
          <p className="draft-privacy-note">Drafts stay in this browser on this device. They are not uploaded to an account.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <nav className="estimate-stepper" aria-label="Estimate sections">
            <a href="#vehicle-details"><span>01</span><strong>Vehicle details</strong></a>
            <a href="#import-costs"><span>02</span><strong>Import costs</strong></a>
            <a href="#estimate-result"><span>03</span><strong>Review total</strong></a>
          </nav>
          <div className="tool-layout">
          <section className="panel vehicle-panel" id="vehicle-details">
            <div className="vehicle-section-heading"><span className="step-chip">01</span><div><span className="eyebrow">Start with the car</span><h2>Identify your vehicle</h2></div></div>
            <p className="panel-intro">Choose the car's exact details from its documents. The estimate updates as you make changes.</p>
            <details className="scope-details">
              <summary>What this estimate covers</summary>
              <p>This planner covers selected passenger cars under HS 8703. It does not determine tariff classification, cover every exemption or confirm transitional eligibility. It also excludes the separate sports-car excise treatment in Article 188(9). Electric and classic-car calculations are limited to the cases shown here. Check unusual cases with the Revenue Service.</p>
            </details>
            {vehicleIdentifier && <div className="notice" role="status"><strong>Details loaded from vehicle lookup for {identifiedVehicleName}.</strong> {engineCc === null && !isElectric ? "The lookup did not identify a single engine size. Enter it from the car's documents. " : "The available engine data has been filled in. Check it against the vehicle documents. "} {validSteering ? "Steering side was filled in automatically; verify it against the vehicle." : "Choose the steering side because it could not be identified."}</div>}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="make">Make</label>
                <select id="make" value={makeName} onChange={(event) => { setMakeName(event.target.value); setModelName(""); setEngineId(""); setEngineCc(null); setHybrid(false); setLookupElectric(false); setLookupFuelNeedsConfirmation(Boolean(vehicleIdentifier)); setClassicCar(false); }}>
                  <option value="">Choose a make</option>
                  {makeName && !manqanebisKatalogi.some((item) => item.name === makeName) && <option value={makeName}>{makeName} · from lookup</option>}
                  {manqanebisKatalogi.map((make) => <option key={make.name} value={make.name}>{make.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="model">Model</label>
                <select id="model" value={modelName} disabled={!selectedMake} onChange={(event) => { setModelName(event.target.value); setEngineId(""); setEngineCc(null); setHybrid(false); setLookupElectric(false); setLookupFuelNeedsConfirmation(Boolean(vehicleIdentifier)); setClassicCar(false); }}>
                  <option value="">Choose a model</option>
                  {modelName && selectedMake && !selectedMake.models.some((item) => item.name === modelName) && <option value={modelName}>{modelName} · from lookup</option>}
                  {selectedMake?.models.map((model) => <option key={model.name} value={model.name}>{model.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="engine-variant">Engine / powertrain</label>
                <select id="engine-variant" value={engineId} disabled={!selectedModel} onChange={(event) => {
                  const id = event.target.value;
                  const engine = selectedModel?.engines.find((item) => item.id === id);
                  setEngineId(id);
                  setLookupElectric(false);
                  setEngineCc(archeuliDzravisMoculoba(engine));
                  setHybrid(engine?.fuel === "Hybrid" || engine?.fuel === "Plug-in hybrid");
                  setLookupFuelNeedsConfirmation(false);
                  setClassicCar(false);
                }}>
                  <option value="">Choose an engine variant</option>
                  {selectedModel?.engines.map((engine) => <option key={engine.id} value={engine.id}>{engine.label} · {engine.cc > 0 ? engine.cc.toLocaleString("en-US") + " cm³" : engine.fuel === "Electric" ? "EV" : "capacity varies"}</option>)}
                </select>
                <small>{selectedEngine ? [selectedEngine.fuel, selectedEngine.years, selectedEngine.note].filter(Boolean).join(" · ") : "These are common versions, not a match for every car. Check the engine code on the car's documents."}</small>
              </div>
              <div className="field">
                <label htmlFor="manufacture-year">Manufacture year</label>
                <select id="manufacture-year" value={year ?? ""} required onChange={(event) => { setYear(event.target.value ? Number(event.target.value) : null); setClassicCar(false); }}>
                  <option value="">Select manufacture year</option>
                  {Array.from({ length: currentYear - 1960 + 3 }, (_, index) => currentYear + 2 - index).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="declaration-year">Expected customs declaration year</label>
                <select id="declaration-year" value={declarationYear} onChange={(event) => { setDeclarationYear(Number(event.target.value)); setClassicCar(false); }}>
                  {Array.from({ length: 6 }, (_, index) => currentYear + index).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <small>The planner uses the declaration year to work out the car's age.</small>
              </div>
              <NumberField id="engine-cc" label="Engine capacity (cm³)" value={engineCc} step={1} max={100000} inputMode="numeric" onChange={(value) => { setEngineCc(value); setEngineId(""); setLookupElectric(false); }} hint={selectedEngine?.cc === 0 && !isElectric ? "This model comes with different engine sizes. Enter the capacity shown in the car's documents. Portavero will not guess it." : "If you chose an engine above, its capacity is filled in here. Check it against the car's documents."} />
              <div className="field">
                <label htmlFor="pre-april-regime">Tax regime for this import</label>
                <select id="pre-april-regime" value={preAprilRegime ? "previous" : "current"} onChange={(event) => setPreAprilRegime(event.target.value === "previous")}>
                  <option value="current">Current rules (from 2 April 2026)</option>
                  <option value="previous">Previous rules (eligible transitional cases only)</option>
                </select>
                <small>Choose the previous rules only if your documents meet the Revenue Service's transition conditions.</small>
              </div>
              <div className="field">
                <label htmlFor="steering">Steering configuration</label>
                <select id="steering" value={steering} onChange={(event) => setSteering(event.target.value)}>
                  <option value="">Choose steering side</option>
                  <option value="left">Left-hand drive</option>
                  <option value="right">Right-hand drive or converted</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="hybrid">Vehicle type</label>
                <select id="hybrid" value={lookupFuelNeedsConfirmation ? "" : isElectric ? "electric" : hybrid ? "hybrid" : classicCar ? "classic" : "other"} disabled={isElectric} onChange={(event) => {
                  const next = archevitiManqanisTipi(event.target.value);
                  setEngineId(next.engineId);
                  setLookupElectric(false);
                  if (!vehicleIdentifier) setEngineCc(null);
                  setHybrid(next.hybrid);
                  setClassicCar(next.classicCar);
                  setLookupFuelNeedsConfirmation(false);
                }}>
                  <option value="" disabled>Confirm vehicle type from documents</option>
                  <option value="electric" disabled>Electric (from VIN or selected engine)</option>
                  <option value="other">Non-hybrid</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="classic" disabled={vehicleAge === null || vehicleAge <= 30}>Classic car (over 30 years old, classification confirmed)</option>
                </select>
                <small>The 60% reduction is only for left-hand-drive hybrids aged 0–6 years. Choose the classic-car option only if the car meets the legal classification.</small>
              </div>
            </div>
            {vehicleIdentifier && !validSteering && <div className="notice" role="alert">Choose whether the car is left-hand drive or right-hand drive before using the tax estimate. The vehicle lookup could not confirm steering side.</div>}
            {vehicleIdentifier && lookupFuelNeedsConfirmation && <div className="notice" role="alert">The vehicle lookup did not identify the fuel system clearly enough to choose the correct tax treatment. Confirm whether this car is non-hybrid or hybrid using its documents.</div>}
            {preAprilRegime && <div className="notice" role="status"><strong>Using the previous tax rules?</strong> Selecting this option does not mean the car qualifies. The Revenue Service asks for specific registration and transport documents, and the deadlines depend on how the car was moved. Check your documents with them before relying on this estimate.</div>}
            {declarationYear > currentYear && <div className="notice" role="status"><strong>Planning for {declarationYear}?</strong> This uses the tax rules and GEL 480 fee list currently stored in Portavero. Rates, fees and requirements may change before then, so treat the result as a rough guide, not a forecast.</div>}
            {!preAprilRegime && vehicleAge !== null && vehicleAge > 6 && !isElectric && !classicCar && <div className="notice" role="status"><strong>Cars over 6 years old:</strong> the base excise rate is GEL 4.50 per cm³ before any applicable adjustments. The previously proposed age-based registration ban was replaced by this higher rate. Other emissions, vehicle-category and registration rules may still apply, so check the exact car before buying or shipping.</div>}
            {(!eligibleYear || !validEngine || !validVehicleType || isElectric || lookupFuelNeedsConfirmation) && <div className="notice" role="status">{lookupFuelNeedsConfirmation ? "Confirm the vehicle's fuel system before relying on the tax estimate." : isElectric ? "This planner includes a limited calculation for electric passenger cars. Check the car's classification and any special rules with the Revenue Service." : !validVehicleType ? "The classic-car rate is only available for cars over 30 years old that meet the legal classification." : "Check the manufacture year and engine size before relying on the estimate."}</div>}
            {canShowTaxEstimate ? (
              <div className="notice">
                <strong>Rate used:</strong> {preAprilRegime ? "Previous age-based excise table (transitional cases only)" : "Current rates from 2 April 2026"}. {isElectric ? (steering === "right" ? (preAprilRegime ? "Previous rule: age-based rate × 2,000 for right-hand-drive/converted EVs" : "GEL 3,000 fixed excise for right-hand-drive/converted EVs") : "GEL 0 excise for left-hand-drive EVs") : classicCar ? "GEL 1.00 per cm³ for a vehicle classified as a classic car" : `${formatireGelTanxa(result.rate)} per cm³`}. {makeName && modelName && selectedEngine ? `${makeName} ${modelName} · ${selectedEngine.label}.` : "Check the engine capacity against the car's documents."} The catalogue lists common variants only, not every year or market configuration. Transitional cases and vehicle classification need official verification.
              </div>
            ) : (
              <div className="notice">Enter the manufacture year from the vehicle documents, then confirm engine size, fuel type and steering side to see the tax rate and total.</div>
            )}
          </section>


          </div>
        </div>
      </section>

      <section className="section section-tint" id="import-costs">
        <div className="container">
          <div className="section-heading cost-section-heading">
            <span className="eyebrow">02 · Add your costs</span>
            <h2>What will it cost to get the car here?</h2>
            <p>Enter the amounts you know in GEL. Use the exchange rate from your quote or bank for foreign-currency prices. Leave unknown costs blank.</p>
          </div>
          <div className="panel cost-entry-panel">
            <AssistedCostEstimator
              currentCosts={{ purchase, auction, inland, shipping, insurance, port, delivery }}
              onApply={miusadageDakhmarebuliKharji}
            />
            <div className="cost-groups">
              <section className="cost-group" aria-labelledby="purchase-cost-heading">
                <div className="cost-group-heading">
                  <span>01</span>
                  <div><h3 id="purchase-cost-heading">Purchase and auction</h3><p>What you pay to buy the car</p></div>
                </div>
                <div className="cost-fields">
                  <NumberField id="purchase" label="Vehicle purchase price (GEL)" value={purchase} onChange={(value) => daaseteManualuriKharji("purchase", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("purchase", valid)} hint={assistedCostFields.purchase ? "Portavero estimate converted from your USD bid at the NBG rate. Edit to replace it with your confirmed amount." : undefined} />
                  <NumberField id="auction" label="Auction / buyer fees (GEL)" value={auction} onChange={(value) => daaseteManualuriKharji("auction", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("auction", valid)} hint={assistedCostFields.auction ? "Calculated from the selected Copart buyer and virtual-bid fee schedule. Other lot charges may apply." : undefined} />
                </div>
              </section>
              <section className="cost-group" aria-labelledby="transport-cost-heading">
                <div className="cost-group-heading">
                  <span>02</span>
                  <div><h3 id="transport-cost-heading">Transport to Georgia</h3><p>From the seller to the destination port</p></div>
                </div>
                <div className="cost-fields">
                  <NumberField id="inland" label="Origin inland transport (GEL)" value={inland} onChange={(value) => daaseteManualuriKharji("inland", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("inland", valid)} hint={assistedCostFields.inland ? "Portavero USA-to-Poti benchmark midpoint. Replace with a carrier quote when available." : undefined} />
                  <NumberField id="shipping" label="International shipping (GEL)" value={shipping} onChange={(value) => daaseteManualuriKharji("shipping", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("shipping", valid)} hint={assistedCostFields.shipping ? "Portavero USA-to-Poti benchmark midpoint. Replace with a carrier quote when available." : undefined} />
                  <NumberField id="insurance" label="Insurance (GEL)" value={insurance} onChange={(value) => daaseteManualuriKharji("insurance", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("insurance", valid)} hint={assistedCostFields.insurance ? "Illustrative 0.2% of the expected bid, not an insurer quotation." : undefined} />
                </div>
              </section>
              <section className="cost-group" aria-labelledby="arrival-cost-heading">
                <div className="cost-group-heading">
                  <span>03</span>
                  <div><h3 id="arrival-cost-heading">Arrival and delivery</h3><p>Port handling and local transport</p></div>
                </div>
                <div className="cost-fields">
                  <NumberField id="port" label="Port, broker and storage (GEL)" value={port} onChange={(value) => daaseteManualuriKharji("port", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("port", valid)} hint={assistedCostFields.port ? "Shared-container Poti benchmark midpoint. Broker, storage and special handling charges can differ." : undefined} />
                  <NumberField id="delivery" label="Local delivery / other costs (GEL)" value={delivery} onChange={(value) => daaseteManualuriKharji("delivery", value)} onValidityChange={(valid) => shetaniliKharjisValiduroba("delivery", valid)} hint={assistedCostFields.delivery ? "GEL 0 applied because collection at Poti was selected." : "Exclude standard registration and clearance fees already counted above. Delivery prices require a quote."} />
                </div>
              </section>
            </div>
            <div className="cost-entry-footer">
              <p>Blank costs are not treated as free. Your known total updates as you enter each amount.</p>
              <a href="#estimate-result" className="button button-dark">Review updated total <span aria-hidden="true">↑</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="section estimate-review-section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">03 · Review your estimate</span>
            <h2>Your import estimate</h2>
            <p>Review the estimated taxes, standard fees and costs you entered. The total updates whenever you change a vehicle detail or amount.</p>
          </div>
                    <aside className="panel result-panel" id="estimate-result">
            <span className="result-label">Known total so far</span>
            <div className="result-total" role="status" aria-live="polite">{canShowTaxEstimate && result.total !== null && !result.invalidAmounts ? formatireGelTanxa(result.total) : "Complete details"}</div>
            <p>{canShowTaxEstimate ? `${year} manufacture year · ${declarationYear} declaration year` : "Complete the required vehicle details to calculate the taxes and total."} The total includes GEL 480 in standard fees and only the costs entered below.</p>
            <div className="estimate-cost-progress">
              <span>Additional cost categories entered</span>
              <strong>{7 - result.unknownCosts} of 7</strong>
            </div>
            <div className="result-lines">
              <div className="result-line"><span>Estimated excise tax</span><strong>{canShowTaxEstimate && !result.invalidTaxAmounts ? formatireGelTanxa(result.excise) : "Confirm car details"}</strong></div>
              <div className="result-line"><span>Purchase and auction</span><strong>{sheyvaniliJamiJgufi([purchase, auction])}</strong></div>
              <div className="result-line"><span>Origin transport, shipping and insurance</span><strong>{sheyvaniliJamiJgufi([inland, shipping, insurance])}</strong></div>
              <div className="result-line"><span>Estimated import duty</span><strong>{canShowTaxEstimate && !result.invalidTaxAmounts ? (isElectric ? "Exempt for EVs" : formatireGelTanxa(result.importDuty)) : "Check details"}</strong></div>
              <div className="result-line"><span>Standard clearance and registration fees</span><strong>{formatireGelTanxa(result.officialFees)}</strong></div>
              <div className="result-line"><span>Port and local delivery</span><strong>{sheyvaniliJamiJgufi([port, delivery])}</strong></div>
            </div>
            <div className="disclaimer">{(result.invalidCosts.length > 0 || hasInvalidCostField) && <><strong>One of the amounts needs checking.</strong> Portavero cannot safely calculate the total until you fix the invalid entry. </>}<strong>{result.unknownCosts} of 7 cost categories still unknown.</strong> {result.unknownCosts > 0 ? "Blank costs are not included, so this is not the final price of the car." : "You've entered an amount for every additional cost."} The total includes GEL 480 in listed standard fees. A broker, storage, special handling, vehicle classification or transitional rules may add costs or change the tax amount.</div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container content-narrow prose">
          <h2>Tax rules and where to check them</h2>
          <p>For the passenger-car cases covered here, the current rules (from 2 April 2026) use a base excise rate of GEL 1.50 per cm³ for cars aged 0–6 years and GEL 4.50 per cm³ for older cars. Right-hand-drive or converted cars use three times the ordinary rate. Left-hand-drive hybrids aged 0–6 years get a 60% reduction. This version calculates GEL 0 excise for left-hand-drive electric cars and GEL 3,000 for right-hand-drive or converted electric cars. It also includes the GEL 1.00 per cm³ rate for cars over 30 years old that are legally classified as classic cars. The car's age is based on the manufacture year and the year its customs declaration is registered, not the exact date. The vehicle list is only a guide to common variants.</p>
          <p>Import duty is estimated under Article 197(6): GEL 0.05 per cm³, with an extra 5% of the base duty for each year the car has been in use. Electric cars are exempt from import duty. The previous excise rates can be selected only for cases that meet the transitional rules, and the required documents must be checked with the Revenue Service. The estimate also includes GEL 480 in listed fees: GEL 150 clearance, GEL 50 declaration, GEL 30 expert examination, GEL 50 internal transit number, GEL 100 registration certificate, GEL 80 number plate and GEL 20 inspection act. Broker fees, storage, special handling and other exceptions are not included.</p>
          <p><strong>Before you bid or ship the car, check its details in the official <a href={rsKalkulatorisMisamarti} target="_blank" rel="noreferrer">Revenue Service Auto/Moto Levy Calculator</a>.</strong> If you are unsure about its classification or whether the transitional rules apply, ask the Revenue Service.</p>
          <p>Sources: <a href="https://new.matsne.gov.ge/en/document/view/1043717" target="_blank" rel="noreferrer">Tax Code of Georgia, Articles 188, 197 and 199</a> and the <a href="https://voice.rs.ge/Default.aspx?id=3874" target="_blank" rel="noreferrer">Revenue Service notice on the April 2, 2026 change</a>. This estimate is informational, not a binding customs assessment. Verify the final amount with the official <a href={rsKalkulatorisMisamarti} target="_blank" rel="noreferrer">Revenue Service calculator</a>.</p>
        </div>
      </section>
    </div>
  );
}
