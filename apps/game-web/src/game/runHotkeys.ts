export type RunHotkeyAction = "launch" | "restart-run" | "restart-briefing";

export type RunHotkeyTargetLike = {
  tagName?: string;
  isContentEditable?: boolean;
};

export type RunHotkeyInput = {
  code: string;
  preflightOpen: boolean;
  resultOpen: boolean;
  target?: RunHotkeyTargetLike | null;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
  isComposing?: boolean;
};

export function resolveRunHotkeyAction(input: RunHotkeyInput): RunHotkeyAction | undefined {
  if (
    input.altKey ||
    input.ctrlKey ||
    input.metaKey ||
    input.repeat ||
    input.isComposing ||
    isBlockedRunHotkeyTarget(input.target)
  ) {
    return undefined;
  }

  if (input.preflightOpen && input.code === "Enter") {
    return "launch";
  }

  if (!input.resultOpen) {
    return undefined;
  }

  if (input.code === "KeyR") {
    return "restart-run";
  }

  if (input.code === "KeyB") {
    return "restart-briefing";
  }

  return undefined;
}

export function isBlockedRunHotkeyTarget(target: RunHotkeyTargetLike | null | undefined): boolean {
  const tagName = target?.tagName?.toUpperCase();
  return Boolean(
    target?.isContentEditable ||
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      tagName === "BUTTON" ||
      tagName === "A"
  );
}
