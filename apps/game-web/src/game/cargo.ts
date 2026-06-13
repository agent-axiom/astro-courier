export type CargoManifestInput = {
  cargoName: string;
  cargoOnboard: boolean;
};

export type CargoManifest = {
  label: "Cargo";
  value: string;
};

export function buildCargoManifest(input: CargoManifestInput): CargoManifest {
  return {
    label: "Cargo",
    value: input.cargoName
  };
}
