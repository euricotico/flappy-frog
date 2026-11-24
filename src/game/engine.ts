import { soundEngine } from './audio';
import { getLevelConfig, loadProgress, saveProgress, TOTAL_LEVELS } from './levels';
import {
  BASE_PIPE_GAP,
  BASE_PIPE_SPEED,
  Cloud,
  Firefly,
  FROG_RADIUS,
  GameMode,
  GameWorld,
  GRAVITY,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MAX_PIPE_SPEED,
  MIN_PIPE_GAP,
  PIPE_CAP_OVERHANG,
  PIPE_SPACING,
  PIPE_WIDTH,
  PLAYABLE_HEIGHT,
  Raindrop,
  WindLeaf,
  WORLD_HEIGHT,
} from './types';

export function computeFrogX(logicalWidth: number): number {
  return Math.max(84, Math.min(logicalWidth * 0.27, 290));
}

function createInitialClouds(width: number): Cloud[] {
  const count = Math.max(5, Math.ceil(width / 220) + 2);
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: (i / count) * (width + 240) - 80,
      y: 55 + ((i * 67) % 150),
      scale: 0.65 + ((i * 29) % 55) / 100,
      speed: 12 + ((i * 11) % 16),
      opacity: 0.72 + ((i * 13) % 25) / 100,
    });
  }
  return clouds;
}

function createInitialFireflies(width: number): Firefly[] {
  const count = Math.max(14, Math.ceil(width / 75));
  const fireflies: Firefly[] = [];
  for (let i = 0; i < count; i++) {
    fireflies.push({
      x: Math.random() * width,
      y: 80 + Math.random() * (PLAYABLE_HEIGHT - 150),
      phase: Math.random() * Math.PI * 2,
      speedX: -12 - Math.random() * 18,
      radius: 1.8 + Math.random() * 2.2,
    });
  }
  return fireflies;
}

function createInitialRaindrops(width: number): Raindrop[] {
  const count = Math.max(45, Math.ceil(width / 16));
  const drops: Raindrop[] = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      x: Math.random() * (width + 120),
      y: Math.random() * PLAYABLE_HEIGHT,
      length: 12 + Math.random() * 14,
      speedY: 460 + Math.random() * 220,
    });
  }
  return drops;
}

function createInitialWindLeaves(width: number): WindLeaf[] {
  const colors = ['#A3E635', '#74C69D', '#FDE047', '#FDBA74'];
  const count = Math.max(10, Math.ceil(width / 110));
  const leaves: WindLeaf[] = [];
  for (let i = 0; i < count; i++) {
    leaves.push({
      x: Math.random() * width,
      y: 60 + Math.random() * (PLAYABLE_HEIGHT - 120),
      speedX: -80 - Math.random() * 75,
      phase: Math.random() * Math.PI * 2,
      size: 4.5 + Math.random() * 3.5,
      color: colors[i % colors.length],
    });
  }
  return leaves;
}

export function createWorld(logicalWidth: number): GameWorld {
  const progress = loadProgress();

  return {
    state: 'TITLE_MENU',
    mode: 'CAMPAIGN',
    levelId: progress.unlockedLevel,
    width: logicalWidth,
    height: WORLD_HEIGHT,
    time: 0,
    score: 0,
    targetScore: getLevelConfig(progress.unlockedLevel).targetPipes,
    spawnedPipesInStage: 0,
    finishGateX: null,
    bestScore: progress.endlessBestScore,
    isNewRecord: false,
    groundOffset: 0,
    hillOffset: 0,
    reedOffset: 0,
    frog: {
      x: logicalWidth * 0.5,
      y: PLAYABLE_HEIGHT * 0.27,
      vy: 0,
      rotation: 0,
      kickTimer: 0,
      squashX: 1,
      squashY: 1,
      blinkTimer: 2.2,
      isBlinking: false,
      isDead: false,
    },
    pipes: [],
    particles: [],
    floatingScores: [],
    clouds: createInitialClouds(logicalWidth),
    fireflies: createInitialFireflies(logicalWidth),
    raindrops: createInitialRaindrops(logicalWidth),
    windLeaves: createInitialWindLeaves(logicalWidth),
    nextPipeId: 1,
    shakeTimer: 0,
    flashAlpha: 0,
    lightningAlpha: 0,
    lightningCooldown: 3.5,
    gameOverTimestamp: 0,
  };
}

export function resizeWorld(world: GameWorld, newLogicalWidth: number): void {
  world.width = newLogicalWidth;
  if (world.state === 'TITLE_MENU' || world.state === 'STAGE_SELECT') {
    world.frog.x = newLogicalWidth * 0.5;
  } else {
    world.frog.x = computeFrogX(newLogicalWidth);
  }
  if (world.clouds.length < Math.ceil(newLogicalWidth / 220) + 2) {
    world.clouds = createInitialClouds(newLogicalWidth);
  }
  if (world.raindrops.length < Math.ceil(newLogicalWidth / 16)) {
    world.raindrops = createInitialRaindrops(newLogicalWidth);
  }
}

export function startStageReady(
  world: GameWorld,
  mode: GameMode,
  levelId: number
): void {
  const clampedLevel = Math.max(1, Math.min(TOTAL_LEVELS, levelId));
  world.mode = mode;
  world.levelId = clampedLevel;
  world.state = 'READY';
  world.score = 0;
  world.targetScore = mode === 'CAMPAIGN' ? getLevelConfig(clampedLevel).targetPipes : null;
  world.spawnedPipesInStage = 0;
  world.finishGateX = null;
  world.isNewRecord = false;
  world.pipes = [];
  world.particles = [];
  world.floatingScores = [];
  world.shakeTimer = 0;
  world.flashAlpha = 0;
  world.lightningAlpha = 0;
  world.frog = {
    x: computeFrogX(world.width),
    y: PLAYABLE_HEIGHT * 0.46,
    vy: 0,
    rotation: 0,
    kickTimer: 0,
    squashX: 1,
    squashY: 1,
    blinkTimer: 2.0,
    isBlinking: false,
    isDead: false,
  };
}

function getActivePipeSpeed(world: GameWorld): number {
  if (world.mode === 'CAMPAIGN') {
    return getLevelConfig(world.levelId).pipeSpeed;
  }
  const ramp = Math.min(1, world.score / 50);
  return BASE_PIPE_SPEED + (MAX_PIPE_SPEED - BASE_PIPE_SPEED) * ramp;
}

function getActivePipeSpacing(world: GameWorld): number {
  if (world.mode === 'CAMPAIGN') {
    return getLevelConfig(world.levelId).pipeSpacing;
  }
  return PIPE_SPACING;
}

function spawnPipe(world: GameWorld, xPos: number): void {
  const isCampaign = world.mode === 'CAMPAIGN';
  const level = getLevelConfig(world.levelId);

  if (isCampaign && world.targetScore !== null && world.spawnedPipesInStage >= world.targetScore) {
    return;
  }

  let gapHeight: number;
  let maxDelta: number;
  let moveAmp = 0;
  let moveSpeed = 0;

  if (isCampaign) {
    gapHeight = level.gapHeight;
    maxDelta = level.maxDeltaY;
    // Never make the very first pipe of a stage move so the player gets a fair entry
    if (
      world.spawnedPipesInStage > 0 &&
      level.movingPipeChance > 0 &&
      Math.random() < level.movingPipeChance
    ) {
      moveAmp = level.movingAmplitude;
      moveSpeed = level.movingSpeed * (0.88 + Math.random() * 0.24);
    }
  } else {
    const ramp = Math.min(1, world.score / 45);
    gapHeight = BASE_PIPE_GAP - (BASE_PIPE_GAP - MIN_PIPE_GAP) * ramp;
    maxDelta = 175;
    if (world.score >= 18 && Math.random() < 0.35) {
      moveAmp = 24;
      moveSpeed = 1.6;
    }
  }

  const safeMargin = 78 + moveAmp;
  const minCenter = safeMargin + gapHeight / 2;
  const maxCenter = PLAYABLE_HEIGHT - safeMargin - gapHeight / 2;
  const effectiveMin = Math.min(minCenter, PLAYABLE_HEIGHT * 0.45);
  const effectiveMax = Math.max(maxCenter, PLAYABLE_HEIGHT * 0.55);

  let gapY: number;
  const lastPipe = world.pipes[world.pipes.length - 1];
  if (lastPipe) {
    const low = Math.max(effectiveMin, lastPipe.baseGapY - maxDelta);
    const high = Math.min(effectiveMax, lastPipe.baseGapY + maxDelta);
    gapY = low + Math.random() * (high - low);
  } else {
    gapY = PLAYABLE_HEIGHT * 0.44 + (Math.random() - 0.5) * 90;
    gapY = Math.max(effectiveMin, Math.min(effectiveMax, gapY));
  }

  world.pipes.push({
    id: world.nextPipeId++,
    x: xPos,
    gapY,
    baseGapY: gapY,
    gapHeight,
    moveAmp,
    moveSpeed,
    movePhase: Math.random() * Math.PI * 2,
    passed: false,
    leafSeed: Math.random(),
  });

  world.spawnedPipesInStage += 1;

  // Place the celebratory finish gate right after the last pipe of the stage
  if (
    isCampaign &&
    world.targetScore !== null &&
    world.spawnedPipesInStage === world.targetScore
  ) {
    world.finishGateX = xPos + PIPE_WIDTH + 95;
  }
}

function emitJumpParticles(world: GameWorld): void {
  const { frog } = world;
  const colors = ['#FEF08A', '#FFFFFF', '#BAE6FD', '#FDE047'];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * 0.65 + (Math.random() - 0.5) * 0.9;
    const speed = 45 + Math.random() * 85;
    world.particles.push({
      x: frog.x - 12 + (Math.random() - 0.5) * 8,
      y: frog.y + 10 + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed - 35,
      vy: Math.sin(angle) * speed + 15,
      radius: 2.5 + Math.random() * 3.2,
      alpha: 0.95,
      life: 0,
      maxLife: 0.32 + Math.random() * 0.2,
      color: colors[i % colors.length],
    });
  }
}

function emitHitParticles(world: GameWorld): void {
  const { frog } = world;
  const colors = ['#FACC15', '#FEF08A', '#FFFFFF', '#86EFAC'];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.25;
    const speed = 70 + Math.random() * 140;
    world.particles.push({
      x: frog.x,
      y: frog.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      radius: 3 + Math.random() * 3.5,
      alpha: 1,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.25,
      color: colors[i % colors.length],
    });
  }
}

function emitCelebrationParticles(world: GameWorld): void {
  const { frog } = world;
  const colors = ['#FDE047', '#34D399', '#38BDF8', '#FB7185', '#FFFFFF'];
  for (let i = 0; i < 36; i++) {
    const angle = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
    const speed = 110 + Math.random() * 210;
    world.particles.push({
      x: frog.x + (Math.random() - 0.5) * 30,
      y: frog.y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      radius: 3.2 + Math.random() * 3.8,
      alpha: 1,
      life: 0,
      maxLife: 0.85 + Math.random() * 0.55,
      color: colors[i % colors.length],
    });
  }
}

export function triggerJump(world: GameWorld): boolean {
  if (world.state === 'READY') {
    world.state = 'PLAYING';
    const spacing = getActivePipeSpacing(world);
    const firstPipeX = Math.max(world.frog.x + 330, Math.min(world.width + 40, world.frog.x + 400));
    spawnPipe(world, firstPipeX);
    let nextX = firstPipeX + spacing;
    while (
      nextX < world.width + spacing &&
      (world.targetScore === null || world.spawnedPipesInStage < world.targetScore)
    ) {
      spawnPipe(world, nextX);
      nextX += spacing;
    }
  }

  if (world.state !== 'PLAYING') {
    return false;
  }

  world.frog.vy = JUMP_VELOCITY;
  world.frog.kickTimer = 0.22;
  world.frog.squashX = 0.86;
  world.frog.squashY = 1.18;
  world.frog.rotation = -0.44;
  emitJumpParticles(world);
  soundEngine.playJump();
  return true;
}

function circleIntersectsRect(
  cx: number,
  cy: number,
  cr: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

function triggerStageClear(
  world: GameWorld,
  onStateChange: (world: GameWorld) => void
): void {
  if (world.state === 'STAGE_CLEAR') return;

  world.state = 'STAGE_CLEAR';
  world.frog.vy = 0;
  world.frog.rotation = -0.1;
  world.gameOverTimestamp = performance.now();

  // Persist unlocked next level and mark current level completed
  const progress = loadProgress();
  if (!progress.completedLevels.includes(world.levelId)) {
    progress.completedLevels.push(world.levelId);
    progress.completedLevels.sort((a, b) => a - b);
  }
  if (world.levelId < TOTAL_LEVELS && progress.unlockedLevel <= world.levelId) {
    progress.unlockedLevel = world.levelId + 1;
  }
  saveProgress(progress);

  emitCelebrationParticles(world);
  soundEngine.playStageClear();
  onStateChange(world);
}

function triggerGameOver(
  world: GameWorld,
  onStateChange: (world: GameWorld) => void
): void {
  if (world.state === 'GAME_OVER') return;

  world.state = 'GAME_OVER';
  world.frog.isDead = true;
  world.shakeTimer = 0.26;
  world.flashAlpha = 0.65;
  world.gameOverTimestamp = performance.now();

  if (world.mode === 'ENDLESS' && world.score > world.bestScore) {
    world.bestScore = world.score;
    world.isNewRecord = true;
    const progress = loadProgress();
    progress.endlessBestScore = world.bestScore;
    saveProgress(progress);
    soundEngine.playHit();
    setTimeout(() => soundEngine.playNewRecord(), 240);
  } else {
    soundEngine.playHit();
  }

  emitHitParticles(world);
  onStateChange(world);
}

export function updateWorld(
  world: GameWorld,
  rawDt: number,
  onScoreChange: (score: number, bestScore: number) => void,
  onStateChange: (world: GameWorld) => void
): void {
  const dt = Math.min(rawDt, 0.05);
  if (world.state === 'PAUSED') return;

  world.time += dt;

  if (world.shakeTimer > 0) {
    world.shakeTimer = Math.max(0, world.shakeTimer - dt);
  }
  if (world.flashAlpha > 0) {
    world.flashAlpha = Math.max(0, world.flashAlpha - dt * 2.4);
  }

  // Subtle distant lightning during storm stage (level 9)
  const level = getLevelConfig(world.levelId);
  if (world.mode === 'CAMPAIGN' && level.weather === 'rain') {
    if (world.lightningAlpha > 0) {
      world.lightningAlpha = Math.max(0, world.lightningAlpha - dt * 2.8);
    }
    world.lightningCooldown -= dt;
    if (world.lightningCooldown <= 0) {
      world.lightningAlpha = 0.28;
      world.lightningCooldown = 4.2 + Math.random() * 5.0;
    }
  } else {
    world.lightningAlpha = 0;
  }

  // Natural blinking
  const { frog } = world;
  frog.blinkTimer -= dt;
  if (frog.blinkTimer <= 0) {
    if (frog.isBlinking) {
      frog.isBlinking = false;
      frog.blinkTimer = 2.4 + Math.random() * 2.5;
    } else {
      frog.isBlinking = true;
      frog.blinkTimer = 0.13;
    }
  }

  // Spring squash-and-stretch
  frog.squashX += (1 - frog.squashX) * Math.min(1, dt * 14);
  frog.squashY += (1 - frog.squashY) * Math.min(1, dt * 14);
  if (frog.kickTimer > 0) {
    frog.kickTimer = Math.max(0, frog.kickTimer - dt);
  }

  // Clouds
  for (const cloud of world.clouds) {
    cloud.x -= cloud.speed * dt;
    if (cloud.x < -160) {
      cloud.x = world.width + 120 + Math.random() * 80;
      cloud.y = 48 + Math.random() * 155;
    }
  }

  // Fireflies
  for (const fly of world.fireflies) {
    fly.phase += dt * 3.2;
    fly.x += fly.speedX * dt;
    fly.y += Math.sin(fly.phase) * 14 * dt;
    if (fly.x < -20) {
      fly.x = world.width + 20;
      fly.y = 80 + Math.random() * (PLAYABLE_HEIGHT - 150);
    }
  }

  // Raindrops
  for (const drop of world.raindrops) {
    drop.x -= 115 * dt;
    drop.y += drop.speedY * dt;
    if (drop.y > PLAYABLE_HEIGHT + 20 || drop.x < -20) {
      drop.x = Math.random() * (world.width + 140);
      drop.y = -20 - Math.random() * 60;
    }
  }

  // Wind leaves
  for (const leaf of world.windLeaves) {
    leaf.phase += dt * 4.0;
    leaf.x += leaf.speedX * dt;
    leaf.y += Math.sin(leaf.phase) * 28 * dt;
    if (leaf.x < -24) {
      leaf.x = world.width + 24 + Math.random() * 80;
      leaf.y = 60 + Math.random() * (PLAYABLE_HEIGHT - 120);
    }
  }

  // Particles
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 240 * dt;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    if (p.life >= p.maxLife) {
      world.particles.splice(i, 1);
    }
  }

  // Floating +1 score pops
  for (let i = world.floatingScores.length - 1; i >= 0; i--) {
    const fs = world.floatingScores[i];
    fs.y += fs.vy * dt;
    fs.alpha -= dt * 1.45;
    if (fs.alpha <= 0) {
      world.floatingScores.splice(i, 1);
    }
  }

  if (
    world.state === 'TITLE_MENU' ||
    world.state === 'STAGE_SELECT' ||
    world.state === 'READY' ||
    world.state === 'STAGE_CLEAR'
  ) {
    const idleSpeed = BASE_PIPE_SPEED * (world.state === 'STAGE_CLEAR' ? 0.35 : 0.55);
    world.groundOffset = (world.groundOffset + idleSpeed * dt) % 48;
    world.hillOffset = (world.hillOffset + idleSpeed * 0.14 * dt) % 360;
    world.reedOffset = (world.reedOffset + idleSpeed * 0.35 * dt) % 240;

    if (world.state === 'TITLE_MENU' || world.state === 'STAGE_SELECT') {
      frog.x = world.width * 0.5;
      frog.y = PLAYABLE_HEIGHT * 0.27 + Math.sin(world.time * 4.4) * 10;
    } else if (world.state === 'READY') {
      frog.x = computeFrogX(world.width);
      frog.y = PLAYABLE_HEIGHT * 0.46 + Math.sin(world.time * 4.4) * 10;
    } else if (world.state === 'STAGE_CLEAR') {
      // Joyful victory hover
      frog.y += (PLAYABLE_HEIGHT * 0.38 - frog.y) * Math.min(1, dt * 4);
      frog.y += Math.sin(world.time * 6) * 1.2;
    }
    frog.rotation = Math.sin(world.time * 4.4 - 0.6) * 0.08;
    return;
  }

  if (world.state === 'PLAYING') {
    const speed = getActivePipeSpeed(world);
    const spacing = getActivePipeSpacing(world);
    const gravMult = world.mode === 'CAMPAIGN' ? level.gravityMultiplier : 1.0;

    // Parallax scrolling
    world.groundOffset = (world.groundOffset + speed * dt) % 48;
    world.hillOffset = (world.hillOffset + speed * 0.14 * dt) % 360;
    world.reedOffset = (world.reedOffset + speed * 0.35 * dt) % 240;

    // Frog gravity & vertical motion
    frog.vy = Math.min(MAX_FALL_SPEED, frog.vy + GRAVITY * gravMult * dt);
    frog.y += frog.vy * dt;

    // Top ceiling clamp
    if (frog.y < FROG_RADIUS + 6) {
      frog.y = FROG_RADIUS + 6;
      if (frog.vy < 0) frog.vy = 0;
    }

    // Pitch rotation
    if (frog.vy < 140) {
      frog.rotation += (-0.42 - frog.rotation) * Math.min(1, dt * 14);
    } else {
      const fallFactor = Math.min(1, (frog.vy - 140) / (MAX_FALL_SPEED - 140));
      const targetRot = -0.42 + fallFactor * 1.65;
      frog.rotation += (targetRot - frog.rotation) * Math.min(1, dt * 7.5);
    }

    // Move finish gate if spawned
    if (world.finishGateX !== null) {
      world.finishGateX -= speed * dt;
      if (world.finishGateX <= frog.x) {
        triggerStageClear(world, onStateChange);
        return;
      }
    }

    // Move, oscillate & score pipes
    for (let i = world.pipes.length - 1; i >= 0; i--) {
      const pipe = world.pipes[i];
      pipe.x -= speed * dt;

      if (pipe.moveAmp > 0) {
        pipe.gapY = pipe.baseGapY + Math.sin(world.time * pipe.moveSpeed + pipe.movePhase) * pipe.moveAmp;
      }

      if (!pipe.passed && pipe.x + PIPE_WIDTH / 2 < frog.x) {
        pipe.passed = true;
        world.score += 1;
        soundEngine.playScore();
        world.floatingScores.push({
          x: frog.x + 14,
          y: frog.y - 26,
          vy: -48,
          alpha: 1,
          text: '+1',
        });
        onScoreChange(
          world.score,
          world.mode === 'ENDLESS' ? Math.max(world.bestScore, world.score) : world.bestScore
        );
      }

      if (pipe.x + PIPE_WIDTH + PIPE_CAP_OVERHANG < -40) {
        world.pipes.splice(i, 1);
      }
    }

    // Spawn upcoming pipes (respecting stage pipe count in CAMPAIGN mode)
    const canSpawnMore =
      world.targetScore === null || world.spawnedPipesInStage < world.targetScore;
    if (canSpawnMore) {
      const lastPipe = world.pipes[world.pipes.length - 1];
      if (!lastPipe || lastPipe.x < world.width + 60) {
        const spawnX = lastPipe
          ? Math.max(world.width + 40, lastPipe.x + spacing)
          : world.width + 80;
        spawnPipe(world, spawnX);
      }
    }

    // Ground collision
    if (frog.y + FROG_RADIUS >= PLAYABLE_HEIGHT) {
      frog.y = PLAYABLE_HEIGHT - FROG_RADIUS;
      frog.vy = 0;
      triggerGameOver(world, onStateChange);
      return;
    }

    // Pipe collision (2px forgiving inset)
    const hitRadius = FROG_RADIUS - 2;
    for (const pipe of world.pipes) {
      const topHeight = pipe.gapY - pipe.gapHeight / 2;
      const bottomY = pipe.gapY + pipe.gapHeight / 2;

      if (
        circleIntersectsRect(frog.x, frog.y, hitRadius, pipe.x, -200, PIPE_WIDTH, topHeight + 200) ||
        circleIntersectsRect(
          frog.x,
          frog.y,
          hitRadius,
          pipe.x - PIPE_CAP_OVERHANG + 2,
          topHeight - 28,
          PIPE_WIDTH + (PIPE_CAP_OVERHANG - 2) * 2,
          28
        )
      ) {
        triggerGameOver(world, onStateChange);
        return;
      }

      if (
        circleIntersectsRect(
          frog.x,
          frog.y,
          hitRadius,
          pipe.x,
          bottomY,
          PIPE_WIDTH,
          PLAYABLE_HEIGHT - bottomY
        ) ||
        circleIntersectsRect(
          frog.x,
          frog.y,
          hitRadius,
          pipe.x - PIPE_CAP_OVERHANG + 2,
          bottomY,
          PIPE_WIDTH + (PIPE_CAP_OVERHANG - 2) * 2,
          28
        )
      ) {
        triggerGameOver(world, onStateChange);
        return;
      }
    }
  } else if (world.state === 'GAME_OVER') {
    if (frog.y + FROG_RADIUS < PLAYABLE_HEIGHT) {
      frog.vy = Math.min(MAX_FALL_SPEED * 1.1, frog.vy + GRAVITY * dt);
      frog.y = Math.min(PLAYABLE_HEIGHT - FROG_RADIUS, frog.y + frog.vy * dt);
      frog.rotation = Math.min(1.45, frog.rotation + dt * 5.2);
    }
  }
}
