export type SceneType = 'outdoor' | 'indoor' | 'canyon' | 'balcony';

export interface Scene {
  id: string;
  name: string;
  type: SceneType;
  skyTop: string;
  skyBottom: string;
  groundColor: string;
  groundColor2: string;
  description: string;
  baseWindSpeed?: number;
  turbulence?: number;
  ceilingHeight?: number;
}

export interface WingProfile {
  id: string;
  name: string;
  camber: number;
  thicknessRatio: number;
  aspectRatio: number;
  sweepAngle: number;
  tipShape: 'round' | 'square' | 'tapered' | 'delta';
  liftCurve: number;
  dragPenalty: number;
  stallAngle: number;
}

export interface CenterOfGravity {
  x: number;
  y: number;
  massRatio: number;
}

export interface PaperPlaneFold {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: 'dart' | 'glider' | 'stunt' | 'distance' | 'acrobatic' | 'custom';
  difficulty?: 1 | 2 | 3 | 4 | 5;
  unlockCondition?: string;
  isUnlocked?: boolean;
  baseLiftCoeff: number;
  baseDragCoeff: number;
  baseStability: number;
  maxSpeedFactor: number;
  wingProfileId: string;
  customWingProfile?: WingProfile;
  centerOfGravity: CenterOfGravity;
  momentOfInertia: number;
  svgPath: string;
  stats: { lift: number; speed: number; stability: number; distance: number; acrobatics: number };
  bestScene?: string;
  foldingSteps?: number;
}

export interface CustomFoldDesign {
  id: string;
  name: string;
  wingProfile: Partial<WingProfile>;
  centerOfGravity: CenterOfGravity;
  wingSpan: number;
  bodyLength: number;
  dihedralAngle: number;
  paperWeight: number;
  createdAt: number;
}

export interface WeatherCondition {
  id: string;
  name: string;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  humidity: number;
  temperature: number;
  turbulence: number;
  precipitation: 'none' | 'rain' | 'snow';
  icon: string;
}

export type CompetitionMode = 'free' | 'distance' | 'airtime' | 'acrobatic';

export interface CompetitionRules {
  mode: CompetitionMode;
  rounds: number;
  timeLimitSec: number;
  minDistance?: number;
  scoring: {
    distanceWeight: number;
    airTimeWeight: number;
    acrobaticsWeight: number;
  };
}

export interface FlightParams {
  wingAngle: number;
  tailAngle: number;
  throwPower: number;
  throwAngle: number;
}

export interface AcrobaticsState {
  loops: number;
  rolls: number;
  dives: number;
  climbs: number;
  maxPitchRate: number;
  score: number;
}

export interface FlightState {
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  pitchAngle: number;
  pitchRate: number;
  flightTime: number;
  isLanded: boolean;
  trail: { x: number; y: number }[];
  acrobatics?: AcrobaticsState;
  angularVelocity?: number;
  stallDepth?: number;
}

export interface ScoreResult {
  id: string;
  distance: number;
  airTime: number;
  totalScore: number;
  acrobaticsScore?: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  timestamp: number;
  foldId: string;
  foldName: string;
  sceneId: string;
  weatherId?: string;
  competitionMode?: CompetitionMode;
  playerName?: string;
  isGlobal?: boolean;
  country?: string;
  round?: number;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
