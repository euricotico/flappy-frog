import { getLevelConfig, StagePalette, WeatherType } from './levels';
import {
  Cloud,
  FrogState,
  GameWorld,
  GROUND_HEIGHT,
  PIPE_CAP_HEIGHT,
  PIPE_CAP_OVERHANG,
  PIPE_WIDTH,
  PipeObstacle,
  PLAYABLE_HEIGHT,
  WORLD_HEIGHT,
} from './types';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getActivePaletteAndWeather(world: GameWorld): {
  palette: StagePalette;
  weather: WeatherType;
} {
  if (world.mode === 'CAMPAIGN') {
    const level = getLevelConfig(world.levelId);
    return { palette: level.palette, weather: level.weather };
  }
  // In Endless mode, rotate through stages' scenic palettes every 8 points
  const stageIdx = (Math.floor(world.score / 8) % 10) + 1;
  const level = getLevelConfig(stageIdx);
  return { palette: level.palette, weather: level.weather };
}

function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud, nightFactor: number): void {
  ctx.save();
  ctx.translate(cloud.x, cloud.y);
  ctx.scale(cloud.scale, cloud.scale);
  ctx.globalAlpha = cloud.opacity * (1 - nightFactor * 0.55);

  ctx.fillStyle = nightFactor > 0.6 ? '#CBD5E1' : '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.arc(24, -8, 28, 0, Math.PI * 2);
  ctx.arc(52, -2, 22, 0, Math.PI * 2);
  ctx.arc(26, 8, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  palette: StagePalette,
  weather: WeatherType
): void {
  const { width, time } = world;
  const { nightFactor } = palette;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, PLAYABLE_HEIGHT);
  skyGrad.addColorStop(0, palette.skyTop);
  skyGrad.addColorStop(0.55, palette.skyMid);
  skyGrad.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, PLAYABLE_HEIGHT);

  // Mystical aurora ribbons in Stage 10
  if (weather === 'aurora') {
    ctx.save();
    for (let band = 0; band < 2; band++) {
      const grad = ctx.createLinearGradient(0, 40 + band * 50, width, 180 + band * 40);
      grad.addColorStop(0, 'rgba(52, 211, 153, 0.0)');
      grad.addColorStop(0.35, band === 0 ? 'rgba(52, 211, 153, 0.24)' : 'rgba(250, 204, 21, 0.22)');
      grad.addColorStop(0.7, band === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(167, 139, 250, 0.18)');
      grad.addColorStop(1, 'rgba(52, 211, 153, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 120 + band * 45);
      for (let x = 0; x <= width + 40; x += 40) {
        const wave = Math.sin(x * 0.008 + time * 1.1 + band * 2.1) * 26;
        ctx.lineTo(x, 100 + band * 45 + wave);
      }
      ctx.lineTo(width, 230 + band * 35);
      ctx.lineTo(0, 230 + band * 35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Distant storm lightning glow
  if (world.lightningAlpha > 0) {
    ctx.fillStyle = `rgba(226, 232, 240, ${world.lightningAlpha})`;
    ctx.fillRect(0, 0, width, PLAYABLE_HEIGHT);
  }

  // Twinkling stars at dusk/night/aurora
  if (nightFactor > 0.35) {
    ctx.save();
    const starAlpha = (nightFactor - 0.35) / 0.65;
    for (let i = 0; i < 32; i++) {
      const sx = ((i * 197.3) % (width + 40)) - 20;
      const sy = 26 + ((i * 89.7) % 190);
      const twinkle = 0.5 + 0.5 * Math.sin(time * 2.5 + i * 1.7);
      ctx.fillStyle = `rgba(255, 253, 232, ${starAlpha * (0.35 + twinkle * 0.65)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Sun or Moon orb
  const orbX = width * 0.78;
  const orbY = 98 + nightFactor * 10;
  const glowGrad = ctx.createRadialGradient(orbX, orbY, 12, orbX, orbY, 82);
  glowGrad.addColorStop(0, palette.orbGlow);
  glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(orbX, orbY, 82, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.orbColor;
  ctx.beginPath();
  ctx.arc(orbX, orbY, 25, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  for (const cloud of world.clouds) {
    drawCloud(ctx, cloud, nightFactor);
  }

  // Far marsh hills
  ctx.fillStyle = palette.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, PLAYABLE_HEIGHT);
  const hillStep = 180;
  const startHill = -(world.hillOffset % hillStep) - hillStep;
  for (let x = startHill; x <= width + hillStep * 2; x += hillStep) {
    ctx.quadraticCurveTo(x + hillStep * 0.5, PLAYABLE_HEIGHT - 122, x + hillStep, PLAYABLE_HEIGHT - 64);
  }
  ctx.lineTo(width, PLAYABLE_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Pond water band
  const waterY = PLAYABLE_HEIGHT - 62;
  const waterGrad = ctx.createLinearGradient(0, waterY, 0, PLAYABLE_HEIGHT);
  waterGrad.addColorStop(0, palette.waterTop);
  waterGrad.addColorStop(1, palette.waterBottom);
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, waterY, width, 62);

  // Water ripples, lily pads & reeds
  const reedSpan = 240;
  const startReed = -(world.reedOffset % reedSpan) - reedSpan;
  for (let x = startReed; x <= width + reedSpan; x += reedSpan) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(x + 28, waterY + 14, 48, 3);
    ctx.fillRect(x + 135, waterY + 26, 36, 2.5);

    ctx.save();
    ctx.translate(x + 95, waterY + 34);
    ctx.fillStyle = nightFactor > 0.65 ? '#2D6A4F' : '#52B788';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 6.5, 0, 0.25, Math.PI * 2 - 0.12);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    if (Math.abs(Math.round(x / reedSpan)) % 2 === 0) {
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.ellipse(-4, -3, 5.5, 3, -0.3, 0, Math.PI * 2);
      ctx.ellipse(4, -3, 5.5, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(0, -4.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = palette.hillNear;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    const swayMult = weather === 'breeze' || weather === 'rain' ? 8 : 4;
    const sway = Math.sin(time * (weather === 'breeze' ? 3.8 : 2.1) + x * 0.02) * swayMult;

    ctx.beginPath();
    ctx.moveTo(x + 185, PLAYABLE_HEIGHT);
    ctx.quadraticCurveTo(x + 185 + sway * 0.5, PLAYABLE_HEIGHT - 44, x + 182 + sway, PLAYABLE_HEIGHT - 82);
    ctx.stroke();

    ctx.fillStyle = nightFactor > 0.65 ? '#4A3123' : '#7C4A2D';
    ctx.beginPath();
    ctx.ellipse(x + 182 + sway, PLAYABLE_HEIGHT - 74, 4.5, 11, sway * 0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 194, PLAYABLE_HEIGHT);
    ctx.quadraticCurveTo(x + 204 + sway * 0.6, PLAYABLE_HEIGHT - 34, x + 210 + sway, PLAYABLE_HEIGHT - 60);
    ctx.stroke();
    ctx.restore();
  }

  // Soft mountain mist veil in Stage 7
  if (weather === 'mist') {
    const mistGrad = ctx.createLinearGradient(0, PLAYABLE_HEIGHT - 170, 0, PLAYABLE_HEIGHT);
    mistGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
    mistGrad.addColorStop(1, 'rgba(226, 232, 240, 0.32)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, PLAYABLE_HEIGHT - 170, width, 170);
  }

  // Glowing fireflies in night/aurora stages
  if (weather === 'fireflies' || weather === 'aurora' || nightFactor > 0.55) {
    ctx.save();
    for (const fly of world.fireflies) {
      const pulse = 0.4 + 0.6 * Math.sin(fly.phase * 1.4);
      const alpha = Math.max(0.5, nightFactor) * pulse;
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, fly.radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(254, 249, 195, ${alpha})`;
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, fly.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawWeatherForeground(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  weather: WeatherType
): void {
  if (weather === 'breeze') {
    ctx.save();
    for (const leaf of world.windLeaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(Math.sin(leaf.phase) * 0.7);
      ctx.fillStyle = leaf.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else if (weather === 'rain') {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const drop of world.raindrops) {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + drop.length);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawPipeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: StagePalette
): void {
  if (h <= 0) return;

  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, palette.pipeDark);
  grad.addColorStop(0.2, palette.pipeMid);
  grad.addColorStop(0.38, palette.pipeLight);
  grad.addColorStop(0.7, palette.pipeMid);
  grad.addColorStop(1, palette.pipeDark);

  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = 'rgba(20, 51, 38, 0.16)';
  for (let bandY = y + 48; bandY < y + h - 24; bandY += 64) {
    ctx.fillRect(x + 2, bandY, w - 4, 4);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(x + 11, y, 8, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(x + 22, y, 3, h);

  ctx.strokeStyle = '#143326';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawPipeCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  palette: StagePalette,
  isMoving: boolean
): void {
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, palette.pipeDark);
  grad.addColorStop(0.18, palette.pipeMid);
  grad.addColorStop(0.38, palette.pipeLight);
  grad.addColorStop(0.7, palette.pipeMid);
  grad.addColorStop(1, palette.pipeDark);

  drawRoundedRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(x + 12, y + 3, 9, h - 6);

  // Subtle golden trim band on moving pipes so players read moving hazards cleanly
  if (isMoving) {
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(x + 3, y + h / 2 - 2.5, w - 6, 5);
  }

  ctx.strokeStyle = '#143326';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, w, h, 7);
  ctx.stroke();
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: PipeObstacle,
  palette: StagePalette
): void {
  const topHeight = pipe.gapY - pipe.gapHeight / 2;
  const bottomY = pipe.gapY + pipe.gapHeight / 2;
  const capX = pipe.x - PIPE_CAP_OVERHANG;
  const capW = PIPE_WIDTH + PIPE_CAP_OVERHANG * 2;
  const isMoving = pipe.moveAmp > 0;

  const topShaftH = Math.max(0, topHeight - PIPE_CAP_HEIGHT);
  drawPipeBody(ctx, pipe.x, -4, PIPE_WIDTH, topShaftH + 4, palette);
  drawPipeCap(ctx, capX, topHeight - PIPE_CAP_HEIGHT, capW, PIPE_CAP_HEIGHT, palette, isMoving);

  const bottomShaftY = bottomY + PIPE_CAP_HEIGHT;
  const bottomShaftH = Math.max(0, PLAYABLE_HEIGHT - bottomShaftY + 4);
  drawPipeBody(ctx, pipe.x, bottomShaftY, PIPE_WIDTH, bottomShaftH, palette);
  drawPipeCap(ctx, capX, bottomY, capW, PIPE_CAP_HEIGHT, palette, isMoving);

  if (pipe.leafSeed > 0.38) {
    ctx.save();
    ctx.translate(capX + capW - 4, bottomY + 12);
    ctx.rotate(-0.35);
    ctx.fillStyle = palette.pipeLight;
    ctx.strokeStyle = '#143326';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(7, 0, 8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawFinishGate(ctx: CanvasRenderingContext2D, gateX: number, time: number): void {
  ctx.save();

  // Golden celebratory beam from sky to pond bank
  const beamGrad = ctx.createLinearGradient(gateX - 18, 0, gateX + 18, 0);
  beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
  beamGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.34)');
  beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(gateX - 18, 0, 36, PLAYABLE_HEIGHT);

  // Checkered finish ribbon strip
  const squareSize = 14;
  for (let y = 52; y < PLAYABLE_HEIGHT; y += squareSize) {
    const row = Math.floor(y / squareSize);
    ctx.fillStyle = row % 2 === 0 ? '#FEF9C3' : '#143326';
    ctx.fillRect(gateX - 5, y, 10, squareSize);
  }

  // Festive top golden pennant banner
  const wave = Math.sin(time * 5.5) * 3;
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = '#143326';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, gateX - 54, 18 + wave, 108, 34, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = "700 15px 'Fredoka', sans-serif";
  ctx.fillStyle = '#143326';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHEGADA', gateX, 35 + wave);

  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, world: GameWorld): void {
  const { width, groundOffset } = world;
  const y = PLAYABLE_HEIGHT;

  const soilGrad = ctx.createLinearGradient(0, y + 20, 0, WORLD_HEIGHT);
  soilGrad.addColorStop(0, '#D4A373');
  soilGrad.addColorStop(0.45, '#BC8A5F');
  soilGrad.addColorStop(1, '#8B5E34');
  ctx.fillStyle = soilGrad;
  ctx.fillRect(0, y + 18, width, GROUND_HEIGHT - 18);

  ctx.fillStyle = 'rgba(92, 58, 28, 0.24)';
  const pebbleStep = 48;
  const startPebble = -(groundOffset % pebbleStep) - pebbleStep;
  for (let x = startPebble; x < width + pebbleStep; x += pebbleStep) {
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 42, 6, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 36, y + 66, 8, 4, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#52B788';
  ctx.fillRect(0, y, width, 22);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, width, 22);
  ctx.clip();

  ctx.fillStyle = '#74C69D';
  const stripeW = 24;
  const startStripe = -(groundOffset % (stripeW * 2)) - stripeW * 2;
  for (let x = startStripe; x < width + stripeW * 2; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + stripeW, y);
    ctx.lineTo(x + stripeW - 12, y + 22);
    ctx.lineTo(x - 12, y + 22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#2D6A4F';
  ctx.fillRect(0, y + 19, width, 4);
  ctx.fillStyle = '#143326';
  ctx.fillRect(0, y, width, 3);
}

function drawYellowFrog(ctx: CanvasRenderingContext2D, frog: FrogState, time: number): void {
  ctx.save();
  ctx.translate(frog.x, frog.y);
  ctx.rotate(frog.rotation);
  ctx.scale(frog.squashX, frog.squashY);

  const outline = '#422006';
  const kickProgress = frog.kickTimer > 0 ? Math.sin((frog.kickTimer / 0.22) * Math.PI) : 0;

  // Back webbed leg
  ctx.save();
  ctx.translate(-12, 8);
  ctx.rotate(0.25 + kickProgress * 0.72);
  ctx.fillStyle = '#EAB308';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(-3, 2, 10, 6.5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-22 - kickProgress * 5, 1);
  ctx.lineTo(-19 - kickProgress * 4, 7);
  ctx.lineTo(-22 - kickProgress * 5, 11);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Plump golden-yellow body
  const bodyGrad = ctx.createRadialGradient(-4, -6, 3, 0, 2, 24);
  bodyGrad.addColorStop(0, '#FEF08A');
  bodyGrad.addColorStop(0.45, '#FACC15');
  bodyGrad.addColorStop(1, '#EAB308');

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, 2, 21, 16.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cream belly
  ctx.fillStyle = '#FEF9C3';
  ctx.beginPath();
  ctx.ellipse(3, 8.5, 13.5, 7.5, -0.06, 0, Math.PI * 2);
  ctx.fill();

  // Back spots
  ctx.fillStyle = 'rgba(202, 138, 4, 0.42)';
  ctx.beginPath();
  ctx.ellipse(-10, -4, 3.6, 2.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-4, -8, 2.6, 1.8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Front arm
  ctx.save();
  ctx.translate(4, 9);
  ctx.rotate(-0.2 - kickProgress * 0.55 + Math.sin(time * 7) * 0.06);
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(2, 4, 6.5, 4, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Eye bumps
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(11, -12, 8.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(2, -13, 9.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const drawEyeInterior = (ex: number, ey: number, radius: number) => {
    if (frog.isDead) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      const s = radius * 0.45;
      ctx.beginPath();
      ctx.moveTo(ex - s, ey - s);
      ctx.lineTo(ex + s, ey + s);
      ctx.moveTo(ex + s, ey - s);
      ctx.lineTo(ex - s, ey + s);
      ctx.stroke();
      return;
    }

    if (frog.isBlinking) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, ey + 1, radius * 0.6, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      return;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex, ey, radius, 0, Math.PI * 2);
    ctx.fill();

    const lookY = Math.max(-1.6, Math.min(1.8, frog.vy * 0.004));
    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.arc(ex + 1.8, ey + lookY, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex + 2.8, ey + lookY - 1.6, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEyeInterior(11.5, -12, 5.6);
  drawEyeInterior(2.5, -13, 6.4);

  // Blush
  ctx.fillStyle = 'rgba(251, 113, 133, 0.58)';
  ctx.beginPath();
  ctx.ellipse(9.5, 3.2, 4.2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smile / surprised O
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  if (frog.isDead) {
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.ellipse(15.5, 2.5, 3.2, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (frog.kickTimer > 0.06) {
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(14.5, 1.2, 4.2, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(10, 1.8);
    ctx.quadraticCurveTo(15.5, 4.8, 19.5, 0.8);
    ctx.stroke();
  }

  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(15.5, -3.5, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, world: GameWorld): void {
  for (const p of world.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingScores(ctx: CanvasRenderingContext2D, world: GameWorld): void {
  for (const fs of world.floatingScores) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, fs.alpha);
    ctx.font = "700 22px 'Fredoka', sans-serif";
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#143326';
    ctx.strokeText(fs.text, fs.x, fs.y);
    ctx.fillStyle = '#FEF08A';
    ctx.fillText(fs.text, fs.x, fs.y);
    ctx.restore();
  }
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  canvasWidth: number,
  canvasHeight: number
): void {
  const scale = canvasHeight / WORLD_HEIGHT;
  const { palette, weather } = getActivePaletteAndWeather(world);

  ctx.save();
  ctx.scale(scale, scale);

  if (world.shakeTimer > 0) {
    const intensity = (world.shakeTimer / 0.26) * 7;
    const dx = (Math.random() - 0.5) * 2 * intensity;
    const dy = (Math.random() - 0.5) * 2 * intensity;
    ctx.translate(dx, dy);
  }

  // 1. Stage-specific sky, aurora/stars, hills & pond
  drawBackground(ctx, world, palette, weather);

  // 2. Finish gate behind pipes
  if (world.finishGateX !== null && world.finishGateX < world.width + 80) {
    drawFinishGate(ctx, world.finishGateX, world.time);
  }

  // 3. Pipes
  for (const pipe of world.pipes) {
    drawPipe(ctx, pipe, palette);
  }

  // 4. Scrolling pond bank ground
  drawGround(ctx, world);

  // 5. Particles
  drawParticles(ctx, world);

  // 6. Yellow frog protagonist
  drawYellowFrog(ctx, world.frog, world.time);

  // 7. Foreground weather (breeze leaves / tropical rain)
  drawWeatherForeground(ctx, world, weather);

  // 8. Floating +1 cues
  drawFloatingScores(ctx, world);

  // 9. Collision flash
  if (world.flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${world.flashAlpha})`;
    ctx.fillRect(-20, -20, world.width + 40, WORLD_HEIGHT + 40);
  }

  ctx.restore();

  void canvasWidth;
}
