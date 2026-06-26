export type SpacePhenomenonHazard = {
  type: string;
  severity?: number;
};

export type SpacePhenomenonPresentation = {
  label: "Phenomenon";
  value: string;
  detail: string;
  tone: "portal" | "storm" | "magnetic" | "wind" | "gravity";
};

export function buildSpacePhenomenon(hazards: readonly SpacePhenomenonHazard[] | undefined): SpacePhenomenonPresentation | undefined {
  if (!hazards || hazards.length === 0) {
    return undefined;
  }

  const types = new Set(hazards.map((hazard) => hazard.type));

  if (types.has("wormhole")) {
    return { label: "Phenomenon", value: "Wormhole", detail: "Exit fast", tone: "portal" };
  }

  if (types.has("ion_storm")) {
    return { label: "Phenomenon", value: "Ion storm", detail: "Drift light", tone: "storm" };
  }

  if (types.has("magnetic_burst")) {
    return { label: "Phenomenon", value: "Mag field", detail: "Missiles bend", tone: "magnetic" };
  }

  if (types.has("solar_wind")) {
    return { label: "Phenomenon", value: "Solar wind", detail: "Ride push", tone: "wind" };
  }

  if (types.has("gravity_ripple")) {
    return { label: "Phenomenon", value: "Gravity wave", detail: "Read arc", tone: "gravity" };
  }

  return undefined;
}
