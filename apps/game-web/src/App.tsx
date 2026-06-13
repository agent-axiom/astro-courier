import { Gauge, PackageCheck, Pause, Play, RotateCcw, Satellite, Trophy, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { GameShell, type HudState } from "./game/GameShell";

type GameStore = {
  hud: HudState;
  setHud: (hud: HudState) => void;
};

const initialHud: HudState = {
  status: "flying",
  objectivePhase: "pickup",
  contractTitle: "First Light Delivery",
  elapsedSeconds: 0,
  score: 0,
  fuel: 100,
  maxFuel: 100,
  cargoDamage: 0,
  cargoOnboard: false,
  speed: 0
};

const useGameStore = create<GameStore>((set) => ({
  hud: initialHud,
  setHud: (hud) => set({ hud })
}));

export function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<GameShell | null>(null);
  const hud = useGameStore((state) => state.hud);
  const setHud = useGameStore((state) => state.setHud);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!canvasMountRef.current) return undefined;

    const shell = new GameShell({
      mount: canvasMountRef.current,
      onHud: setHud
    });
    shellRef.current = shell;
    void shell.start();

    return () => {
      shell.destroy();
      shellRef.current = null;
    };
  }, [setHud]);

  const fuelRatio = hud.maxFuel > 0 ? hud.fuel / hud.maxFuel : 0;
  const cargoIntegrity = Math.max(0, 1 - hud.cargoDamage);
  const runFinished = hud.status === "delivered" || hud.status === "crashed";

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
            aria-label={paused ? "Resume" : "Pause"}
            title={paused ? "Resume" : "Pause"}
            onClick={() => {
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
            onClick={() => {
              setPaused(false);
              shellRef.current?.restart();
            }}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <aside className="run-panel" aria-label="Delivery status">
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
          <strong>{hud.targetDistance === undefined ? "-" : `${Math.round(hud.targetDistance)}m`}</strong>
        </div>
        {hud.landingStatus ? (
          <div className={`guidance-chip guidance-${hud.assistAvailable ? "assist" : hud.landingStatus}`}>
            {guidanceLabel(hud.landingStatus, Boolean(hud.assistAvailable))}
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

      {runFinished ? (
        <section className={`result-overlay result-${hud.status}`} aria-label="Run result">
          <Trophy aria-hidden="true" size={28} />
          <h2>{hud.status === "delivered" ? "Delivery Complete" : "Delivery Failed"}</h2>
          <p>{hud.landingRating ?? statusLabel(hud.status)}</p>
          <div className="result-stats">
            <span>{hud.score}</span>
            <span>{hud.elapsedSeconds.toFixed(1)}s</span>
            <span>{Math.round(cargoIntegrity * 100)}%</span>
          </div>
          <button
            type="button"
            className="result-button"
            onClick={() => {
              setPaused(false);
              shellRef.current?.restart();
            }}
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
