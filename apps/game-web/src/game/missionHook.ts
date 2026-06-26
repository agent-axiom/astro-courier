export type MissionHookKind = "smuggler" | "evac" | "multiDrop" | "rival" | "portal";

export type MissionHookContract = {
  id: string;
  title: string;
  riskLabel: string;
  missionHook?: MissionHookKind;
};

export type MissionHookPresentation = {
  label: "Hook";
  value: "Stay cold" | "Extract fast" | "Chain drops" | "Beat rival" | "Read portal";
  detail: string;
  tone: "stealth" | "rescue" | "route" | "chase" | "phenomena";
};

export function buildMissionHook(contract: MissionHookContract | undefined): MissionHookPresentation | undefined {
  if (!contract?.missionHook) {
    return undefined;
  }

  if (contract.missionHook === "smuggler") {
    return missionHook("Stay cold", contract.riskLabel, "stealth");
  }
  if (contract.missionHook === "evac") {
    return missionHook("Extract fast", contract.riskLabel, "rescue");
  }
  if (contract.missionHook === "multiDrop") {
    return missionHook("Chain drops", contract.riskLabel, "route");
  }
  if (contract.missionHook === "rival") {
    return missionHook("Beat rival", contract.riskLabel, "chase");
  }
  return missionHook("Read portal", contract.riskLabel, "phenomena");
}

function missionHook(value: MissionHookPresentation["value"], detail: string, tone: MissionHookPresentation["tone"]): MissionHookPresentation {
  return {
    label: "Hook",
    value,
    detail,
    tone
  };
}
