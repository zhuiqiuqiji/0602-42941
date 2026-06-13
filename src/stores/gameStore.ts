import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FlightParams, FlightState, ScoreResult, Grade } from '@/types';
import { FOLDS, SCENES } from '@/config/gameConfig';

const STORAGE_KEY = 'paper_plane_high_scores';

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
    // ignore
  }
}

export function calcGrade(totalScore: number): Grade {
  if (totalScore >= 850) return 'S';
  if (totalScore >= 700) return 'A';
  if (totalScore >= 550) return 'B';
  if (totalScore >= 350) return 'C';
  return 'D';
}

export function calcScore(distance: number, airTime: number): { totalScore: number; grade: Grade } {
  const distanceScore = Math.min(500, Math.round(distance * 3.5));
  const airTimeScore = Math.min(500, Math.round(airTime * 28));
  const totalScore = Math.min(1000, distanceScore + airTimeScore);
  return { totalScore, grade: calcGrade(totalScore) };
}

export const useGameStore = defineStore('game', () => {
  const selectedSceneId = ref<string>(SCENES[0].id);
  const selectedFoldId = ref<string>(FOLDS[0].id);

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
    flightTime: 0,
    isLanded: false,
    trail: [],
  });

  const lastResult = ref<ScoreResult | null>(null);
  const highScores = ref<ScoreResult[]>(loadHighScores());

  const selectedScene = computed(() =>
    SCENES.find(s => s.id === selectedSceneId.value) || SCENES[0]
  );
  const selectedFold = computed(() =>
    FOLDS.find(f => f.id === selectedFoldId.value) || FOLDS[0]
  );
  const topScores = computed(() =>
    [...highScores.value].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10)
  );

  function setScene(id: string) {
    selectedSceneId.value = id;
  }
  function setFold(id: string) {
    selectedFoldId.value = id;
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
      positionY: 1.6,
      velocityX: initSpeed * Math.cos(angleRad),
      velocityY: initSpeed * Math.sin(angleRad),
      pitchAngle: params.throwAngle,
      flightTime: 0,
      isLanded: false,
      trail: [],
    };
  }
  function updateFlightState(patch: Partial<FlightState>) {
    flightState.value = { ...flightState.value, ...patch };
  }
  function recordResult(): ScoreResult {
    const distance = Math.round(flightState.value.positionX * 10) / 10;
    const airTime = Math.round(flightState.value.flightTime * 100) / 100;
    const { totalScore, grade } = calcScore(distance, airTime);
    const fold = selectedFold.value;
    const scene = selectedScene.value;
    const result: ScoreResult = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      distance,
      airTime,
      totalScore,
      grade,
      timestamp: Date.now(),
      foldId: fold.id,
      foldName: fold.name,
      sceneId: scene.id,
    };
    lastResult.value = result;
    highScores.value = [...highScores.value, result];
    saveHighScores(highScores.value);
    return result;
  }
  function clearHighScores() {
    highScores.value = [];
    saveHighScores([]);
  }

  return {
    selectedSceneId,
    selectedFoldId,
    flightParams,
    flightState,
    lastResult,
    highScores,
    selectedScene,
    selectedFold,
    topScores,
    setScene,
    setFold,
    updateParams,
    initFlight,
    updateFlightState,
    recordResult,
    clearHighScores,
  };
});
