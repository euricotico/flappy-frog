export type WeatherType = 'clear' | 'breeze' | 'mist' | 'fireflies' | 'rain' | 'aurora';

export interface StagePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  orbColor: string;
  orbGlow: string;
  hillFar: string;
  hillNear: string;
  waterTop: string;
  waterBottom: string;
  pipeLight: string;
  pipeMid: string;
  pipeDark: string;
  nightFactor: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  targetPipes: number;
  pipeSpeed: number;
  gapHeight: number;
  pipeSpacing: number;
  maxDeltaY: number;
  gravityMultiplier: number;
  movingPipeChance: number;
  movingAmplitude: number;
  movingSpeed: number;
  weather: WeatherType;
  palette: StagePalette;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Lagoa Tranquila',
    subtitle: 'Ritmo suave e aberturas largas para aquecer',
    targetPipes: 8,
    pipeSpeed: 168,
    gapHeight: 168,
    pipeSpacing: 278,
    maxDeltaY: 105,
    gravityMultiplier: 0.94,
    movingPipeChance: 0,
    movingAmplitude: 0,
    movingSpeed: 0,
    weather: 'clear',
    palette: {
      skyTop: '#5CC6F0',
      skyMid: '#ADE8F4',
      skyBottom: '#F2FAE2',
      orbColor: '#FEF9C3',
      orbGlow: 'rgba(254, 240, 138, 0.45)',
      hillFar: '#68B684',
      hillNear: '#40916C',
      waterTop: '#38A3A5',
      waterBottom: '#22577A',
      pipeLight: '#74C69D',
      pipeMid: '#40916C',
      pipeDark: '#1B4332',
      nightFactor: 0,
    },
  },
  {
    id: 2,
    name: 'Brisa da Manhã',
    subtitle: 'Voo mais ágil com brisa leve na lagoa',
    targetPipes: 10,
    pipeSpeed: 180,
    gapHeight: 160,
    pipeSpacing: 266,
    maxDeltaY: 130,
    gravityMultiplier: 0.97,
    movingPipeChance: 0,
    movingAmplitude: 0,
    movingSpeed: 0,
    weather: 'breeze',
    palette: {
      skyTop: '#38BDF8',
      skyMid: '#BAE6FD',
      skyBottom: '#ECFEFF',
      orbColor: '#FEF08A',
      orbGlow: 'rgba(254, 240, 138, 0.48)',
      hillFar: '#52B788',
      hillNear: '#2D6A4F',
      waterTop: '#2EC4B6',
      waterBottom: '#1B4965',
      pipeLight: '#80ED99',
      pipeMid: '#38A169',
      pipeDark: '#1B4332',
      nightFactor: 0,
    },
  },
  {
    id: 3,
    name: 'Vitória-Régia',
    subtitle: 'Canos mais próximos e saltos em cadência',
    targetPipes: 12,
    pipeSpeed: 192,
    gapHeight: 152,
    pipeSpacing: 254,
    maxDeltaY: 150,
    gravityMultiplier: 1.0,
    movingPipeChance: 0,
    movingAmplitude: 0,
    movingSpeed: 0,
    weather: 'clear',
    palette: {
      skyTop: '#48A9D6',
      skyMid: '#BDE0D6',
      skyBottom: '#FFE5AD',
      orbColor: '#FDE047',
      orbGlow: 'rgba(253, 224, 71, 0.45)',
      hillFar: '#5FA073',
      hillNear: '#377D5A',
      waterTop: '#2E8B8D',
      waterBottom: '#1B4965',
      pipeLight: '#6EE7B7',
      pipeMid: '#10B981',
      pipeDark: '#065F46',
      nightFactor: 0.08,
    },
  },
  {
    id: 4,
    name: 'Bambuzal Elevado',
    subtitle: 'Grandes subidas e descidas entre os bambus',
    targetPipes: 14,
    pipeSpeed: 202,
    gapHeight: 146,
    pipeSpacing: 248,
    maxDeltaY: 185,
    gravityMultiplier: 1.0,
    movingPipeChance: 0,
    movingAmplitude: 0,
    movingSpeed: 0,
    weather: 'breeze',
    palette: {
      skyTop: '#65A30D',
      skyMid: '#BEF264',
      skyBottom: '#FEF9C3',
      orbColor: '#FEF08A',
      orbGlow: 'rgba(250, 204, 21, 0.45)',
      hillFar: '#4D7C0F',
      hillNear: '#365314',
      waterTop: '#3F7D58',
      waterBottom: '#1B4332',
      pipeLight: '#A3E635',
      pipeMid: '#65A30D',
      pipeDark: '#365314',
      nightFactor: 0.05,
    },
  },
  {
    id: 5,
    name: 'Lago Dourado',
    subtitle: 'Atenção: os primeiros canos móveis aparecem',
    targetPipes: 15,
    pipeSpeed: 210,
    gapHeight: 142,
    pipeSpacing: 244,
    maxDeltaY: 165,
    gravityMultiplier: 1.01,
    movingPipeChance: 0.35,
    movingAmplitude: 24,
    movingSpeed: 1.5,
    weather: 'clear',
    palette: {
      skyTop: '#D97706',
      skyMid: '#F59E0B',
      skyBottom: '#FDE68A',
      orbColor: '#FFFBEB',
      orbGlow: 'rgba(254, 215, 170, 0.55)',
      hillFar: '#92400E',
      hillNear: '#78350F',
      waterTop: '#B45309',
      waterBottom: '#451A03',
      pipeLight: '#FCD34D',
      pipeMid: '#B45309',
      pipeDark: '#451A03',
      nightFactor: 0.25,
    },
  },
  {
    id: 6,
    name: 'Ventania no Brejo',
    subtitle: 'Folhas ao vento e obstáculos oscilantes',
    targetPipes: 16,
    pipeSpeed: 220,
    gapHeight: 138,
    pipeSpacing: 238,
    maxDeltaY: 175,
    gravityMultiplier: 1.02,
    movingPipeChance: 0.45,
    movingAmplitude: 30,
    movingSpeed: 1.75,
    weather: 'breeze',
    palette: {
      skyTop: '#4A5D94',
      skyMid: '#D98880',
      skyBottom: '#FCCF8A',
      orbColor: '#FED7AA',
      orbGlow: 'rgba(251, 146, 60, 0.45)',
      hillFar: '#4C6B62',
      hillNear: '#2D4F43',
      waterTop: '#3D6478',
      waterBottom: '#1F364D',
      pipeLight: '#5EEAD4',
      pipeMid: '#0F766E',
      pipeDark: '#134E4A',
      nightFactor: 0.48,
    },
  },
  {
    id: 7,
    name: 'Neblina da Serra',
    subtitle: 'Passagens estreitas sob a névoa fria',
    targetPipes: 18,
    pipeSpeed: 230,
    gapHeight: 132,
    pipeSpacing: 232,
    maxDeltaY: 185,
    gravityMultiplier: 1.03,
    movingPipeChance: 0.55,
    movingAmplitude: 32,
    movingSpeed: 1.9,
    weather: 'mist',
    palette: {
      skyTop: '#334155',
      skyMid: '#64748B',
      skyBottom: '#CBD5E1',
      orbColor: '#F1F5F9',
      orbGlow: 'rgba(226, 232, 240, 0.4)',
      hillFar: '#475569',
      hillNear: '#1E293B',
      waterTop: '#3B5266',
      waterBottom: '#0F172A',
      pipeLight: '#94A3B8',
      pipeMid: '#475569',
      pipeDark: '#1E293B',
      nightFactor: 0.6,
    },
  },
  {
    id: 8,
    name: 'Noite dos Vagalumes',
    subtitle: 'Céu estrelado e ritmo noturno acelerado',
    targetPipes: 20,
    pipeSpeed: 242,
    gapHeight: 128,
    pipeSpacing: 226,
    maxDeltaY: 190,
    gravityMultiplier: 1.04,
    movingPipeChance: 0.65,
    movingAmplitude: 36,
    movingSpeed: 2.05,
    weather: 'fireflies',
    palette: {
      skyTop: '#0F1E3A',
      skyMid: '#1E3A5F',
      skyBottom: '#2F6676',
      orbColor: '#F8FAFC',
      orbGlow: 'rgba(226, 232, 240, 0.28)',
      hillFar: '#1E453E',
      hillNear: '#14332A',
      waterTop: '#163C4D',
      waterBottom: '#0C2431',
      pipeLight: '#34D399',
      pipeMid: '#059669',
      pipeDark: '#064E3B',
      nightFactor: 0.95,
    },
  },
  {
    id: 9,
    name: 'Tempestade Tropical',
    subtitle: 'Chuva intensa, alta velocidade e precisão',
    targetPipes: 22,
    pipeSpeed: 254,
    gapHeight: 124,
    pipeSpacing: 220,
    maxDeltaY: 198,
    gravityMultiplier: 1.05,
    movingPipeChance: 0.78,
    movingAmplitude: 40,
    movingSpeed: 2.25,
    weather: 'rain',
    palette: {
      skyTop: '#0F172A',
      skyMid: '#1E293B',
      skyBottom: '#334155',
      orbColor: '#CBD5E1',
      orbGlow: 'rgba(148, 163, 184, 0.22)',
      hillFar: '#1E3A3A',
      hillNear: '#0F2929',
      waterTop: '#1E3A5F',
      waterBottom: '#0B132B',
      pipeLight: '#38BDF8',
      pipeMid: '#0369A1',
      pipeDark: '#0C4A6E',
      nightFactor: 0.9,
    },
  },
  {
    id: 10,
    name: 'Coroa do Lago',
    subtitle: 'Desafio final sob a aurora dourada',
    targetPipes: 25,
    pipeSpeed: 266,
    gapHeight: 120,
    pipeSpacing: 214,
    maxDeltaY: 205,
    gravityMultiplier: 1.06,
    movingPipeChance: 0.9,
    movingAmplitude: 42,
    movingSpeed: 2.4,
    weather: 'aurora',
    palette: {
      skyTop: '#1E1B4B',
      skyMid: '#312E81',
      skyBottom: '#0F766E',
      orbColor: '#FEF08A',
      orbGlow: 'rgba(250, 204, 21, 0.42)',
      hillFar: '#134E4A',
      hillNear: '#064E3B',
      waterTop: '#0F766E',
      waterBottom: '#1E1B4B',
      pipeLight: '#FDE047',
      pipeMid: '#CA8A04',
      pipeDark: '#713F12',
      nightFactor: 0.92,
    },
  },
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevelConfig(levelId: number): LevelConfig {
  const clamped = Math.max(1, Math.min(TOTAL_LEVELS, levelId));
  return LEVELS[clamped - 1];
}

export interface CampaignProgress {
  unlockedLevel: number;
  completedLevels: number[];
  endlessBestScore: number;
}

const PROGRESS_STORAGE_KEY = 'sapinho_voador_campaign_v1';
const LEGACY_BEST_SCORE_KEY = 'sapinho_voador_best_score';

export function loadProgress(): CampaignProgress {
  let legacyBest = 0;
  try {
    const rawLegacy = localStorage.getItem(LEGACY_BEST_SCORE_KEY);
    if (rawLegacy) {
      const parsed = parseInt(rawLegacy, 10);
      if (Number.isFinite(parsed) && parsed > 0) legacyBest = parsed;
    }
  } catch {
    // Ignore
  }

  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CampaignProgress>;
      const unlocked =
        typeof parsed.unlockedLevel === 'number'
          ? Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(parsed.unlockedLevel)))
          : 1;
      const completed = Array.isArray(parsed.completedLevels)
        ? parsed.completedLevels.filter(
            (n): n is number => typeof n === 'number' && n >= 1 && n <= TOTAL_LEVELS
          )
        : [];
      const endlessBest =
        typeof parsed.endlessBestScore === 'number' && parsed.endlessBestScore > 0
          ? Math.max(legacyBest, Math.floor(parsed.endlessBestScore))
          : legacyBest;
      return {
        unlockedLevel: unlocked,
        completedLevels: Array.from(new Set(completed)).sort((a, b) => a - b),
        endlessBestScore: endlessBest,
      };
    }
  } catch {
    // Ignore storage errors
  }

  return {
    unlockedLevel: 1,
    completedLevels: [],
    endlessBestScore: legacyBest,
  };
}

export function saveProgress(progress: CampaignProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    localStorage.setItem(LEGACY_BEST_SCORE_KEY, String(progress.endlessBestScore));
  } catch {
    // Ignore storage errors
  }
}
