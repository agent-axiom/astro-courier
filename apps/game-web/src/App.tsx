import {
  Activity,
  ArrowRight,
  CalendarDays,
  Flag,
  Gauge,
  MapPin,
  OctagonMinus,
  PackageCheck,
  Pause,
  Play,
  RotateCcw,
  Route,
  Satellite,
  ShieldAlert,
  Star,
  Target,
  TimerReset,
  Trophy,
  Volume2,
  VolumeX,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { create } from "zustand";
import {
  buildBestRunChase,
  buildBestRunDelta,
  buildContractMasteryBadge,
  buildContractBestRunLabel,
  buildLiveBestPace,
  buildRouteBoardRecommendationBadge,
  buildRouteBoardProgress,
  buildRouteBoardSelectionAction,
  buildRouteBoardTarget,
  getBestRun,
  recordBestRun,
  type BestRun
} from "./game/bestRun";
import { GameShell, type HudState } from "./game/GameShell";
import { formatBearingGuidance } from "./game/bearing";
import { buildBoostControlPresentation, canUseImpulseControl } from "./game/hudControls";
import {
  buildContractDangerPayTrait,
  buildContractHazardTrait,
  buildContractPreflightKicker,
  buildContractRoutePlan,
  buildDailyDispatch,
  buildDailyDispatchAction,
  buildDailyDispatchStatus
} from "./game/contracts";
import { buildRadioMessage } from "./game/radio";
import { buildLiveStyleReward } from "./game/style";
import { buildExpressFinishReadout, buildObjectiveDirective, buildObjectiveInterceptReadout, buildTacticalCue } from "./game/objective";
import { buildPreflightBonusObjectives, buildPreflightMasteryTargets } from "./game/mastery";
import { buildApproachRewardReadout, buildDockingSpeedReadout } from "./game/docking";
import { buildCargoManifest, buildCargoRiskReadout, buildContractCargoTrait } from "./game/cargo";
import { buildReplayReceipt, buildResultHighlight, buildResultStats } from "./game/resultStats";
import { buildHazardPressureReadout } from "./game/hazard";
import { buildResultBoardAction, buildResultBoardPrompt, buildResultCoach } from "./game/resultCoach";
import { getOverlayVisibility } from "./game/overlays";
import { buildCometRunReadout } from "./game/comet";
import { buildResultRetryAction, buildRetryTarget } from "./game/retryTarget";
import { buildRunIntensity } from "./game/intensity";
import { buildCrashReasonLabel } from "./game/crash";
import { buildReplayCaptureReadout } from "./game/replayReadout";
import { deriveHudAudioEvents, type HudAudioSnapshot } from "./game/audioEvents";
import { createGameAudioController, type GameAudioController } from "./game/gameAudio";
import { createGameHapticsController, type GameHapticsController } from "./game/gameHaptics";
import { buildAudioTogglePresentation } from "./game/audioControls";
import { buildTouchFlightPadPresentation } from "./game/touchControls";
import { buildScreenFeedback, type ScreenFeedback } from "./game/screenFeedback";
import { appendRunFeedUpdates, deriveRunFeedUpdates, type RunFeedEntry, type RunFeedSnapshot } from "./game/runFeed";

type GameStore = {
  hud: HudState;
  setHud: (hud: HudState) => void;
};

type ActiveScreenFeedback = {
  key: number;
  feedback: ScreenFeedback;
};

const initialHud: HudState = {
  status: "paused",
  objectivePhase: "pickup",
  contractId: "first-light-delivery",
  contractTitle: "First Light Delivery",
  contractBriefing: "Run the standard Luma courier line. Load cleanly, protect the bottle, and dock with fuel to spare.",
  contractRiskLabel: "Training Route",
  contractRewardLabel: "Clean delivery bonuses",
  pickupLabel: "Luma North Pad",
  destinationLabel: "Tea Station Dock A",
  cargoName: "Bottled Starlight",
  cargoKind: "fragile",
  cargoFragility: 0.8,
  hazardSeverityMultiplier: undefined,
  contractOptions: [],
  elapsedSeconds: 0,
  score: 0,
  fuel: 100,
  maxFuel: 100,
  fuelUsed: 0,
  boostCooldownSeconds: 0,
  cargoDamage: 0,
  cargoOnboard: false,
  speed: 0,
  targetAllowedSpeed: 42,
  lastStyleAward: undefined,
  medal: "none",
  grade: "F",
  scoreBreakdown: {
    base: 0,
    paceBonus: 0,
    fuelBonus: 0,
    cargoBonus: 0,
    landingBonus: 0,
    styleBonus: 0,
    dangerBonus: 0,
    incidentPenalty: 0,
    total: 0
  },
  paceTier: "gold",
  paceSecondsRemaining: 35,
  quickPickupSecondsRemaining: 12,
  quickPickupBonus: 180,
  approachStreakSeconds: 0,
  bestApproachStreakSeconds: 0,
  styleChainCount: 0,
  styleChainSecondsRemaining: 0,
  styleMultiplier: 1,
  launchBurstSecondsRemaining: 0,
  hazardDangerLevel: undefined,
  hazardDistance: undefined,
  hazardSeverity: undefined,
  trajectoryRiskLevel: undefined,
  trajectoryRiskSeconds: undefined,
  runTrail: [],
  replayFrameCount: 0,
  replayChecksum: undefined
};

const useGameStore = create<GameStore>((set) => ({
  hud: initialHud,
  setHud: (hud) => set({ hud })
}));

export function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<GameShell | null>(null);
  const recordedRunRef = useRef<string | null>(null);
  const audioRef = useRef<GameAudioController | null>(null);
  const hapticsRef = useRef<GameHapticsController | null>(null);
  const previousAudioSnapshotRef = useRef<HudAudioSnapshot | undefined>(undefined);
  const previousRunFeedSnapshotRef = useRef<RunFeedSnapshot | undefined>(undefined);
  const nextRunFeedIdRef = useRef(1);
  const screenFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hud = useGameStore((state) => state.hud);
  const setHud = useGameStore((state) => state.setHud);
  const [paused, setPaused] = useState(true);
  const [preflightOpen, setPreflightOpen] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [screenFeedback, setScreenFeedback] = useState<ActiveScreenFeedback | undefined>(undefined);
  const [runFeed, setRunFeed] = useState<RunFeedEntry[]>([]);
  const [bestRun, setBestRun] = useState<BestRun | undefined>(() => {
    const storage = getBestRunStorage();
    return storage ? getBestRun(storage, initialHud.contractId) : undefined;
  });
  const [bestRunsByContract, setBestRunsByContract] = useState<Record<string, BestRun | undefined>>({});
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
    const audio = createGameAudioController();
    audioRef.current = audio;

    return () => {
      audio.destroy();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const haptics = createGameHapticsController();
    hapticsRef.current = haptics;

    return () => {
      hapticsRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(audioMuted);
  }, [audioMuted]);

  useEffect(() => {
    shellRef.current?.setGhostTrail(bestRun?.ghostTrail ?? []);
  }, [bestRun?.ghostTrail]);

  useEffect(() => {
    return () => {
      if (screenFeedbackTimerRef.current) {
        clearTimeout(screenFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const storage = getBestRunStorage();
    setBestRun(storage ? getBestRun(storage, hud.contractId) : undefined);
    setNewBest(false);
    recordedRunRef.current = null;
    previousRunFeedSnapshotRef.current = undefined;
    nextRunFeedIdRef.current = 1;
    setRunFeed([]);
  }, [hud.contractId]);

  useEffect(() => {
    const storage = getBestRunStorage();
    if (!storage) {
      setBestRunsByContract({});
      return;
    }

    const nextBestRuns: Record<string, BestRun | undefined> = {};
    for (const contract of hud.contractOptions) {
      nextBestRuns[contract.id] = getBestRun(storage, contract.id);
    }
    setBestRunsByContract(nextBestRuns);
  }, [hud.contractOptions]);

  useEffect(() => {
    const currentSnapshot = toHudAudioSnapshot(hud);
    const events = deriveHudAudioEvents(previousAudioSnapshotRef.current, currentSnapshot);
    previousAudioSnapshotRef.current = currentSnapshot;
    audioRef.current?.play(events);
    hapticsRef.current?.play(events);
    const feedback = buildScreenFeedback(events);
    if (feedback) {
      if (screenFeedbackTimerRef.current) {
        clearTimeout(screenFeedbackTimerRef.current);
      }
      setScreenFeedback((current) => ({
        key: (current?.key ?? 0) + 1,
        feedback
      }));
      screenFeedbackTimerRef.current = setTimeout(() => {
        setScreenFeedback(undefined);
        screenFeedbackTimerRef.current = undefined;
      }, feedback.durationMs);
    }
  }, [hud.fuel, hud.hazardDangerLevel, hud.lastMilestone, hud.maxFuel, hud.status]);

  useEffect(() => {
    const currentSnapshot = toRunFeedSnapshot(hud);
    const updates = deriveRunFeedUpdates(previousRunFeedSnapshotRef.current, currentSnapshot);
    previousRunFeedSnapshotRef.current = currentSnapshot;
    if (updates.length === 0) {
      return;
    }

    setRunFeed((currentEntries) => {
      const result = appendRunFeedUpdates(currentEntries, updates, nextRunFeedIdRef.current, 4);
      nextRunFeedIdRef.current = result.nextId;
      return result.entries;
    });
  }, [hud.fuel, hud.hazardDangerLevel, hud.lastMilestone, hud.lastStyleAward, hud.maxFuel, hud.status]);

  useEffect(() => {
    if (hud.status !== "delivered") {
      if (hud.status === "flying" || hud.status === "paused") {
        recordedRunRef.current = null;
        setNewBest(false);
      }
      return;
    }

    const runFingerprint = `${hud.contractId}:${hud.score}:${hud.elapsedSeconds}:${hud.medal}`;
    if (recordedRunRef.current === runFingerprint) {
      return;
    }

    recordedRunRef.current = runFingerprint;
    const storage = getBestRunStorage();
    if (!storage) {
      return;
    }
    const result = recordBestRun(storage, hud.contractId, {
      score: hud.score,
      elapsedSeconds: hud.elapsedSeconds,
      medal: hud.medal,
      ghostTrail: hud.runTrail
    });
    setBestRun(result.best);
    setBestRunsByContract((current) => ({
      ...current,
      [hud.contractId]: result.best
    }));
    setNewBest(result.isNewBest);
  }, [hud.contractId, hud.elapsedSeconds, hud.medal, hud.score, hud.status]);

  const fuelRatio = hud.maxFuel > 0 ? hud.fuel / hud.maxFuel : 0;
  const cargoIntegrity = Math.max(0, 1 - hud.cargoDamage);
  const runFinished = hud.status === "delivered" || hud.status === "crashed";
  const overlays = getOverlayVisibility({ status: hud.status, preflightOpen });
  const touchFlightPad = buildTouchFlightPadPresentation({ status: hud.status, preflightOpen });
  const runIntensity = buildRunIntensity({
    status: hud.status,
    preflightOpen,
    fuelRatio,
    objectivePhase: hud.objectivePhase,
    paceTier: hud.paceTier,
    paceSecondsRemaining: hud.paceSecondsRemaining,
    cargoDamage: hud.cargoDamage,
    hazardDangerLevel: hud.hazardDangerLevel,
    trajectoryRiskLevel: hud.trajectoryRiskLevel,
    styleMultiplier: hud.styleMultiplier,
    styleChainSecondsRemaining: hud.styleChainSecondsRemaining
  });
  const pickupRushActive = hud.objectivePhase === "pickup" && hud.quickPickupSecondsRemaining > 0 && !runFinished;
  const radioMessage = buildRadioMessage(hud);
  const targetDistanceLabel = hud.targetDistance === undefined ? "-" : `${Math.round(hud.targetDistance)}m`;
  const bearingGuidance = hud.targetRelativeBearing === undefined ? undefined : formatBearingGuidance(hud.targetRelativeBearing);
  const dockingSpeedReadout = buildDockingSpeedReadout({
    speed: hud.speed,
    allowedSpeed: hud.targetAllowedSpeed,
    targetDistance: hud.targetDistance
  });
  const approachRewardReadout = buildApproachRewardReadout({ approachStreakSeconds: hud.approachStreakSeconds });
  const primaryActionLabel = preflightOpen ? "Launch" : paused ? "Resume" : "Pause";
  const canBoost = canUseImpulseControl({
    action: "boost",
    fuel: hud.fuel,
    boostCooldownSeconds: hud.boostCooldownSeconds,
    paused,
    preflightOpen,
    status: hud.status
  });
  const canBrake = canUseImpulseControl({ action: "brake", fuel: hud.fuel, paused, preflightOpen, status: hud.status });
  const boostPresentation = buildBoostControlPresentation({
    canBoost,
    boostCooldownSeconds: hud.boostCooldownSeconds,
    launchBurstSecondsRemaining: hud.launchBurstSecondsRemaining
  });
  const boostButtonStyle = { "--boost-cooldown": boostPresentation.cooldownProgress } as CSSProperties;
  const objectiveDirective = buildObjectiveDirective(hud);
  const expressFinishReadout = buildExpressFinishReadout({
    objectivePhase: hud.objectivePhase,
    paceTier: hud.paceTier,
    paceSecondsRemaining: hud.paceSecondsRemaining,
    cargoDamage: hud.cargoDamage
  });
  const objectiveInterceptReadout = buildObjectiveInterceptReadout({
    status: hud.status,
    targetDistance: hud.targetDistance,
    speed: hud.speed,
    landingStatus: hud.landingStatus
  });
  const tacticalCue = buildTacticalCue({
    status: hud.status,
    objectivePhase: hud.objectivePhase,
    hazardDangerLevel: hud.hazardDangerLevel,
    trajectoryRiskLevel: hud.trajectoryRiskLevel,
    trajectoryRiskSeconds: hud.trajectoryRiskSeconds,
    landingStatus: hud.landingStatus,
    paceTier: hud.paceTier,
    paceSecondsRemaining: hud.paceSecondsRemaining,
    cargoDamage: hud.cargoDamage,
    fuelUsed: hud.fuelUsed,
    fuel: hud.fuel,
    maxFuel: hud.maxFuel,
    quickPickupSecondsRemaining: hud.quickPickupSecondsRemaining,
    quickPickupBonus: hud.quickPickupBonus,
    styleMultiplier: hud.styleMultiplier,
    styleChainSecondsRemaining: hud.styleChainSecondsRemaining,
    gravitySlingReady: hud.gravitySlingReady,
    gravitySlingStyleBonus: hud.gravitySlingStyleBonus,
    approachStreakSeconds: hud.approachStreakSeconds
  });
  const liveBestPace = buildLiveBestPace({
    bestRun,
    score: hud.score,
    elapsedSeconds: hud.elapsedSeconds,
    status: hud.status
  });
  const replayCaptureReadout = buildReplayCaptureReadout({
    status: hud.status,
    replayFrameCount: hud.replayFrameCount
  });
  const audioTogglePresentation = buildAudioTogglePresentation(audioMuted);
  const cometRunReadout = buildCometRunReadout({
    status: hud.status,
    preflightOpen,
    paceTier: hud.paceTier,
    fuel: hud.fuel,
    maxFuel: hud.maxFuel,
    cargoDamage: hud.cargoDamage
  });
  const liveStyleReward = buildLiveStyleReward({
    contractId: hud.contractId,
    styleBonus: hud.scoreBreakdown.styleBonus,
    lastStyleAward: hud.lastStyleAward,
    lastMilestone: hud.lastMilestone,
    styleMultiplier: hud.styleMultiplier,
    styleChainSecondsRemaining: hud.styleChainSecondsRemaining,
    quickPickupSecondsRemaining: hud.quickPickupSecondsRemaining,
    cargoDamage: hud.cargoDamage,
    hazardDangerLevel: hud.hazardDangerLevel,
    gravitySlingReady: hud.gravitySlingReady
  });
  const styleChipStyle = { "--style-chain-progress": liveStyleReward?.chainProgress ?? 0 } as CSSProperties;
  const preflightMasteryTargets = buildPreflightMasteryTargets({ goldSeconds: hud.paceSecondsRemaining });
  const preflightBonusObjectives = buildPreflightBonusObjectives({
    contractId: hud.contractId,
    quickPickupBonus: hud.quickPickupBonus,
    hazardSeverityMultiplier: hud.hazardSeverityMultiplier
  });
  const cargoManifest = buildCargoManifest({ cargoName: hud.cargoName, cargoOnboard: hud.cargoOnboard });
  const resultStats = buildResultStats({ score: hud.score, elapsedSeconds: hud.elapsedSeconds, cargoIntegrity });
  const resultHighlight = buildResultHighlight(hud.scoreBreakdown, hud.lastMilestone);
  const replayReceipt = buildReplayReceipt(hud.replayChecksum);
  const bestRunChase = buildBestRunChase(bestRun);
  const routeBoardProgress = buildRouteBoardProgress(hud.contractOptions, bestRunsByContract);
  const routeBoardTarget = buildRouteBoardTarget(hud.contractOptions, bestRunsByContract);
  const routeTargetSelectionAction = buildRouteBoardSelectionAction(routeBoardTarget, hud.contractId);
  const dailyDispatch = buildDailyDispatch({ contracts: hud.contractOptions, now: new Date() });
  const dailyDispatchAction = buildDailyDispatchAction(dailyDispatch, hud.contractId);
  const dailyDispatchStatus = buildDailyDispatchStatus(
    dailyDispatch,
    dailyDispatch ? bestRunsByContract[dailyDispatch.contractId] : undefined
  );
  const bestRunDelta = buildBestRunDelta({
    bestRun,
    run: { score: hud.score, elapsedSeconds: hud.elapsedSeconds, medal: hud.medal },
    isNewBest: newBest
  });
  const resultCoach = buildResultCoach({
    status: hud.status,
    objectivePhase: hud.objectivePhase,
    contractId: hud.contractId,
    lastMilestone: hud.lastMilestone,
    crashReason: hud.crashReason,
    medal: hud.medal,
    grade: hud.grade,
    cargoDamage: hud.cargoDamage,
    fuel: hud.fuel,
    maxFuel: hud.maxFuel,
    targetDistance: hud.targetDistance,
    scoreBreakdown: hud.scoreBreakdown
  });
  const resultBoardPrompt =
    hud.status === "delivered" || hud.status === "crashed"
      ? buildResultBoardPrompt({ status: hud.status, routeBoardTarget })
      : undefined;
  const resultBoardAction =
    hud.status === "delivered" || hud.status === "crashed"
      ? buildResultBoardAction({ status: hud.status, currentContractId: hud.contractId, routeBoardTarget })
      : undefined;
  const retryTarget = buildRetryTarget({
    status: hud.status,
    contractId: hud.contractId,
    crashReason: hud.crashReason,
    lastMilestone: hud.lastMilestone,
    medal: hud.medal,
    elapsedSeconds: hud.elapsedSeconds,
    goldSeconds: hud.paceSecondsRemaining,
    targetAllowedSpeed: hud.targetAllowedSpeed,
    score: hud.score,
    isNewBest: newBest,
    bestRun
  });
  const resultRetryAction = buildResultRetryAction(retryTarget);
  const hazardLoadTrait = buildContractHazardTrait({ hazardSeverityMultiplier: hud.hazardSeverityMultiplier });
  const dangerPayTrait = buildContractDangerPayTrait({ hazardSeverityMultiplier: hud.hazardSeverityMultiplier });
  const dangerPayAmount = dangerPayTrait?.replace("Danger pay ", "");
  const routePlan = buildContractRoutePlan({
    contractId: hud.contractId,
    cargoKind: hud.cargoKind,
    cargoFragility: hud.cargoFragility,
    hazardSeverityMultiplier: hud.hazardSeverityMultiplier,
    goldSeconds: hud.paceSecondsRemaining
  });
  const preflightKicker = buildContractPreflightKicker({
    contractId: hud.contractId,
    hazardSeverityMultiplier: hud.hazardSeverityMultiplier,
    goldSeconds: hud.paceSecondsRemaining
  });
  const cargoRiskReadout = buildCargoRiskReadout({
    cargoKind: hud.cargoKind,
    cargoFragility: hud.cargoFragility,
    cargoDamage: hud.cargoDamage,
    cargoOnboard: hud.cargoOnboard,
    hazardDangerLevel: hud.hazardDangerLevel
  });
  const hazardPressureReadout = buildHazardPressureReadout({
    hazardDangerLevel: hud.hazardDangerLevel,
    hazardDistance: hud.hazardDistance,
    hazardSeverity: hud.hazardSeverity,
    styleMultiplier: hud.styleMultiplier,
    speed: hud.speed,
    trajectoryRiskLevel: hud.trajectoryRiskLevel,
    trajectoryRiskSeconds: hud.trajectoryRiskSeconds,
    gravitySlingDistance: hud.gravitySlingDistance,
    gravitySlingReady: hud.gravitySlingReady,
    gravitySlingSpeedThreshold: hud.gravitySlingSpeedThreshold,
    gravitySlingStyleBonus: hud.gravitySlingStyleBonus,
    cargoDamage: hud.cargoDamage
  });

  const launchContract = () => {
    audioRef.current?.unlock();
    setPreflightOpen(false);
    setPaused(false);
    shellRef.current?.setPaused(false);
  };

  const openContractBriefing = (contractId = hud.contractId) => {
    audioRef.current?.unlock();
    setPreflightOpen(true);
    setPaused(true);
    shellRef.current?.restart(true);
    if (contractId !== hud.contractId) {
      shellRef.current?.selectContract(contractId);
    }
  };

  const restartToBriefing = () => {
    openContractBriefing();
  };

  const openResultBoardTarget = () => {
    audioRef.current?.unlock();
    if (!resultBoardAction) {
      return;
    }
    openContractBriefing(resultBoardAction.targetContractId);
  };

  const selectRouteBoardTarget = () => {
    audioRef.current?.unlock();
    if (!routeTargetSelectionAction) {
      return;
    }
    shellRef.current?.selectContract(routeTargetSelectionAction.contractId);
  };

  const selectDailyDispatch = () => {
    audioRef.current?.unlock();
    if (!dailyDispatchAction) {
      return;
    }
    shellRef.current?.selectContract(dailyDispatchAction.contractId);
  };

  const toggleAudioMuted = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    audioRef.current?.setMuted(nextMuted);
    if (!nextMuted) {
      audioRef.current?.unlock();
    }
  };

  return (
    <main className={`app-shell app-intensity-${runIntensity}`}>
      <div ref={canvasMountRef} className="game-canvas" aria-label="Astro Courier gameplay canvas" />
      {screenFeedback ? (
        <div
          key={screenFeedback.key}
          className={`screen-feedback screen-feedback-${screenFeedback.feedback.tone} screen-feedback-${screenFeedback.feedback.intensity}`}
          style={{ "--screen-feedback-duration": `${screenFeedback.feedback.durationMs}ms` } as CSSProperties}
          aria-hidden="true"
        />
      ) : null}
      {touchFlightPad.visible ? (
        <div className={`touch-flight-pad touch-flight-pad-${touchFlightPad.tone}`} aria-hidden="true">
          <span className="touch-flight-pad-ring" />
          <span className="touch-flight-pad-stick" />
          <span className="touch-flight-pad-vector" />
        </div>
      ) : null}

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
            className={`icon-button audio-toggle-button ${audioMuted ? "audio-toggle-muted" : ""}`}
            aria-label={audioTogglePresentation.label}
            aria-pressed={audioMuted}
            title={audioTogglePresentation.title}
            onClick={toggleAudioMuted}
          >
            {audioTogglePresentation.icon === "muted" ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            type="button"
            className={`icon-button boost-button boost-button-${boostPresentation.tone}`}
            aria-label={boostPresentation.label}
            title={boostPresentation.label}
            style={boostButtonStyle}
            data-boost-badge={boostPresentation.badge}
            disabled={!canBoost}
            onClick={() => {
              audioRef.current?.unlock();
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
              audioRef.current?.unlock();
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
              audioRef.current?.unlock();
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

      {liveStyleReward?.fresh && hud.lastStyleAward && !runFinished ? (
        <div className="style-burst" aria-label={`Style hit: +${Math.round(hud.lastStyleAward)}`}>
          <span>{hud.lastMilestone ?? "Style hit"}</span>
          <strong>+{Math.round(hud.lastStyleAward)}</strong>
        </div>
      ) : null}

      <aside className="run-panel" aria-label="Delivery status">
        <div className="radio-message">{radioMessage}</div>
        {runFeed.length > 0 && !preflightOpen ? (
          <div className="action-feed" aria-label="Recent run events">
            {runFeed.map((entry) => (
              <div key={entry.id} className={`action-feed-entry action-feed-${entry.tone}`}>
                <Activity size={15} />
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
        {tacticalCue ? (
          <div className={`tactical-cue tactical-cue-${tacticalCue.tone}`} aria-label={`${tacticalCue.label}: ${tacticalCue.value}`}>
            <Target size={16} />
            <span>{tacticalCue.label}</span>
            <strong>{tacticalCue.value}</strong>
          </div>
        ) : null}
        <div className="status-row">
          <span>Status</span>
          <strong>{statusLabel(hud.status)}</strong>
        </div>
        <div className="status-row">
          <span>{objectiveDirective.label}</span>
          <strong>{objectiveDirective.value}</strong>
        </div>
        <div className="status-row">
          <span>Target</span>
          <strong>{targetDistanceLabel}</strong>
        </div>
        {objectiveInterceptReadout ? (
          <div
            className={`intercept-chip intercept-${objectiveInterceptReadout.tone}`}
            aria-label={`${objectiveInterceptReadout.label}: ${objectiveInterceptReadout.value}`}
          >
            <TimerReset size={16} />
            <span>{objectiveInterceptReadout.label}</span>
            <strong>{objectiveInterceptReadout.value}</strong>
          </div>
        ) : null}
        {expressFinishReadout ? (
          <div
            className={`finish-window-chip finish-window-${expressFinishReadout.tone}`}
            aria-label={`${expressFinishReadout.label}: ${expressFinishReadout.value}`}
          >
            <TimerReset size={16} />
            <span>{expressFinishReadout.label}</span>
            <strong>{expressFinishReadout.value}</strong>
          </div>
        ) : null}
        {bearingGuidance ? (
          <div className={`bearing-chip bearing-${bearingGuidance.tone}`}>
            <span>{bearingGuidance.label}</span>
            <strong>{bearingGuidance.value}</strong>
          </div>
        ) : null}
        {dockingSpeedReadout ? (
          <div className={`dock-speed-chip dock-speed-${dockingSpeedReadout.tone}`}>
            <span>{dockingSpeedReadout.label}</span>
            <strong>{dockingSpeedReadout.value}</strong>
          </div>
        ) : null}
        <div className={`pace-chip pace-${hud.paceTier}`}>
          <span>{paceLabel(hud.paceTier)}</span>
          <strong>{hud.paceTier === "overtime" ? "Expired" : `${hud.paceSecondsRemaining.toFixed(1)}s`}</strong>
        </div>
        {cometRunReadout ? (
          <div className={`comet-chip comet-${cometRunReadout.tone}`} aria-label={`${cometRunReadout.label}: ${cometRunReadout.value}`}>
            <Star size={16} />
            <span>{cometRunReadout.label}</span>
            <strong>{cometRunReadout.value}</strong>
          </div>
        ) : null}
        {liveBestPace ? (
          <div className={`best-pace-chip best-pace-${liveBestPace.tone}`} aria-label={`${liveBestPace.label}: ${liveBestPace.value}`}>
            <span>{liveBestPace.label}</span>
            <strong>{liveBestPace.value}</strong>
          </div>
        ) : null}
        {replayCaptureReadout ? (
          <div
            className={`replay-capture-chip replay-capture-${replayCaptureReadout.tone}`}
            aria-label={`${replayCaptureReadout.label}: ${replayCaptureReadout.value}`}
          >
            <Satellite size={16} />
            <span>{replayCaptureReadout.label}</span>
            <strong>{replayCaptureReadout.value}</strong>
          </div>
        ) : null}
        {pickupRushActive ? (
          <div className="rush-chip">
            <span>Pickup rush</span>
            <strong>
              +{hud.quickPickupBonus} / {hud.quickPickupSecondsRemaining.toFixed(1)}s
            </strong>
          </div>
        ) : null}
        {liveStyleReward ? (
          <div
            className={`style-chip style-chip-${liveStyleReward.tone} ${liveStyleReward.fresh ? "style-chip-hot" : ""} ${
              liveStyleReward.chainProgress > 0 ? "style-chip-chain-active" : ""
            }`}
            style={styleChipStyle}
            aria-label={liveStyleReward.label}
          >
            <span>{liveStyleReward.label}</span>
            <strong>{liveStyleReward.value}</strong>
          </div>
        ) : null}
        {hazardPressureReadout ? (
          <div
            className={`risk-pulse-chip risk-pulse-${hazardPressureReadout.tone}`}
            aria-label={`${hazardPressureReadout.label}: ${hazardPressureReadout.value}`}
          >
            <ShieldAlert size={16} />
            <span>{hazardPressureReadout.label}</span>
            <strong>{hazardPressureReadout.value}</strong>
          </div>
        ) : null}
        <div className={`cargo-risk-chip cargo-risk-${cargoRiskReadout.tone}`} aria-label={`${cargoRiskReadout.label}: ${cargoRiskReadout.value}`}>
          <span>{cargoRiskReadout.label}</span>
          <strong>{cargoRiskReadout.value}</strong>
        </div>
        {hud.landingStatus ? (
          <div className={`guidance-chip guidance-${hud.assistAvailable ? "assist" : hud.landingStatus}`}>
            {guidanceLabel(hud.landingStatus, Boolean(hud.assistAvailable))}
          </div>
        ) : null}
        {approachRewardReadout ? (
          <div
            className={`streak-chip streak-${approachRewardReadout.tone}`}
            aria-label={`${approachRewardReadout.label}: ${approachRewardReadout.value}`}
          >
            <span>{approachRewardReadout.label}</span>
            <strong>{approachRewardReadout.value}</strong>
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

      {overlays.preflight ? (
        <section className="preflight-overlay" aria-label="Launch briefing">
          <div className="preflight-kicker">{preflightKicker}</div>
          <h2>{hud.contractTitle}</h2>
          <p>{hud.contractBriefing}</p>
          <div className="cargo-manifest" aria-label="Cargo manifest">
            <PackageCheck size={18} />
            <span>{cargoManifest.label}</span>
            <strong>{cargoManifest.value}</strong>
          </div>
          <div className={`route-plan-briefing route-plan-${routePlan.tone}`} aria-label={`${routePlan.label}: ${routePlan.value}`}>
            <Route size={18} />
            <span>{routePlan.label}</span>
            <strong>{routePlan.value}</strong>
          </div>
          <div className={`best-chase-briefing best-chase-${bestRunChase.tone}`} aria-label={`${bestRunChase.label}: ${bestRunChase.value}`}>
            <Trophy size={18} />
            <span>{bestRunChase.label}</span>
            <strong>{bestRunChase.value}</strong>
          </div>
          {hud.contractOptions.length > 0 ? (
            <div className="route-board" aria-label="Route board progress">
              {routeBoardProgress.map((item) => (
                <span key={item.label} className={`route-board-item route-board-${item.tone}`}>
                  {item.label === "Comet clears" ? <Star size={17} /> : <Trophy size={17} />}
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </span>
              ))}
            </div>
          ) : null}
          {hud.contractOptions.length > 0 ? (
            routeTargetSelectionAction ? (
              <button
                type="button"
                className={`route-target-briefing route-target-${routeBoardTarget.tone} route-target-action`}
                aria-label={`${routeBoardTarget.label}: ${routeBoardTarget.value}. ${routeTargetSelectionAction.label}`}
                onClick={selectRouteBoardTarget}
              >
                {routeBoardTarget.tone === "complete" ? <Trophy size={18} /> : routeBoardTarget.tone === "comet" ? <Star size={18} /> : <Target size={18} />}
                <span>{routeBoardTarget.label}</span>
                <strong>{routeBoardTarget.value}</strong>
              </button>
            ) : (
              <div className={`route-target-briefing route-target-${routeBoardTarget.tone}`} aria-label={`${routeBoardTarget.label}: ${routeBoardTarget.value}`}>
                {routeBoardTarget.tone === "complete" ? <Trophy size={18} /> : routeBoardTarget.tone === "comet" ? <Star size={18} /> : <Target size={18} />}
                <span>{routeBoardTarget.label}</span>
                <strong>{routeBoardTarget.value}</strong>
              </div>
            )
          ) : null}
          {dailyDispatch ? (
            dailyDispatchAction ? (
              <button
                type="button"
                className={`daily-dispatch-briefing daily-dispatch-${dailyDispatchStatus?.tone ?? "open"} daily-dispatch-action`}
                aria-label={`${dailyDispatch.label}: ${dailyDispatch.value}. ${dailyDispatchAction.label}`}
                onClick={selectDailyDispatch}
              >
                <CalendarDays size={18} />
                <span>{dailyDispatch.label}</span>
                <strong>{dailyDispatch.value}</strong>
                <small>{dailyDispatchStatus ? `${dailyDispatchStatus.value} / ${dailyDispatch.seed}` : dailyDispatch.seed}</small>
              </button>
            ) : (
              <div
                className={`daily-dispatch-briefing daily-dispatch-${dailyDispatchStatus?.tone ?? "open"}`}
                aria-label={`${dailyDispatch.label}: ${dailyDispatch.value}`}
              >
                <CalendarDays size={18} />
                <span>{dailyDispatch.label}</span>
                <strong>{dailyDispatch.value}</strong>
                <small>{dailyDispatchStatus ? `${dailyDispatchStatus.value} / ${dailyDispatch.seed}` : dailyDispatch.seed}</small>
              </div>
            )
          ) : null}
          <div className={`cargo-risk-briefing cargo-risk-${cargoRiskReadout.tone}`} aria-label={`${cargoRiskReadout.label}: ${cargoRiskReadout.value}`}>
            <ShieldAlert size={18} />
            <span>{cargoRiskReadout.label}</span>
            <strong>{cargoRiskReadout.value}</strong>
          </div>
          {hazardLoadTrait ? (
            <div className="hazard-load-briefing" aria-label={`Hazard load: ${hazardLoadTrait}`}>
              <OctagonMinus size={18} />
              <span>Hazard load</span>
              <strong>{hazardLoadTrait}</strong>
            </div>
          ) : null}
          {dangerPayTrait ? (
            <div className="danger-pay-briefing" aria-label={dangerPayTrait}>
              <Trophy size={18} />
              <span>Danger pay</span>
              <strong>{dangerPayAmount}</strong>
            </div>
          ) : null}
          <div className="contract-traits" aria-label="Contract risk and reward">
            <span>
              <Gauge size={17} />
              <small>Risk</small>
              <strong>{hud.contractRiskLabel}</strong>
            </span>
            <span>
              <Trophy size={17} />
              <small>Reward</small>
              <strong>{hud.contractRewardLabel}</strong>
            </span>
          </div>
          {pickupRushActive ? (
            <div className="rush-briefing">
              <TimerReset size={18} />
              <span>Pickup rush</span>
              <strong>
                +{hud.quickPickupBonus} style before {hud.quickPickupSecondsRemaining.toFixed(0)}s
              </strong>
            </div>
          ) : null}
          <div className="bonus-objectives" aria-label="Bonus objectives">
            {preflightBonusObjectives.map((objective) => (
              <span key={objective.label}>
                {objective.label === "Rush pickup" ? (
                  <TimerReset size={17} />
                ) : objective.label === "Clean skim" || objective.label === "Needle thread" || objective.label === "Danger pay" ? (
                  <ShieldAlert size={17} />
                ) : objective.label === "Chain finish" ? (
                  <Star size={17} />
                ) : objective.label === "Last Drop" ? (
                  <Zap size={17} />
                ) : (
                  <Flag size={17} />
                )}
                <small>{objective.label}</small>
                <strong>{objective.value}</strong>
              </span>
            ))}
          </div>
          {hud.contractOptions.length > 1 ? (
            <div className="contract-selector" aria-label="Contract selection">
              {hud.contractOptions.map((contract) => {
                const contractBestRun = bestRunsByContract[contract.id];
                const contractMasteryBadge = buildContractMasteryBadge(contractBestRun);
                const contractRecommended = routeBoardTarget.contractId === contract.id;
                const contractCargoRisk = buildCargoRiskReadout({
                  cargoKind: contract.cargoKind,
                  cargoFragility: contract.cargoFragility,
                  cargoDamage: 0,
                  cargoOnboard: false
                });
                const contractHazardTrait = buildContractHazardTrait({
                  hazardSeverityMultiplier: contract.hazardSeverityMultiplier
                });
                const contractDangerPayTrait = buildContractDangerPayTrait({
                  hazardSeverityMultiplier: contract.hazardSeverityMultiplier
                });
                const contractRecommendationBadge = contractRecommended ? buildRouteBoardRecommendationBadge(routeBoardTarget) : undefined;
                return (
                  <button
                    key={contract.id}
                    type="button"
                    className={`contract-option ${contract.id === hud.contractId ? "contract-option-active" : ""} ${
                      contractRecommended ? "contract-option-recommended" : ""
                    }`}
                    aria-pressed={contract.id === hud.contractId}
                    onClick={() => {
                      shellRef.current?.selectContract(contract.id);
                    }}
                  >
                    <span>{contract.title}</span>
                    <small>
                      {contract.pickupLabel} -&gt; {contract.destinationLabel}
                    </small>
                    <div className="contract-option-traits">
                      <em>{contract.riskLabel}</em>
                      <em>{contract.rewardLabel}</em>
                      <em className={`contract-option-mastery contract-option-mastery-${contractMasteryBadge.tone}`}>
                        {contractMasteryBadge.value}
                      </em>
                      {contractRecommendationBadge ? (
                        <em className={`contract-option-next contract-option-next-${routeBoardTarget.tone}`}>{contractRecommendationBadge}</em>
                      ) : null}
                      <em className="contract-option-best">{buildContractBestRunLabel(contractBestRun)}</em>
                      <em className={`contract-option-cargo contract-option-cargo-${contractCargoRisk.tone}`}>
                        {buildContractCargoTrait(contract)}
                      </em>
                      {contractHazardTrait ? <em className="contract-option-hazard">{contractHazardTrait}</em> : null}
                      {contractDangerPayTrait ? <em className="contract-option-danger-pay">{contractDangerPayTrait}</em> : null}
                    </div>
                    <strong>Gold {contract.medalTimes.gold}s</strong>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="preflight-stats" aria-label="Contract briefing">
            <span>
              <MapPin size={18} />
              <small>Pickup</small>
              <strong>{hud.pickupLabel}</strong>
            </span>
            <span>
              <Flag size={18} />
              <small>Destination</small>
              <strong>{hud.destinationLabel}</strong>
            </span>
            {preflightMasteryTargets.map((target) => (
              <span key={target.label}>
                {target.label === "Comet" ? <Star size={18} /> : <Trophy size={18} />}
                <small>{target.label}</small>
                <strong>{target.value}</strong>
              </span>
            ))}
          </div>
          <button type="button" className="preflight-button" onClick={launchContract}>
            <Play size={18} />
            Launch Contract
          </button>
        </section>
      ) : null}

      {overlays.result ? (
        <section className={`result-overlay result-${hud.status}`} aria-label="Run result">
          <Trophy aria-hidden="true" size={28} />
          <h2>{hud.status === "delivered" ? "Delivery Complete" : "Delivery Failed"}</h2>
          <p>{hud.status === "crashed" ? buildCrashReasonLabel(hud) : hud.landingRating ?? statusLabel(hud.status)}</p>
          <div className={`grade-badge grade-${hud.grade.toLowerCase()}`} aria-label={`Run grade ${hud.grade}`}>
            <span>Rank</span>
            <strong>{hud.grade}</strong>
          </div>
          {hud.medal !== "none" ? <div className={`medal-banner medal-${hud.medal}`}>{medalLabel(hud.medal)}</div> : null}
          {hud.status === "delivered" && bestRun ? (
            <div className={`best-run ${newBest ? "best-run-new" : ""}`}>
              <span>{newBest ? "New best" : "Personal best"}</span>
              <strong>
                {bestRun.score} / {bestRun.elapsedSeconds.toFixed(1)}s
              </strong>
            </div>
          ) : null}
          {hud.status === "delivered" && bestRunDelta ? (
            <div className={`best-delta best-delta-${bestRunDelta.tone}`} aria-label={`${bestRunDelta.label}: ${bestRunDelta.value}`}>
              <span>{bestRunDelta.label}</span>
              <strong>{bestRunDelta.value}</strong>
            </div>
          ) : null}
          <div className="result-stats">
            {resultStats.map((stat) => (
              <span key={stat.label}>
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
              </span>
            ))}
          </div>
          <div className="score-breakdown" aria-label="Score breakdown">
            {scoreBreakdownRows(hud).map((row) => (
              <div key={row.label} className={row.tone === "penalty" ? "score-row score-row-penalty" : "score-row"}>
                <span>{row.label}</span>
                <strong>{formatScoreValue(row.value, row.tone)}</strong>
              </div>
            ))}
          </div>
          {replayReceipt ? (
            <div className={`replay-receipt replay-receipt-${replayReceipt.tone}`} aria-label={`${replayReceipt.label}: ${replayReceipt.value}`}>
              <Satellite size={18} />
              <span>{replayReceipt.label}</span>
              <strong>{replayReceipt.value}</strong>
            </div>
          ) : null}
          {resultHighlight ? (
            <div
              className={`result-highlight result-highlight-${resultHighlight.tone}`}
              aria-label={`${resultHighlight.label}: ${resultHighlight.value}`}
            >
              <Star size={18} />
              <span>{resultHighlight.label}</span>
              <strong>{resultHighlight.value}</strong>
            </div>
          ) : null}
          <div className={`result-coach result-coach-${resultCoach.tone}`} aria-label={`${resultCoach.label}: ${resultCoach.value}`}>
            <Flag size={18} />
            <span>{resultCoach.label}</span>
            <strong>{resultCoach.value}</strong>
          </div>
          <div className={`retry-target retry-target-${retryTarget.tone}`} aria-label={`${retryTarget.label}: ${retryTarget.value}`}>
            <Target size={18} />
            <span>{retryTarget.label}</span>
            <strong>{retryTarget.value}</strong>
          </div>
          {resultBoardPrompt ? (
            <div className={`result-board-target result-board-target-${resultBoardPrompt.tone}`} aria-label={`${resultBoardPrompt.label}: ${resultBoardPrompt.value}`}>
              {resultBoardPrompt.tone === "retry" ? (
                <RotateCcw size={18} />
              ) : resultBoardPrompt.tone === "complete" ? (
                <Trophy size={18} />
              ) : resultBoardPrompt.tone === "comet" ? (
                <Star size={18} />
              ) : (
                <Target size={18} />
              )}
              <span>{resultBoardPrompt.label}</span>
              <strong>{resultBoardPrompt.value}</strong>
            </div>
          ) : null}
          <div className="result-actions">
            <button type="button" className="result-button" onClick={restartToBriefing}>
              <RotateCcw size={18} />
              {resultRetryAction.label}
            </button>
            {hud.status === "delivered" && resultBoardAction ? (
              <button
                type="button"
                className={`result-button result-button-primary result-button-board result-button-board-${resultBoardAction.tone}`}
                onClick={openResultBoardTarget}
              >
                <ArrowRight size={18} />
                {resultBoardAction.label}
              </button>
            ) : null}
          </div>
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

function toHudAudioSnapshot(hud: HudState): HudAudioSnapshot {
  return {
    status: hud.status,
    lastMilestone: hud.lastMilestone,
    fuel: hud.fuel,
    maxFuel: hud.maxFuel,
    hazardDangerLevel: hud.hazardDangerLevel
  };
}

function toRunFeedSnapshot(hud: HudState): RunFeedSnapshot {
  return {
    status: hud.status,
    lastMilestone: hud.lastMilestone,
    lastStyleAward: hud.lastStyleAward,
    fuel: hud.fuel,
    maxFuel: hud.maxFuel,
    hazardDangerLevel: hud.hazardDangerLevel
  };
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
    { label: "Danger", value: breakdown.dangerBonus, tone: "bonus" },
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
