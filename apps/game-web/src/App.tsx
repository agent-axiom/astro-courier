import { Gauge, OctagonMinus, PackageCheck, Pause, Play, RotateCcw, Satellite, Trophy, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { getBestRun, recordBestRun, type BestRun } from "./game/bestRun";
import { GameShell, type HudState } from "./game/GameShell";
import { canUseImpulseControl } from "./game/hudControls";
import { buildRadioMessage } from "./game/radio";

type GameStore = {
  hud: HudState;
  setHud: (hud: HudState) => void;
};

const initialHud: HudState = {
  status: "paused",
  objectivePhase: "pickup",
  contractTitle: "First Light Delivery",
  elapsedSeconds: 0,
  score: 0,
  fuel: 100,
  maxFuel: 100,
  cargoDamage: 0,
  cargoOnboard: false,
  speed: 0,
  medal: "none",
  scoreBreakdown: {
    base: 0,
    paceBonus: 0,
    fuelBonus: 0,
    cargoBonus: 0,
    landingBonus: 0,
    styleBonus: 0,
    incidentPenalty: 0,
    total: 0
  },
  paceTier: "gold",
  paceSecondsRemaining: 35,
  approachStreakSeconds: 0,
  bestApproachStreakSeconds: 0,
  hazardDangerLevel: undefined,
  hazardDistance: undefined
};

const useGameStore = create<GameStore>((set) => ({
  hud: initialHud,
  setHud: (hud) => set({ hud })
}));

const bestRunKey = "first-light-delivery";

export function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<GameShell | null>(null);
  const recordedRunRef = useRef<string | null>(null);
  const hud = useGameStore((state) => state.hud);
  const setHud = useGameStore((state) => state.setHud);
  const [paused, setPaused] = useState(true);
  const [preflightOpen, setPreflightOpen] = useState(true);
  const [bestRun, setBestRun] = useState<BestRun | undefined>(() => {
    const storage = getBestRunStorage();
    return storage ? getBestRun(storage, bestRunKey) : undefined;
  });
  const [newBest, setNewBest] = useState(false);

  useEffect(() => {
    if (!canvasMountRef.current) return undefined;

    const shell = new GameShell({
      mount: canvasMountRef.current,
      onHud: setHud,
      initialPaused: true
    });
    shellRef.current = shell;
    void shell.start();

    return () => {
      shell.destroy();
      shellRef.current = null;
    };
  }, [setHud]);

  useEffect(() => {
    if (hud.status !== "delivered") {
      if (hud.status === "flying" || hud.status === "paused") {
        recordedRunRef.current = null;
        setNewBest(false);
      }
      return;
    }

    const runFingerprint = `${hud.score}:${hud.elapsedSeconds}:${hud.medal}`;
    if (recordedRunRef.current === runFingerprint) {
      return;
    }

    recordedRunRef.current = runFingerprint;
    const storage = getBestRunStorage();
    if (!storage) {
      return;
    }
    const result = recordBestRun(storage, bestRunKey, {
      score: hud.score,
      elapsedSeconds: hud.elapsedSeconds,
      medal: hud.medal
    });
    setBestRun(result.best);
    setNewBest(result.isNewBest);
  }, [hud.elapsedSeconds, hud.medal, hud.score, hud.status]);

  const fuelRatio = hud.maxFuel > 0 ? hud.fuel / hud.maxFuel : 0;
  const cargoIntegrity = Math.max(0, 1 - hud.cargoDamage);
  const runFinished = hud.status === "delivered" || hud.status === "crashed";
  const radioMessage = buildRadioMessage(hud);
  const targetDistanceLabel = hud.targetDistance === undefined ? "-" : `${Math.round(hud.targetDistance)}m`;
  const primaryActionLabel = preflightOpen ? "Launch" : paused ? "Resume" : "Pause";
  const canBoost = canUseImpulseControl({ action: "boost", fuel: hud.fuel, paused, preflightOpen, status: hud.status });
  const canBrake = canUseImpulseControl({ action: "brake", fuel: hud.fuel, paused, preflightOpen, status: hud.status });

  const launchContract = () => {
    setPreflightOpen(false);
    setPaused(false);
    shellRef.current?.setPaused(false);
  };

  const restartToBriefing = () => {
    setPreflightOpen(true);
    setPaused(true);
    shellRef.current?.restart(true);
  };

  return (
    <main className="app-shell">
      <div ref={canvasMountRef} className="game-canvas" aria-label="Astro Courier gameplay canvas" />

      <header className="top-hud">
        <div className="brand-lockup">
          <Satellite aria-hidden="true" size={22} />
          <div>
            <h1>Astro Courier</h1>
            <p>{hud.contractTitle}</p>
          </div>
        </div>

        <div className="hud-metrics" aria-label="Run metrics">
          <Metric icon={<Zap size={18} />} label="Fuel" value={`${Math.round(fuelRatio * 100)}%`} tone={fuelRatio < 0.25 ? "danger" : "normal"} />
          <Metric icon={<Gauge size={18} />} label="Speed" value={hud.speed.toFixed(1)} tone={hud.speed > 45 ? "warning" : "normal"} />
          <Metric
            icon={<PackageCheck size={18} />}
            label="Cargo"
            value={hud.cargoOnboard ? `${Math.round(cargoIntegrity * 100)}%` : "Empty"}
            tone={cargoIntegrity < 0.7 ? "warning" : "normal"}
          />
        </div>

        <div className="hud-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Boost"
            title="Boost"
            disabled={!canBoost}
            onClick={() => {
              shellRef.current?.queueCommand({ type: "BOOST" });
            }}
          >
            <Zap size={20} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Brake"
            title="Brake"
            disabled={!canBrake}
            onClick={() => {
              shellRef.current?.queueCommand({ type: "BRAKE", amount: 1 });
            }}
          >
            <OctagonMinus size={20} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={primaryActionLabel}
            title={primaryActionLabel}
            onClick={() => {
              if (preflightOpen) {
                launchContract();
                return;
              }
              const next = !paused;
              setPaused(next);
              shellRef.current?.setPaused(next);
            }}
          >
            {paused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Restart"
            title="Restart"
            onClick={restartToBriefing}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <aside className="run-panel" aria-label="Delivery status">
        <div className="radio-message">{radioMessage}</div>
        <div className="status-row">
          <span>Status</span>
          <strong>{statusLabel(hud.status)}</strong>
        </div>
        <div className="status-row">
          <span>Objective</span>
          <strong>{objectiveLabel(hud)}</strong>
        </div>
        <div className="status-row">
          <span>Target</span>
          <strong>{targetDistanceLabel}</strong>
        </div>
        <div className={`pace-chip pace-${hud.paceTier}`}>
          <span>{paceLabel(hud.paceTier)}</span>
          <strong>{hud.paceTier === "overtime" ? "Expired" : `${hud.paceSecondsRemaining.toFixed(1)}s`}</strong>
        </div>
        {hud.hazardDangerLevel ? (
          <div className={`hazard-chip hazard-${hud.hazardDangerLevel}`}>
            <span>{hud.hazardDangerLevel === "inside" ? "Hazard contact" : "Hazard near"}</span>
            <strong>{hud.hazardDistance === undefined ? "" : `${Math.round(hud.hazardDistance)}m`}</strong>
          </div>
        ) : null}
        {hud.landingStatus ? (
          <div className={`guidance-chip guidance-${hud.assistAvailable ? "assist" : hud.landingStatus}`}>
            {guidanceLabel(hud.landingStatus, Boolean(hud.assistAvailable))}
          </div>
        ) : null}
        {hud.approachStreakSeconds >= 0.25 ? (
          <div className="streak-chip">
            <span>Stable approach</span>
            <strong>{hud.approachStreakSeconds.toFixed(1)}s</strong>
          </div>
        ) : null}
        <div className="status-row">
          <span>Time</span>
          <strong>{hud.elapsedSeconds.toFixed(1)}s</strong>
        </div>
        <div className="status-row">
          <span>Score</span>
          <strong>{hud.score}</strong>
        </div>
        {hud.lastMilestone && !runFinished ? <div className="milestone">{hud.lastMilestone}</div> : null}
        {hud.landingRating ? <div className="landing-rating">{hud.landingRating}</div> : null}
      </aside>

      {preflightOpen && !runFinished ? (
        <section className="preflight-overlay" aria-label="Launch briefing">
          <div className="preflight-kicker">Starter Contract</div>
          <h2>{hud.contractTitle}</h2>
          <p>Pickup beacon is live. The destination pad is paying for intact cargo and a clean approach.</p>
          <div className="preflight-stats" aria-label="Contract briefing">
            <span>
              <PackageCheck size={18} />
              Pickup
            </span>
            <span>
              <Trophy size={18} />
              Gold {hud.paceSecondsRemaining.toFixed(0)}s
            </span>
            <span>
              <Zap size={18} />
              {Math.round(fuelRatio * 100)}%
            </span>
          </div>
          <button type="button" className="preflight-button" onClick={launchContract}>
            <Play size={18} />
            Launch Contract
          </button>
        </section>
      ) : null}

      {runFinished ? (
        <section className={`result-overlay result-${hud.status}`} aria-label="Run result">
          <Trophy aria-hidden="true" size={28} />
          <h2>{hud.status === "delivered" ? "Delivery Complete" : "Delivery Failed"}</h2>
          <p>{hud.status === "crashed" ? crashReasonLabel(hud) : hud.landingRating ?? statusLabel(hud.status)}</p>
          {hud.medal !== "none" ? <div className={`medal-banner medal-${hud.medal}`}>{medalLabel(hud.medal)}</div> : null}
          {hud.status === "delivered" && bestRun ? (
            <div className={`best-run ${newBest ? "best-run-new" : ""}`}>
              <span>{newBest ? "New best" : "Personal best"}</span>
              <strong>
                {bestRun.score} / {bestRun.elapsedSeconds.toFixed(1)}s
              </strong>
            </div>
          ) : null}
          <div className="result-stats">
            <span>{hud.score}</span>
            <span>{hud.elapsedSeconds.toFixed(1)}s</span>
            <span>{Math.round(cargoIntegrity * 100)}%</span>
          </div>
          <div className="score-breakdown" aria-label="Score breakdown">
            {scoreBreakdownRows(hud).map((row) => (
              <div key={row.label} className={row.tone === "penalty" ? "score-row score-row-penalty" : "score-row"}>
                <span>{row.label}</span>
                <strong>{formatScoreValue(row.value, row.tone)}</strong>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="result-button"
            onClick={restartToBriefing}
          >
            <RotateCcw size={18} />
            Restart
          </button>
        </section>
      ) : null}
    </main>
  );
}

type MetricProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "normal" | "warning" | "danger";
};

function Metric({ icon, label, value, tone }: MetricProps) {
  return (
    <div className={`metric metric-${tone}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusLabel(status: HudState["status"]): string {
  if (status === "delivered") return "Delivered";
  if (status === "crashed") return "Crashed";
  if (status === "paused") return "Paused";
  return "In flight";
}

function objectiveLabel(hud: HudState): string {
  if (hud.objectivePhase === "complete") return "Complete";
  if (hud.objectivePhase === "delivery") return "Deliver";
  return hud.lastMilestone === "Pickup Required" ? "Pickup first" : "Pickup";
}

function guidanceLabel(status: NonNullable<HudState["landingStatus"]>, assistAvailable: boolean): string {
  if (assistAvailable) return "Assist burn ready";
  if (status === "ready") return "Ready to dock";
  if (status === "too-fast") return "Slow down";
  if (status === "misaligned") return "Align ship";
  return "Approach target";
}

function medalLabel(medal: HudState["medal"]): string {
  if (medal === "comet") return "Comet Medal";
  if (medal === "gold") return "Gold Medal";
  if (medal === "silver") return "Silver Medal";
  if (medal === "bronze") return "Bronze Medal";
  return "No Medal";
}

function paceLabel(tier: HudState["paceTier"]): string {
  if (tier === "gold") return "Gold pace";
  if (tier === "silver") return "Silver pace";
  if (tier === "bronze") return "Bronze pace";
  return "Overtime";
}

function crashReasonLabel(hud: HudState): string {
  if (hud.crashReason === "Hard Landing") return "Hard landing: slow and align before contact";
  if (hud.crashReason === "Hull Collision") return "Hull collision: keep clear of gravity wells";
  return hud.landingRating ?? "Insurance Event";
}

type ScoreRow = {
  label: string;
  value: number;
  tone: "base" | "bonus" | "penalty";
};

function scoreBreakdownRows(hud: HudState): ScoreRow[] {
  const breakdown = hud.scoreBreakdown;
  const rows = [
    { label: "Base", value: breakdown.base, tone: "base" },
    { label: "Pace", value: breakdown.paceBonus, tone: "bonus" },
    { label: "Fuel", value: breakdown.fuelBonus, tone: "bonus" },
    { label: "Cargo", value: breakdown.cargoBonus, tone: "bonus" },
    { label: "Landing", value: breakdown.landingBonus, tone: "bonus" },
    { label: "Style", value: breakdown.styleBonus, tone: "bonus" },
    { label: "Incident", value: breakdown.incidentPenalty, tone: "penalty" }
  ] satisfies ScoreRow[];

  return rows.filter((row) => row.tone === "base" || row.value > 0);
}

function formatScoreValue(value: number, tone: ScoreRow["tone"]): string {
  const rounded = Math.round(value);
  if (tone === "base") return `${rounded}`;
  if (tone === "penalty") return `-${rounded}`;
  return `+${rounded}`;
}

function getBestRunStorage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
