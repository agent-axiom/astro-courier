import { describe, expect, it } from "vitest";
import { buildCampaignMap } from "./campaignMap";
import type { BestRun } from "./bestRun";

const contracts = [
  { id: "first-light-delivery", title: "First Light Delivery" },
  { id: "luma-longhaul", title: "Luma Longhaul", missionType: "longhaul" as const },
  { id: "rescue-pod-run", title: "Rescue Pod Run", missionType: "rescue" as const },
  { id: "interceptor-swarm", title: "Interceptor Swarm", missionType: "standard" as const },
  { id: "forge-flagship-raid", title: "Forge Flagship Raid", missionType: "raid" as const }
];

describe("campaign map", () => {
  it("groups route contracts into compact campaign sectors", () => {
    const map = buildCampaignMap({
      contracts,
      activeContractId: "luma-longhaul",
      bestRunsByContract: {}
    });

    expect(map.sectors.map((sector) => [sector.id, sector.label, sector.nodes.map((node) => node.contractId)])).toEqual([
      ["starter", "Starter", ["first-light-delivery"]],
      ["deep-space", "Deep Space", ["luma-longhaul", "rescue-pod-run"]],
      ["combat", "Combat", ["interceptor-swarm"]],
      ["boss", "Boss", ["forge-flagship-raid"]]
    ]);
    expect(map.sectors[1]?.status).toBe("active");
  });

  it("marks cleared, comet, next, and active nodes without extra copy", () => {
    const bestRunsByContract: Record<string, BestRun> = {
      "first-light-delivery": { score: 1000, elapsedSeconds: 31, medal: "gold" },
      "luma-longhaul": { score: 1600, elapsedSeconds: 60, medal: "comet" }
    };

    const map = buildCampaignMap({
      contracts,
      activeContractId: "rescue-pod-run",
      bestRunsByContract
    });

    expect(map.summary).toEqual({
      label: "Campaign map",
      value: "2/5",
      detail: "Next: Rescue Pod Run",
      tone: "progress"
    });
    expect(map.sectors.flatMap((sector) => sector.nodes.map((node) => [node.contractId, node.status]))).toEqual([
      ["first-light-delivery", "cleared"],
      ["luma-longhaul", "comet"],
      ["rescue-pod-run", "active"],
      ["interceptor-swarm", "locked"],
      ["forge-flagship-raid", "locked"]
    ]);
  });
});
