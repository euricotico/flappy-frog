import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  Crown,
  Infinity as InfinityIcon,
  Lock,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { OfflineIndicator, PWAInstallControl } from './components/PWAInstallControl';
import { soundEngine } from './game/audio';
import {
  createWorld,
  resizeWorld,
  startStageReady,
  triggerJump,
  updateWorld,
} from './game/engine';
import {
  CampaignProgress,
  getLevelConfig,
  LEVELS,
  loadProgress,
  TOTAL_LEVELS,
} from './game/levels';
import { renderWorld } from './game/renderer';
import {
  GameMode,
  GameState,
  GameWorld,
  getMedalForScore,
  RESTART_COOLDOWN_MS,
  WORLD_HEIGHT,
} from './game/types';

function MedalBadge({ score }: { score: number }) {
  const medal = getMedalForScore(score);
  if (medal.tier === 'none') return null;

  return (
    <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-emerald-950">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${medal.primaryColor}, ${medal.secondaryColor})`,
          borderColor: medal.rimColor,
        }}
        aria-hidden="true"
      >
        <Award className="h-5 w-5 text-amber-950" />
      </span>
      <span>{medal.label}</span>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<GameWorld | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN');
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => loadProgress().unlockedLevel);
  const [progress, setProgress] = useState<CampaignProgress>(() => loadProgress());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => loadProgress().endlessBestScore);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.isMuted());

  const activeLevel = getLevelConfig(currentLevelId);

  const syncFromWorld = useCallback((world: GameWorld) => {
    setGameState(world.state);
    setGameMode(world.mode);
    setCurrentLevelId(world.levelId);
    setScore(world.score);
    setBestScore(world.bestScore);
    setIsNewRecord(world.isNewRecord);
    setProgress(loadProgress());
  }, []);

  const handleStartCampaignLevel = useCallback(
    (levelId: number) => {
      const world = worldRef.current;
      if (!world) return;
      startStageReady(world, 'CAMPAIGN', levelId);
      syncFromWorld(world);
    },
    [syncFromWorld]
  );

  const handleStartEndless = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    startStageReady(world, 'ENDLESS', 1);
    syncFromWorld(world);
  }, [syncFromWorld]);

  const handleOpenStageSelect = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    world.state = 'STAGE_SELECT';
    setProgress(loadProgress());
    setGameState('STAGE_SELECT');
  }, []);

  const handleBackToTitle = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    const latest = loadProgress();
    world.state = 'TITLE_MENU';
    world.mode = 'CAMPAIGN';
    world.levelId = latest.unlockedLevel;
    world.pipes = [];
    world.finishGateX = null;
    world.frog.isDead = false;
    syncFromWorld(world);
  }, [syncFromWorld]);

  const handleFlapAction = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;

    if (world.state === 'READY' || world.state === 'PLAYING') {
      const wasReady = world.state === 'READY';
      triggerJump(world);
      if (wasReady) {
        setGameState('PLAYING');
      }
    }
  }, []);

  const handleTogglePause = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;

    if (world.state === 'PLAYING') {
      world.state = 'PAUSED';
      setGameState('PAUSED');
    } else if (world.state === 'PAUSED') {
      world.state = 'PLAYING';
      setGameState('PLAYING');
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleRetryCurrent = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    if (
      (world.state === 'GAME_OVER' || world.state === 'STAGE_CLEAR') &&
      performance.now() - world.gameOverTimestamp < RESTART_COOLDOWN_MS
    ) {
      return;
    }
    startStageReady(world, world.mode, world.levelId);
    syncFromWorld(world);
  }, [syncFromWorld]);

  const handleNextLevel = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    if (
      world.state === 'STAGE_CLEAR' &&
      performance.now() - world.gameOverTimestamp < RESTART_COOLDOWN_MS
    ) {
      return;
    }
    if (world.levelId < TOTAL_LEVELS) {
      startStageReady(world, 'CAMPAIGN', world.levelId + 1);
      syncFromWorld(world);
    } else {
      handleOpenStageSelect();
    }
  }, [handleOpenStageSelect, syncFromWorld]);

  // Canvas resize & 60fps loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const logicalWidth = Math.max(360, (cssW / Math.max(1, cssH)) * WORLD_HEIGHT);
      if (!worldRef.current) {
        worldRef.current = createWorld(logicalWidth);
        syncFromWorld(worldRef.current);
      } else {
        resizeWorld(worldRef.current, logicalWidth);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const world = worldRef.current;
      if (world) {
        updateWorld(
          world,
          dt,
          (newScore, newBest) => {
            setScore(newScore);
            setBestScore(newBest);
          },
          (updatedWorld) => {
            syncFromWorld(updatedWorld);
          }
        );

        renderWorld(ctx, world, canvas.width, canvas.height);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [syncFromWorld]);

  // Auto-pause on tab hide
  useEffect(() => {
    const onVisibility = () => {
      const world = worldRef.current;
      if (document.hidden && world && world.state === 'PLAYING') {
        world.state = 'PAUSED';
        setGameState('PAUSED');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const world = worldRef.current;
      if (!world) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (world.state === 'TITLE_MENU') {
          startStageReady(world, 'CAMPAIGN', loadProgress().unlockedLevel);
          syncFromWorld(world);
          triggerJump(world);
          setGameState('PLAYING');
        } else if (world.state === 'READY' || world.state === 'PLAYING') {
          handleFlapAction();
        } else if (world.state === 'GAME_OVER') {
          handleRetryCurrent();
        } else if (world.state === 'STAGE_CLEAR') {
          handleNextLevel();
        } else if (world.state === 'PAUSED') {
          handleTogglePause();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (world.state === 'PLAYING' || world.state === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        } else if (world.state === 'STAGE_SELECT') {
          e.preventDefault();
          handleBackToTitle();
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleBackToTitle,
    handleFlapAction,
    handleNextLevel,
    handleRetryCurrent,
    handleToggleMute,
    handleTogglePause,
    syncFromWorld,
  ]);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (gameState === 'READY' || gameState === 'PLAYING') {
      e.preventDefault();
      handleFlapAction();
    }
  };

  const progressRatio =
    gameMode === 'CAMPAIGN'
      ? Math.min(1, score / Math.max(1, activeLevel.targetPipes))
      : 0;

  return (
    <main
      className="relative h-dvh w-screen overflow-hidden select-none touch-none bg-[#1B4332]"
      onPointerDown={handleStagePointerDown}
    >
      {/* Full-viewport 60fps Pond World Canvas */}
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-pointer"
        aria-label="Área do jogo Sapinho Voador"
      />

      {/* Minimal Top-Right HUD Controls */}
      <div className="pointer-events-none fixed top-4 right-4 z-20 flex items-center gap-2 sm:top-5 sm:right-6">
        {gameState === 'TITLE_MENU' && <PWAInstallControl variant="compact" />}

        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <button
            type="button"
            onClick={handleTogglePause}
            aria-label={gameState === 'PAUSED' ? 'Continuar jogo' : 'Pausar jogo'}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#143326] bg-[#FEF9C3] text-[#143326] shadow-[0_3px_0_#143326] transition-transform duration-150 hover:bg-[#FEF08A] active:translate-y-0.5 active:shadow-[0_1px_0_#143326] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
          >
            {gameState === 'PAUSED' ? (
              <Play className="h-5 w-5 fill-current" />
            ) : (
              <Pause className="h-5 w-5 fill-current" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#143326] bg-[#FEF9C3] text-[#143326] shadow-[0_3px_0_#143326] transition-transform duration-150 hover:bg-[#FEF08A] active:translate-y-0.5 active:shadow-[0_1px_0_#143326] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Live Score & Stage Progress HUD during Active Play */}
      {(gameState === 'PLAYING' || gameState === 'READY' || gameState === 'PAUSED') && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-10 flex flex-col items-center px-16 sm:top-5">
          {gameMode === 'CAMPAIGN' ? (
            <>
              <div className="font-display score-stroke flex items-baseline gap-1.5 text-5xl font-bold leading-none tracking-tight text-white tabular-nums sm:text-6xl">
                <span>{score}</span>
                <span className="text-2xl text-[#FEF08A] sm:text-3xl">
                  / {activeLevel.targetPipes}
                </span>
              </div>

              <div className="mt-2 w-44 sm:w-52">
                <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-[#143326] bg-[#143326]/40">
                  <div
                    className="h-full bg-[#FACC15] transition-all duration-200"
                    style={{ width: `${Math.round(progressRatio * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs font-bold text-white drop-shadow-[0_1.5px_2px_rgba(20,51,38,0.95)]">
                  Fase {activeLevel.id} · {activeLevel.name}
                </p>
              </div>
            </>
          ) : (
            <>
              <div
                className="font-display score-stroke text-6xl font-bold leading-none tracking-tight text-white tabular-nums sm:text-7xl"
                aria-live="polite"
              >
                {score}
              </div>
              {bestScore > 0 && gameState === 'READY' && (
                <p className="mt-2 text-sm font-bold text-white drop-shadow-[0_1.5px_2px_rgba(20,51,38,0.95)] tabular-nums">
                  Modo Infinito · Recorde {bestScore}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* TITLE MENU OVERLAY */}
      {gameState === 'TITLE_MENU' && (
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center px-5">
          <div className="pointer-events-auto mt-24 flex w-full max-w-md flex-col items-center text-center sm:mt-28">
            <h1 className="font-display title-stroke text-balance text-5xl font-bold tracking-tight text-[#FDE047] sm:text-6xl">
              Sapinho Voador
            </h1>
            <p className="mt-2.5 max-w-xs text-sm font-semibold text-[#143326] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:text-base">
              10 fases com dificuldade crescente. Toque na tela para manter o sapinho amarelo no ar.
            </p>

            <div className="mt-6 flex w-full max-w-xs flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => handleStartCampaignLevel(progress.unlockedLevel)}
                className="font-display inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl border-[3px] border-[#143326] bg-[#FACC15] px-8 py-3 text-xl font-bold text-[#143326] whitespace-nowrap shadow-[0_5px_0_#143326] transition-transform duration-150 hover:bg-[#FDE047] active:translate-y-1 active:shadow-[0_1px_0_#143326] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>
                  {progress.completedLevels.length >= TOTAL_LEVELS
                    ? 'Jogar Fase 10'
                    : `Jogar Fase ${progress.unlockedLevel}`}
                </span>
              </button>

              <div className="grid w-full grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenStageSelect}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#143326] bg-[#FFFDF2] px-4 py-2.5 text-sm font-bold text-[#143326] whitespace-nowrap shadow-[0_3px_0_#143326] transition-transform duration-150 hover:bg-[#FEF9C3] active:translate-y-0.5 active:shadow-[0_1px_0_#143326]"
                >
                  <MapIcon className="h-4 w-4 shrink-0" />
                  <span>10 Fases</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartEndless}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#143326] bg-[#FFFDF2] px-4 py-2.5 text-sm font-bold text-[#143326] whitespace-nowrap shadow-[0_3px_0_#143326] transition-transform duration-150 hover:bg-[#FEF9C3] active:translate-y-0.5 active:shadow-[0_1px_0_#143326]"
                >
                  <InfinityIcon className="h-4 w-4 shrink-0" />
                  <span>Infinito</span>
                </button>
              </div>

              <div className="pt-1">
                <PWAInstallControl variant="prominent" />
              </div>

              <p className="text-xs font-bold text-[#143326] drop-shadow-[0_1px_0_rgba(255,255,255,0.75)] tabular-nums">
                Progresso · {progress.completedLevels.length} de {TOTAL_LEVELS} fases concluídas
                {bestScore > 0 ? ` · Recorde Infinito ${bestScore}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE SELECT OVERLAY (10 FASES) */}
      {gameState === 'STAGE_SELECT' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0F291E]/60 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-3xl border-[3px] border-[#143326] bg-[#FFFDF2] shadow-[0_8px_0_#143326]">
            <div className="flex items-center justify-between border-b border-[#143326]/12 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#143326] sm:text-3xl">
                  Escolha a Fase
                </h2>
                <p className="text-xs font-medium text-emerald-900/75 tabular-nums sm:text-sm">
                  {progress.completedLevels.length} de {TOTAL_LEVELS} fases concluídas · A dificuldade sobe a cada fase
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackToTitle}
                aria-label="Voltar ao menu"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#143326]/20 bg-emerald-50 text-[#143326] hover:bg-emerald-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 sm:p-6 md:grid-cols-5">
              {LEVELS.map((lvl) => {
                const isCompleted = progress.completedLevels.includes(lvl.id);
                const isUnlocked = lvl.id <= progress.unlockedLevel;
                const isCurrent = lvl.id === progress.unlockedLevel && !isCompleted;

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => handleStartCampaignLevel(lvl.id)}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-transform duration-150 ${
                      isUnlocked
                        ? isCurrent
                          ? 'border-[#143326] bg-[#FEF9C3] shadow-[0_4px_0_#143326] hover:-translate-y-0.5 active:translate-y-0.5'
                          : 'border-[#143326] bg-white shadow-[0_3px_0_#143326] hover:-translate-y-0.5 active:translate-y-0.5'
                        : 'cursor-not-allowed border-[#143326]/20 bg-emerald-950/5 opacity-70'
                    }`}
                  >
                    {/* Mini scenic sky swatch bar */}
                    <div
                      className="flex h-11 w-full items-center justify-between px-3"
                      style={{
                        background: `linear-gradient(135deg, ${lvl.palette.skyTop}, ${lvl.palette.skyMid}, ${lvl.palette.skyBottom})`,
                      }}
                    >
                      <span className="font-display score-stroke text-lg font-bold text-white tabular-nums">
                        {lvl.id}
                      </span>

                      {isCompleted ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#143326] bg-[#34D399] text-[#143326]">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      ) : !isUnlocked ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#143326]/70 text-white">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      ) : lvl.id === 10 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#143326] bg-[#FACC15] text-[#143326]">
                          <Crown className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-2.5">
                      <p className="font-display text-sm font-bold leading-tight text-[#143326]">
                        {lvl.name}
                      </p>
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-900/70 tabular-nums">
                        {lvl.targetPipes} canos
                        {lvl.movingPipeChance > 0 ? ' · Móveis' : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* READY / GET READY CUE */}
      {gameState === 'READY' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[18%] z-10 flex flex-col items-center gap-2 px-6 text-center">
          {gameMode === 'CAMPAIGN' && (
            <p className="max-w-xs text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(20,51,38,0.95)]">
              {activeLevel.subtitle}
            </p>
          )}
          <div className="motion-safe-bounce animate-bounce rounded-2xl border-2 border-[#143326] bg-[#FEF9C3]/95 px-5 py-2.5 shadow-[0_4px_0_#143326]">
            <p className="font-display text-lg font-bold text-[#143326] sm:text-xl">
              Toque ou aperte Espaço para pular!
            </p>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0F291E]/55 px-6 backdrop-blur-[2px]">
          <div className="w-full max-w-xs rounded-3xl border-[3px] border-[#143326] bg-[#FFFDF2] p-6 text-center shadow-[0_8px_0_#143326]">
            <h2 className="font-display text-3xl font-bold text-[#143326]">Pausado</h2>
            <p className="mt-1.5 text-sm font-medium text-emerald-900/80 tabular-nums">
              {gameMode === 'CAMPAIGN'
                ? `Fase ${activeLevel.id} · ${score} / ${activeLevel.targetPipes} canos`
                : `Pontuação atual · ${score}`}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleTogglePause}
                className="font-display inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#143326] bg-[#FACC15] px-5 py-2.5 text-lg font-bold text-[#143326] whitespace-nowrap shadow-[0_4px_0_#143326] transition-transform duration-150 hover:bg-[#FDE047] active:translate-y-0.5 active:shadow-[0_1px_0_#143326]"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Continuar</span>
              </button>

              <button
                type="button"
                onClick={handleRetryCurrent}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#143326]/25 bg-emerald-50 px-5 py-2 text-sm font-semibold text-[#143326] whitespace-nowrap transition-colors hover:bg-emerald-100"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reiniciar fase</span>
              </button>

              <button
                type="button"
                onClick={handleBackToTitle}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#143326]/15 bg-white px-5 py-2 text-sm font-semibold text-emerald-900/80 whitespace-nowrap transition-colors hover:bg-emerald-50"
              >
                Voltar ao menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE CLEAR VICTORY OVERLAY */}
      {gameState === 'STAGE_CLEAR' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0F291E]/50 px-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl border-[3px] border-[#143326] bg-[#FFFDF2] p-6 text-center shadow-[0_8px_0_#143326] sm:p-7">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#143326] bg-[#FACC15] text-[#143326] shadow-[0_4px_0_#143326]">
              {activeLevel.id === TOTAL_LEVELS ? (
                <Crown className="h-8 w-8" />
              ) : (
                <Award className="h-8 w-8" />
              )}
            </div>

            <h2 className="font-display mt-4 text-3xl font-bold text-[#143326] sm:text-4xl">
              {activeLevel.id === TOTAL_LEVELS
                ? 'Todas as Fases Concluídas!'
                : `Fase ${activeLevel.id} Concluída!`}
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-emerald-900/80">
              {activeLevel.name} · {activeLevel.targetPipes} canos superados
            </p>

            {activeLevel.id < TOTAL_LEVELS ? (
              <p className="mt-3 text-xs font-medium text-emerald-900/75">
                Próximo desafio: <strong>Fase {activeLevel.id + 1} — {getLevelConfig(activeLevel.id + 1).name}</strong>
              </p>
            ) : (
              <p className="mt-3 text-xs font-medium text-amber-800">
                Você dominou todas as 10 fases do Sapinho Voador! Que tal tentar o Modo Infinito agora?
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              {activeLevel.id < TOTAL_LEVELS ? (
                <button
                  type="button"
                  onClick={handleNextLevel}
                  className="font-display inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#143326] bg-[#FACC15] px-6 py-3 text-xl font-bold text-[#143326] whitespace-nowrap shadow-[0_5px_0_#143326] transition-transform duration-150 hover:bg-[#FDE047] active:translate-y-1 active:shadow-[0_1px_0_#143326]"
                >
                  <span>Próxima Fase</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEndless}
                  className="font-display inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#143326] bg-[#FACC15] px-6 py-3 text-xl font-bold text-[#143326] whitespace-nowrap shadow-[0_5px_0_#143326] transition-transform duration-150 hover:bg-[#FDE047] active:translate-y-1 active:shadow-[0_1px_0_#143326]"
                >
                  <InfinityIcon className="h-5 w-5" />
                  <span>Jogar Modo Infinito</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenStageSelect}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#143326]/20 bg-emerald-50 px-5 py-2 text-sm font-semibold text-[#143326] whitespace-nowrap hover:bg-emerald-100"
              >
                <MapIcon className="h-4 w-4" />
                <span>Ver todas as fases</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCORECARD */}
      {gameState === 'GAME_OVER' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0F291E]/45 px-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl border-[3px] border-[#143326] bg-[#FFFDF2] p-6 text-center shadow-[0_8px_0_#143326] sm:p-7">
            <h2 className="font-display text-4xl font-bold text-[#143326]">Fim de Jogo</h2>

            {gameMode === 'CAMPAIGN' ? (
              <>
                <p className="mt-1 text-sm font-semibold text-emerald-900/75">
                  Fase {activeLevel.id} · {activeLevel.name}
                </p>

                <div className="mt-5 border-y border-[#143326]/12 py-4">
                  <span className="text-xs font-semibold text-emerald-900/70">Progresso na fase</span>
                  <div className="font-display mt-1 text-4xl font-bold text-[#143326] tabular-nums">
                    {score}{' '}
                    <span className="text-2xl text-emerald-900/55">/ {activeLevel.targetPipes}</span>
                  </div>
                  <div className="mx-auto mt-3 h-2.5 w-48 overflow-hidden rounded-full border border-[#143326]/30 bg-emerald-950/10">
                    <div
                      className="h-full bg-[#FACC15]"
                      style={{ width: `${Math.round(progressRatio * 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {isNewRecord && (
                  <p className="mt-1 text-sm font-bold text-amber-700">
                    Novo recorde alcançado!
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 divide-x divide-[#143326]/12 border-y border-[#143326]/12 py-4">
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-emerald-900/70">Pontuação</span>
                    <span className="font-display mt-1 text-4xl font-bold text-[#143326] tabular-nums">
                      {score}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-xs font-semibold text-emerald-900/70">Recorde</span>
                    <span className="font-display mt-1 text-4xl font-bold text-amber-600 tabular-nums">
                      {bestScore}
                    </span>
                  </div>
                </div>

                {score >= 5 && (
                  <div className="mt-4">
                    <MedalBadge score={score} />
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={handleRetryCurrent}
                className="font-display inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl border-[3px] border-[#143326] bg-[#FACC15] px-6 py-3 text-xl font-bold text-[#143326] whitespace-nowrap shadow-[0_5px_0_#143326] transition-transform duration-150 hover:bg-[#FDE047] active:translate-y-1 active:shadow-[0_1px_0_#143326] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Tentar novamente</span>
              </button>

              <div className="grid w-full grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenStageSelect}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-[#143326]/20 bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#143326] whitespace-nowrap hover:bg-emerald-100 sm:text-sm"
                >
                  <MapIcon className="h-4 w-4 shrink-0" />
                  <span>10 Fases</span>
                </button>
                <button
                  type="button"
                  onClick={handleBackToTitle}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#143326]/20 bg-white px-3 py-2 text-xs font-semibold text-[#143326] whitespace-nowrap hover:bg-emerald-50 sm:text-sm"
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </main>
  );
}
