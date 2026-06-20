import { z } from "zod";

const vec2Schema = z.tuple([z.number().finite(), z.number().finite()]);

export const landingPadSchema = z.object({
  id: z.string().min(1),
  position: vec2Schema,
  normalAngle: z.number().finite(),
  radius: z.number().positive(),
  allowedApproachSpeed: z.number().positive(),
  requiredAngleTolerance: z.number().positive()
});

export const planetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: vec2Schema,
  radius: z.number().positive(),
  gravityMass: z.number().positive(),
  influenceRadius: z.number().positive(),
  visualTheme: z.string().min(1),
  landingPads: z.array(landingPadSchema)
});

export const stationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: vec2Schema,
  landingPads: z.array(landingPadSchema)
});

export const hazardSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["asteroid_field", "solar_wind", "customs_drone", "gravity_ripple", "radiation", "nebula"]),
  position: vec2Schema,
  radius: z.number().positive(),
  severity: z.number().min(0).max(1)
});

export const cargoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["fragile", "hot", "cold", "live", "illegal-ish", "unstable", "volatile", "magnetic", "time-sensitive", "luxury"]),
  fragility: z.number().min(0).max(1)
});

export const contractShipStartSchema = z.object({
  position: vec2Schema,
  velocity: vec2Schema,
  rotation: z.number().finite(),
  fuel: z.number().positive().optional()
});

export const enemyWaveSchema = z
  .object({
    drones: z.number().int().min(0).max(8).optional(),
    fighters: z.number().int().min(0).max(8).optional(),
    brutes: z.number().int().min(0).max(4).optional()
  });

export const contractSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  briefing: z.string().min(1),
  riskLabel: z.string().min(1),
  rewardLabel: z.string().min(1),
  shipStart: contractShipStartSchema.optional(),
  pickupId: z.string().min(1),
  destinationId: z.string().min(1),
  cargoId: z.string().min(1),
  hazardSeverityMultiplier: z.number().positive().max(3).optional(),
  hazards: z.array(hazardSchema).optional(),
  riskGateCount: z.number().int().min(0).max(12).optional(),
  enemyWave: enemyWaveSchema.optional(),
  medalTimes: z
    .object({
      bronze: z.number().positive(),
      silver: z.number().positive(),
      gold: z.number().positive()
    })
    .refine((times) => times.gold <= times.silver && times.silver <= times.bronze, {
      message: "medalTimes must be ordered as gold <= silver <= bronze"
    })
});

export const shipSchema = z.object({
  startPosition: vec2Schema,
  startVelocity: vec2Schema,
  rotation: z.number().finite(),
  fuel: z.number().positive(),
  thrustPower: z.number().positive(),
  rotationPower: z.number().positive()
});

export const systemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    difficulty: z.number().int().min(1).max(10),
    background: z.string().min(1),
    musicIntensity: z.enum(["stealth", "alarm", "lockdown"]),
    ship: shipSchema,
    planets: z.array(planetSchema).min(1),
    stations: z.array(stationSchema),
    hazards: z.array(hazardSchema),
    contracts: z.array(contractSchema).min(1),
    cargo: z.array(cargoSchema).min(1)
  })
  .superRefine((system, context) => {
    const padIds = new Set([
      ...system.planets.flatMap((planet) => planet.landingPads.map((pad) => pad.id)),
      ...system.stations.flatMap((station) => station.landingPads.map((pad) => pad.id))
    ]);
    const cargoIds = new Set(system.cargo.map((cargo) => cargo.id));

    system.contracts.forEach((contract, index) => {
      if (!padIds.has(contract.pickupId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contracts", index, "pickupId"],
          message: `Unknown pickup pad "${contract.pickupId}"`
        });
      }
      if (!padIds.has(contract.destinationId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contracts", index, "destinationId"],
          message: `Unknown destination pad "${contract.destinationId}"`
        });
      }
      if (!cargoIds.has(contract.cargoId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contracts", index, "cargoId"],
          message: `Unknown cargo "${contract.cargoId}"`
        });
      }
    });
  });

export type LandingPadContent = z.infer<typeof landingPadSchema>;
export type PlanetContent = z.infer<typeof planetSchema>;
export type StationContent = z.infer<typeof stationSchema>;
export type HazardContent = z.infer<typeof hazardSchema>;
export type CargoContent = z.infer<typeof cargoSchema>;
export type ContractContent = z.infer<typeof contractSchema>;
export type SystemContent = z.infer<typeof systemSchema>;

export function validateSystemContent(content: unknown): SystemContent {
  return systemSchema.parse(content);
}
