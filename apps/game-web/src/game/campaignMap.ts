import type { BestRun } from "./bestRun";

export type CampaignMapMissionType = "standard" | "longhaul" | "rescue" | "escort" | "raid";

export type CampaignMapContract = {
  id: string;
  title: string;
  missionType?: CampaignMapMissionType;
};

export type CampaignSectorId = "starter" | "deep-space" | "combat" | "boss";
export type CampaignNodeStatus = "active" | "cleared" | "comet" | "locked" | "next";
export type CampaignSectorStatus = "active" | "complete" | "progress" | "locked";

export type CampaignMapNode = {
  contractId: string;
  title: string;
  status: CampaignNodeStatus;
};

export type CampaignMapSector = {
  id: CampaignSectorId;
  label: "Starter" | "Deep Space" | "Combat" | "Boss";
  status: CampaignSectorStatus;
  nodes: CampaignMapNode[];
};

export type CampaignMapSummary = {
  label: "Campaign map";
  value: `${number}/${number}`;
  detail: "All sectors clear" | `Next: ${string}`;
  tone: "open" | "progress" | "complete";
};

export type CampaignMap = {
  summary: CampaignMapSummary;
  sectors: CampaignMapSector[];
};

export type CampaignMapInput = {
  contracts: readonly CampaignMapContract[];
  activeContractId: string;
  bestRunsByContract: Readonly<Record<string, BestRun | undefined>>;
};

const sectorOrder: readonly CampaignSectorId[] = ["starter", "deep-space", "combat", "boss"];
const sectorLabels: Record<CampaignSectorId, CampaignMapSector["label"]> = {
  starter: "Starter",
  "deep-space": "Deep Space",
  combat: "Combat",
  boss: "Boss"
};

export function buildCampaignMap(input: CampaignMapInput): CampaignMap {
  const firstOpen = input.contracts.find((contract) => !input.bestRunsByContract[contract.id]);
  const sectors = sectorOrder
    .map((sectorId) => {
      const nodes = input.contracts.filter((contract) => sectorFor(contract, input.contracts) === sectorId).map((contract) =>
        buildCampaignMapNode({
          contract,
          activeContractId: input.activeContractId,
          firstOpenContractId: firstOpen?.id,
          bestRun: input.bestRunsByContract[contract.id]
        })
      );
      if (nodes.length === 0) {
        return undefined;
      }
      return {
        id: sectorId,
        label: sectorLabels[sectorId],
        status: sectorStatus(nodes),
        nodes
      };
    })
    .filter((sector): sector is CampaignMapSector => sector !== undefined);

  const cleared = input.contracts.filter((contract) => input.bestRunsByContract[contract.id]).length;
  const total = input.contracts.length;

  return {
    summary: {
      label: "Campaign map",
      value: `${cleared}/${total}`,
      detail: firstOpen ? `Next: ${firstOpen.title}` : "All sectors clear",
      tone: total > 0 && cleared === total ? "complete" : cleared > 0 ? "progress" : "open"
    },
    sectors
  };
}

function buildCampaignMapNode(input: {
  contract: CampaignMapContract;
  activeContractId: string;
  firstOpenContractId: string | undefined;
  bestRun: BestRun | undefined;
}): CampaignMapNode {
  if (input.contract.id === input.activeContractId) {
    return {
      contractId: input.contract.id,
      title: input.contract.title,
      status: "active"
    };
  }

  if (input.bestRun?.medal === "comet") {
    return {
      contractId: input.contract.id,
      title: input.contract.title,
      status: "comet"
    };
  }

  if (input.bestRun) {
    return {
      contractId: input.contract.id,
      title: input.contract.title,
      status: "cleared"
    };
  }

  return {
    contractId: input.contract.id,
    title: input.contract.title,
    status: input.contract.id === input.firstOpenContractId ? "next" : "locked"
  };
}

function sectorFor(contract: CampaignMapContract, contracts: readonly CampaignMapContract[]): CampaignSectorId {
  if (contract.missionType === "raid") {
    return "boss";
  }
  if (contract.missionType === "longhaul" || contract.missionType === "rescue") {
    return "deep-space";
  }
  if (contract.missionType === "escort" || contract.id.includes("interceptor") || contract.id.includes("sentinel") || contract.id.includes("forge")) {
    return "combat";
  }
  return contracts.indexOf(contract) <= 1 ? "starter" : "deep-space";
}

function sectorStatus(nodes: readonly CampaignMapNode[]): CampaignSectorStatus {
  if (nodes.some((node) => node.status === "active")) {
    return "active";
  }
  if (nodes.every((node) => node.status === "cleared" || node.status === "comet")) {
    return "complete";
  }
  if (nodes.some((node) => node.status === "cleared" || node.status === "comet" || node.status === "next")) {
    return "progress";
  }
  return "locked";
}
