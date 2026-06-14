import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FlightParams, FlightState, ScoreResult, Grade, CompetitionMode, CustomFoldDesign, PaperPlaneFold, WeatherCondition, WingProfile } from '@/types';
import { FOLDS, SCENES, WEATHERS, GLOBAL_LEADERBOARD_SEED } from '@/config/gameConfig';
import { calcAcrobaticsScore, WING_PROFILES } from '@/composables/usePhysics';

const STORAGE_KEY = 'paper_plane_high_scores';
const CUSTOM_FOLDS_KEY = 'paper_plane_custom_folds';
const PLAYER_NAME_KEY = 'paper_plane_player_name';

function loadHighScores(): ScoreResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHighScores(scores: ScoreResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
  }
}

function loadCustomFolds(): CustomFoldDesign[] {
  try {
    const data = localStorage.getItem(CUSTOM_FOLDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCustomFolds(folds: CustomFoldDesign[]) {
  try {
    localStorage.setItem(CUSTOM_FOLDS_KEY, JSON.stringify(folds));
  } catch {
  }
}

export function calcGrade(totalScore: number): Grade {
  if (totalScore >= 850) return 'S';
  if (totalScore >= 700) return 'A';
  if (totalScore >= 550) return 'B';
  if (totalScore >= 350) return 'C';
  return 'D';
}

export function calcScore(
  distance: number,
  airTime: number,
  acrobaticsScore: number = 0,
  mode: CompetitionMode = 'free'
): { totalScore: number; grade: Grade; distanceScore: number; airTimeScore: number; acrobaticsScore: number } {
  const distanceScore = Math.min(500, Math.round(distance * 3.5));
  const airTimeScore = Math.min(500, Math.round(airTime * 28));
  let totalScore = 0;
  if (mode === 'distance') {
    totalScore = distanceScore;
  } else if (mode === 'airtime') {
    totalScore = airTimeScore;
  } else if (mode === 'acrobatic') {
    totalScore = Math.round(distanceScore * 0 + airTimeScore * 0.3 + acrobaticsScore * 0.7);
  } else {
    totalScore = Math.min(1000, distanceScore + airTimeScore);
  }
  return { totalScore, grade: calcGrade(totalScore), distanceScore, airTimeScore, acrobaticsScore };
}

function customFoldToPlaneFold(design: CustomFoldDesign): PaperPlaneFold {
  const aspectRatio = design.wingProfile.aspectRatio || 2.5;
  const camber = design.wingProfile.camber || 0.05;
  const sweepAngle = design.wingProfile.sweepAngle || 10;
  const thicknessRatio = design.wingProfile.thicknessRatio || 0.03;
  const tipShape = (design.wingProfile.tipShape as WingProfile['tipShape']) || 'square';

  const liftCurve = 0.7 + camber * 3 + (aspectRatio - 2) * 0.15;
  const dragPenalty = thicknessRatio * 0.2 + Math.abs(sweepAngle - 15) * 0.0003;
  const stallAngle = 18 - Math.abs(camber) * 40 - sweepAngle * 0.2 + thicknessRatio * 50;

  const customWingProfile: WingProfile = {
    id: `custom-${design.id}`,
    name: design.name,
    camber,
    thicknessRatio,
    aspectRatio,
    sweepAngle,
    tipShape,
    liftCurve: Math.max(0.5, Math.min(1.5, liftCurve)),
    dragPenalty: Math.max(0, Math.min(0.03, dragPenalty)),
    stallAngle: Math.max(10, Math.min(35, stallAngle)),
  };

  const wingFactor = aspectRatio / 3;
  const liftCoeff = 0.4 * wingFactor + 0.2 * camber * 10;
  const dragCoeff = 0.03 + 0.02 * (design.paperWeight / 80) + dragPenalty;
  const stability = 0.6 + 0.8 * Math.abs(design.centerOfGravity.x - 0.5);
  const speedFactor = 0.8 + 0.4 * (design.bodyLength / 18) - sweepAngle * 0.004;

  return {
    id: design.id,
    name: design.name,
    description: '自定义折法',
    category: 'custom',
    difficulty: 3,
    baseLiftCoeff: Math.max(0.3, Math.min(0.9, liftCoeff)),
    baseDragCoeff: Math.max(0.015, Math.min(0.07, dragCoeff)),
    baseStability: Math.max(0.2, Math.min(1.4, stability)),
    maxSpeedFactor: Math.max(0.6, Math.min(1.6, speedFactor)),
    wingProfileId: 'flat',
    customWingProfile,
    centerOfGravity: design.centerOfGravity,
    momentOfInertia: 0.08,
    svgPath: 'M0,20 L80,18 L95,20 L80,22 L0,20 Z M80,18 L95,10 L95,20 Z M80,22 L95,30 L95,20 Z M40,20 L55,5 L65,20 Z M40,20 L55,35 L65,20 Z',
    stats: {
      lift: Math.round(Math.min(100, liftCoeff * 120)),
      speed: Math.round(Math.min(100, speedFactor * 80)),
      stability: Math.round(Math.min(100, stability * 80)),
      distance: Math.round(Math.min(100, (1 - dragCoeff * 10) * 100)),
      acrobatics: Math.round(Math.min(100, (1 - stability) * 100)),
    },
  };
}

export const useGameStore = defineStore('game', () => {
  const selectedSceneId = ref<string>(SCENES[0].id);
  const selectedFoldId = ref<string>(FOLDS[0].id);
  const selectedWeatherId = ref<string>(WEATHERS[0].id);
  const competitionMode = ref<CompetitionMode>('free');
  const currentRound = ref<number>(1);
  const playerName = ref<string>(localStorage.getItem(PLAYER_NAME_KEY) || '玩家');

  const flightParams = ref<FlightParams>({
    wingAngle: 8,
    tailAngle: 0,
    throwPower: 75,
    throwAngle: 35,
  });

  const flightState = ref<FlightState>({
    positionX: 0,
    positionY: 1.6,
    velocityX: 0,
    velocityY: 0,
    pitchAngle: 0,
    pitchRate: 0,
    flightTime: 0,
    isLanded: false,
    trail: [],
    acrobatics: { loops: 0, rolls: 0, dives: 0, climbs: 0, maxPitchRate: 0, score: 0 },
    angularVelocity: 0,
  });

  const lastResult = ref<ScoreResult | null>(null);
  const highScores = ref<ScoreResult[]>(loadHighScores());
  const customFoldDesigns = ref<CustomFoldDesign[]>(loadCustomFolds());
  const competitionRoundResults = ref<ScoreResult[]>([]);
  const competitionBestResult = ref<ScoreResult | null>(null);

  const selectedScene = computed(() =>
    SCENES.find(s => s.id === selectedSceneId.value) || SCENES[0]
  );

  const allFolds = computed<PaperPlaneFold[]>(() => {
    const customs = customFoldDesigns.value.map(customFoldToPlaneFold);
    return [...FOLDS, ...customs];
  });

  const selectedFold = computed(() =>
    allFolds.value.find(f => f.id === selectedFoldId.value) || allFolds.value[0]
  );

  const selectedWeather = computed(() =>
    WEATHERS.find(w => w.id === selectedWeatherId.value) || WEATHERS[0]
  );

  const topScores = computed(() =>
    [...highScores.value].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10)
  );

  function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function getDailySeed(): number {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }

  function generateDynamicLeaderboard(): ScoreResult[] {
    const dailySeed = getDailySeed();
    const basePlayers = GLOBAL_LEADERBOARD_SEED.map((s, i) => {
      const seed = dailySeed + i * 137;
      const scoreVariation = (seededRandom(seed) - 0.5) * 40;
      const distVariation = (seededRandom(seed + 1) - 0.5) * 6;
      const timeVariation = (seededRandom(seed + 2) - 0.5) * 1.2;
      const acroVariation = Math.round((seededRandom(seed + 3) - 0.5) * 30);
      const newScore = Math.max(500, Math.round(s.totalScore + scoreVariation));
      const grades: ScoreResult['grade'][] = ['S', 'A', 'B', 'C', 'D'];
      const gradeIdx = Math.min(4, Math.max(0, Math.floor((1000 - newScore) / 120)));
      return {
        id: `global-${i}`,
        distance: Math.max(10, s.distance + distVariation),
        airTime: Math.max(3, s.airTime + timeVariation),
        totalScore: newScore,
        acrobaticsScore: Math.max(0, (s.acrobaticsScore || 0) + acroVariation),
        grade: grades[gradeIdx],
        timestamp: Date.now() - i * 86400000 - Math.round(seededRandom(seed + 4) * 86400000),
        foldId: '',
        foldName: s.foldName,
        sceneId: '',
        playerName: s.playerName,
        country: s.country,
        isGlobal: true,
      } as ScoreResult;
    });

    const extraNames = [
      'WindWalker', 'SkyDreamer', 'PaperPilot', 'CloudChaser', 'GlideMaster',
      'WingDesigner', 'ThrowKing', 'Airborne', 'SoarHigh', 'FloatOn',
      '纸飞机达人', '飞行少年', '云端漫步', '风之子', '蓝天翱翔',
      'AeroDynamic', 'Velocity', 'LiftOff', 'LoopMaster', 'DiveBomber'
    ];
    const countries = ['🇺🇸', '🇯🇵', '🇩🇪', '🇫🇷', '🇬🇧', '🇨🇦', '🇦🇺', '🇧🇷', '🇰🇷', '🇨🇳'];
    const folds = ['经典飞镖', '滑翔机', '世界纪录', '特技旋风', '宽翼大鹏'];
    const extraPlayers: ScoreResult[] = [];

    for (let i = 0; i < 12; i++) {
      const seed = dailySeed + 1000 + i * 97;
      const baseScore = 580 + i * 8;
      const scoreVariation = (seededRandom(seed) - 0.5) * 60;
      const totalScore = Math.max(500, Math.round(baseScore + scoreVariation));
      const distance = 25 + (20 - i) * 2 + (seededRandom(seed + 1) - 0.5) * 8;
      const airTime = 6 + (20 - i) * 0.4 + (seededRandom(seed + 2) - 0.5) * 1;
      const acrobaticsScore = Math.round(seededRandom(seed + 3) * 350);
      const grades: ScoreResult['grade'][] = ['S', 'A', 'B', 'C', 'D'];
      const gradeIdx = Math.min(4, Math.max(0, Math.floor((1000 - totalScore) / 120)));
      extraPlayers.push({
        id: `global-extra-${i}`,
        distance: Math.max(10, distance),
        airTime: Math.max(3, airTime),
        totalScore,
        acrobaticsScore,
        grade: grades[gradeIdx],
        timestamp: Date.now() - (15 + i) * 86400000,
        foldId: '',
        foldName: folds[Math.floor(seededRandom(seed + 4) * folds.length)],
        sceneId: '',
        playerName: extraNames[i % extraNames.length],
        country: countries[Math.floor(seededRandom(seed + 5) * countries.length)],
        isGlobal: true,
      } as ScoreResult);
    }

    return [...basePlayers, ...extraPlayers].sort((a, b) => b.totalScore - a.totalScore).slice(0, 30);
  }

  const globalLeaderboard = computed<ScoreResult[]>(() => {
    const globalPlayers = generateDynamicLeaderboard();
    const myBest = highScores.value
      .filter(s => s.totalScore >= 600)
      .map(s => ({ ...s, isGlobal: false, playerName: playerName.value, country: '🏠' }));
    return [...globalPlayers, ...myBest].sort((a, b) => b.totalScore - a.totalScore).slice(0, 30);
  });

  function setPlayerName(name: string) {
    playerName.value = name;
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }

  function setScene(id: string) {
    selectedSceneId.value = id;
  }
  function setFold(id: string) {
    selectedFoldId.value = id;
  }
  function setWeather(id: string) {
    selectedWeatherId.value = id;
  }
  function setCompetitionMode(mode: CompetitionMode) {
    competitionMode.value = mode;
    currentRound.value = 1;
    competitionRoundResults.value = [];
    competitionBestResult.value = null;
  }
  function nextRound() {
    currentRound.value++;
  }

  function updateParams(patch: Partial<FlightParams>) {
    flightParams.value = { ...flightParams.value, ...patch };
  }

  function initFlight() {
    const fold = selectedFold.value;
    const params = flightParams.value;
    const initSpeed = (params.throwPower / 100) * 28 * fold.maxSpeedFactor;
    const angleRad = (params.throwAngle * Math.PI) / 180;
    flightState.value = {
      positionX: 0,
      positionY: selectedScene.value.type === 'balcony' ? 12 : 1.6,
      velocityX: initSpeed * Math.cos(angleRad),
      velocityY: initSpeed * Math.sin(angleRad),
      pitchAngle: params.throwAngle,
      pitchRate: 0,
      flightTime: 0,
      isLanded: false,
      trail: [],
      acrobatics: { loops: 0, rolls: 0, dives: 0, climbs: 0, maxPitchRate: 0, score: 0 },
      angularVelocity: 0,
    };
  }

  function updateFlightState(patch: Partial<FlightState>) {
    flightState.value = { ...flightState.value, ...patch };
  }

  function recordResult(): ScoreResult {
    const distance = Math.round(flightState.value.positionX * 10) / 10;
    const airTime = Math.round(flightState.value.flightTime * 100) / 100;
    const acroScore = flightState.value.acrobatics ? calcAcrobaticsScore(flightState.value.acrobatics) : 0;
    const { totalScore, grade } = calcScore(distance, airTime, acroScore, competitionMode.value);
    const fold = selectedFold.value;
    const result: ScoreResult = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      distance,
      airTime,
      totalScore,
      acrobaticsScore: acroScore,
      grade,
      timestamp: Date.now(),
      foldId: fold.id,
      foldName: fold.name,
      sceneId: selectedScene.value.id,
      weatherId: selectedWeather.value.id,
      competitionMode: competitionMode.value,
      playerName: playerName.value,
      round: currentRound.value,
    };
    lastResult.value = result;
    highScores.value = [...highScores.value, result];
    saveHighScores(highScores.value);

    if (competitionMode.value !== 'free') {
      competitionRoundResults.value = [...competitionRoundResults.value, result];
      if (!competitionBestResult.value || result.totalScore > competitionBestResult.value.totalScore) {
        competitionBestResult.value = result;
      }
    }

    return result;
  }

  function clearHighScores() {
    highScores.value = [];
    saveHighScores([]);
  }

  function saveCustomFold(design: CustomFoldDesign) {
    const existing = customFoldDesigns.value.findIndex(f => f.id === design.id);
    if (existing >= 0) {
      customFoldDesigns.value[existing] = design;
    } else {
      customFoldDesigns.value.push(design);
    }
    saveCustomFolds(customFoldDesigns.value);
  }

  function deleteCustomFold(id: string) {
    customFoldDesigns.value = customFoldDesigns.value.filter(f => f.id !== id);
    saveCustomFolds(customFoldDesigns.value);
    if (selectedFoldId.value === id) {
      selectedFoldId.value = FOLDS[0].id;
    }
  }

  return {
    selectedSceneId,
    selectedFoldId,
    selectedWeatherId,
    competitionMode,
    currentRound,
    playerName,
    flightParams,
    flightState,
    lastResult,
    highScores,
    customFoldDesigns,
    competitionRoundResults,
    competitionBestResult,
    selectedScene,
    selectedFold,
    allFolds,
    selectedWeather,
    topScores,
    globalLeaderboard,
    setPlayerName,
    setScene,
    setFold,
    setWeather,
    setCompetitionMode,
    nextRound,
    updateParams,
    initFlight,
    updateFlightState,
    recordResult,
    clearHighScores,
    saveCustomFold,
    deleteCustomFold,
  };
});
