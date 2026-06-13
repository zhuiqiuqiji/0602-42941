export interface Scene {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor';
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  groundColor2: string;
  description: string;
}

export interface PaperPlaneFold {
  id: string;
  name: string;
  description: string;
  baseLiftCoeff: number;
  baseDragCoeff: number;
  baseStability: number;
  maxSpeedFactor: number;
  svgPath: string;
  stats: {
    lift: number;
    speed: number;
    stability: number;
    distance: number;
  };
}

export interface FlightParams {
  wingAngle: number;
  tailAngle: number;
  throwPower: number;
  throwAngle: number;
}

export interface FlightState {
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  pitchAngle: number;
  flightTime: number;
  isLanded: boolean;
  trail: { x: number; y: number }[];
}

export interface ScoreResult {
  id: string;
  distance: number;
  airTime: number;
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  timestamp: number;
  foldId: string;
  foldName: string;
  sceneId: string;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
