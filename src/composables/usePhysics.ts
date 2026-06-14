import type { FlightParams, FlightState, PaperPlaneFold, WeatherCondition, WingProfile } from '@/types';

export interface PhysicsConfig {
  gravity: number;
  airDensity: number;
  wingArea: number;
  mass: number;
  dt: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 9.81,
  airDensity: 1.225,
  wingArea: 0.018,
  mass: 0.005,
  dt: 1 / 60,
};

export const WING_PROFILES: Record<string, WingProfile> = {
  flat: {
    id: 'flat',
    name: '平直翼',
    camber: 0,
    thicknessRatio: 0.02,
    aspectRatio: 2.5,
    sweepAngle: 0,
    tipShape: 'square',
    liftCurve: 0.9,
    dragPenalty: 0,
    stallAngle: 18,
  },
  cambered: {
    id: 'cambered',
    name: '弯度翼',
    camber: 0.08,
    thicknessRatio: 0.03,
    aspectRatio: 3.0,
    sweepAngle: 0,
    tipShape: 'round',
    liftCurve: 1.15,
    dragPenalty: 0.008,
    stallAngle: 16,
  },
  highAspect: {
    id: 'highAspect',
    name: '大展弦比',
    camber: 0.05,
    thicknessRatio: 0.025,
    aspectRatio: 4.5,
    sweepAngle: 0,
    tipShape: 'tapered',
    liftCurve: 1.25,
    dragPenalty: 0.004,
    stallAngle: 15,
  },
  delta: {
    id: 'delta',
    name: '三角翼',
    camber: 0.02,
    thicknessRatio: 0.04,
    aspectRatio: 1.5,
    sweepAngle: 35,
    tipShape: 'delta',
    liftCurve: 0.75,
    dragPenalty: 0.012,
    stallAngle: 28,
  },
  swept: {
    id: 'swept',
    name: '后掠翼',
    camber: 0.04,
    thicknessRatio: 0.03,
    aspectRatio: 2.8,
    sweepAngle: 20,
    tipShape: 'tapered',
    liftCurve: 0.95,
    dragPenalty: 0.006,
    stallAngle: 20,
  },
  symmetric: {
    id: 'symmetric',
    name: '对称翼',
    camber: 0,
    thicknessRatio: 0.035,
    aspectRatio: 3.2,
    sweepAngle: 5,
    tipShape: 'round',
    liftCurve: 0.85,
    dragPenalty: 0.005,
    stallAngle: 17,
  },
  supercritical: {
    id: 'supercritical',
    name: '超临界翼',
    camber: 0.03,
    thicknessRatio: 0.05,
    aspectRatio: 3.5,
    sweepAngle: 15,
    tipShape: 'tapered',
    liftCurve: 1.05,
    dragPenalty: 0.003,
    stallAngle: 19,
  },
  reflex: {
    id: 'reflex',
    name: '反弯翼',
    camber: -0.03,
    thicknessRatio: 0.025,
    aspectRatio: 3.8,
    sweepAngle: 0,
    tipShape: 'round',
    liftCurve: 0.8,
    dragPenalty: 0.006,
    stallAngle: 22,
  },
};

export function getWingProfile(profileId: string): WingProfile {
  return WING_PROFILES[profileId] || WING_PROFILES.flat;
}

export function computeLiftCoeff(fold: PaperPlaneFold, wingAngleDeg: number, pitchDeg: number, speed: number): { CL: number; stallDepth: number; effectiveAngle: number } {
  const profile = getWingProfile(fold.wingProfileId);
  const camberLift = profile.camber * 60;
  const effAngle = wingAngleDeg + pitchDeg + camberLift;
  const absEff = Math.abs(effAngle);
  const optimalAngle = profile.camber > 0 ? 12 : 10;
  const deviation = Math.abs(effAngle - optimalAngle);
  const gaussian = Math.exp(-(deviation * deviation) / (2 * 20 * 20));
  const stallAngle = profile.stallAngle;
  const preStallLift = Math.min(1, absEff / stallAngle);
  const stallDepth = absEff <= stallAngle ? 0 : Math.min(1, (absEff - stallAngle) / 35);
  const stallPenalty = absEff <= stallAngle
    ? 1
    : Math.max(0.25, 1 - 0.75 * Math.min(1, (absEff - stallAngle) / 30));
  const aspectRatioBoost = Math.min(1.35, 0.8 + profile.aspectRatio * 0.15);
  const reynoldsFactor = Math.min(1.1, 0.85 + speed * 0.015);
  const sweepLiftFactor = 1 - profile.sweepAngle * 0.004;
  const CL = fold.baseLiftCoeff * (0.35 + 0.95 * gaussian) * stallPenalty * profile.liftCurve * aspectRatioBoost * reynoldsFactor * sweepLiftFactor;
  return { CL, stallDepth, effectiveAngle: effAngle };
}

export function computeDragCoeff(
  fold: PaperPlaneFold,
  wingAngleDeg: number,
  pitchDeg: number,
  speed: number,
  liftCoeff: number
): number {
  const profile = getWingProfile(fold.wingProfileId);
  const baseDrag = fold.baseDragCoeff + profile.dragPenalty;
  const wingDrag = Math.abs(wingAngleDeg) / 50 * 0.04;
  const pitchDrag = (pitchDeg * pitchDeg) / (45 * 45) * 0.09;
  const absEff = Math.abs(wingAngleDeg + pitchDeg + profile.camber * 60);
  const stallAngle = profile.stallAngle;
  const stallDrag = absEff <= stallAngle
    ? 0
    : 0.25 * Math.min(1, (absEff - stallAngle) / 25);
  const inducedDrag = (liftCoeff * liftCoeff) / (Math.PI * profile.aspectRatio * 0.85);
  const sweepDragReduction = 1 - profile.sweepAngle * 0.0025;
  const skinFrictionDrag = baseDrag * (0.9 + 0.1 * Math.min(1, speed / 15));
  const totalDrag = skinFrictionDrag + wingDrag + pitchDrag + stallDrag + inducedDrag;
  return totalDrag * sweepDragReduction;
}

export function computeWeatherEffect(weather: WeatherCondition | undefined, altitude: number) {
  if (!weather) {
    return { windX: 0, windY: 0, densityFactor: 1, turbulence: 0, dragMult: 1, windShear: 0, thermalLift: 0 };
  }
  const windRad = (weather.windDirection * Math.PI) / 180;
  const baseWind = weather.windSpeed;
  const windX = Math.cos(windRad) * baseWind;
  const windY = Math.sin(windRad) * baseWind * 0.3;
  const tempFactor = (288.15 - 15 + weather.temperature) / 288.15;
  const humidityFactor = 1 - weather.humidity * 0.0006;
  const altitudeFactor = Math.max(0.7, 1 - altitude * 0.008);
  const densityFactor = (1 / tempFactor) * humidityFactor * altitudeFactor;
  let dragMult = 1;
  if (weather.precipitation === 'rain') dragMult = 1.18;
  if (weather.precipitation === 'snow') dragMult = 1.1;
  const windShear = weather.windGust > weather.windSpeed ? (weather.windGust - weather.windSpeed) * 0.3 : 0;
  const thermalLift = weather.temperature > 25 ? (weather.temperature - 25) * 0.08 : 0;
  return { windX, windY, densityFactor, turbulence: weather.turbulence, dragMult, windShear, thermalLift };
}

export function computeCgTorque(fold: PaperPlaneFold, pitchDeg: number, speed: number, pitchRate: number): number {
  const cgX = fold.centerOfGravity.x;
  const cgY = fold.centerOfGravity.y;
  const cgOffset = (cgX - 0.35) * 12;
  const restoringTorque = -cgOffset * pitchDeg * 0.018 * Math.min(1, speed * 0.8);
  const gravityTorque = cgY * 0.01;
  const pitchDamping = -pitchRate * 0.025 * Math.min(1.5, speed * 0.1);
  const inertialEffect = -pitchRate / fold.momentOfInertia * 0.002;
  return restoringTorque + gravityTorque + pitchDamping + inertialEffect;
}

export function updateAcrobatics(
  state: FlightState,
  prevPitch: number,
  dt: number
): NonNullable<FlightState['acrobatics']> {
  const ac = state.acrobatics || { loops: 0, rolls: 0, dives: 0, climbs: 0, maxPitchRate: 0, score: 0 };
  const pitchRate = Math.abs(state.pitchAngle - prevPitch) / dt;
  const prevRate = ac.maxPitchRate;
  let newScore = ac.score;
  let newLoops = ac.loops;
  let newRolls = ac.rolls;
  let newDives = ac.dives;
  let newClimbs = ac.climbs;
  if (pitchRate > 180 && state.pitchAngle * prevPitch < 0) {
    newLoops++;
    newScore += 150;
  }
  if (pitchRate > 300) {
    newRolls++;
    newScore += 100;
  }
  if (state.velocityY < -8 && state.pitchAngle < -30) {
    newDives++;
    newScore += 30 * dt * 10;
  }
  if (state.velocityY > 6 && state.pitchAngle > 30) {
    newClimbs++;
    newScore += 40 * dt * 10;
  }
  if (Math.abs(state.positionY - 1.6) < 0.3 && state.flightTime > 1 && !state.isLanded) {
    newScore += 20 * dt;
  }
  const speed = Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2);
  if (speed > 20 && state.flightTime > 0.5) {
    newScore += 5 * dt;
  }
  return {
    loops: newLoops,
    rolls: newRolls,
    dives: newDives,
    climbs: newClimbs,
    maxPitchRate: Math.max(prevRate, pitchRate),
    score: Math.round(newScore),
  };
}

export function stepPhysics(
  state: FlightState,
  params: FlightParams,
  fold: PaperPlaneFold,
  weather?: WeatherCondition,
  cfg: PhysicsConfig = DEFAULT_PHYSICS
): FlightState {
  if (state.isLanded) return state;

  const vx = state.velocityX;
  const vy = state.velocityY;
  const speed = Math.sqrt(vx * vx + vy * vy);
  const prevPitch = state.pitchAngle;
  const prevPitchRate = state.angularVelocity || 0;

  const profile = getWingProfile(fold.wingProfileId);
  const weatherEff = computeWeatherEffect(weather, state.positionY);

  const gustFactor = 1 + Math.sin(state.flightTime * 2.3) * weatherEff.windShear * 0.3;
  const relVx = vx - weatherEff.windX * gustFactor;
  const relVy = vy - weatherEff.windY * gustFactor + weatherEff.thermalLift * 0.5;
  const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

  let pitchAngle = state.pitchAngle;
  const pitchTarget = relSpeed > 0.2 ? (Math.atan2(relVy, relVx) * 180) / Math.PI : pitchAngle;
  const dampFactor = fold.baseStability * 2.0;
  const tailTorque = -params.tailAngle * 1.1 * fold.baseStability;
  const cgTorque = computeCgTorque(fold, pitchAngle, relSpeed, prevPitchRate);

  let turbJitter = 0;
  let turbLift = 0;
  if (weatherEff.turbulence > 0) {
    turbJitter = (Math.random() - 0.5) * weatherEff.turbulence * 8;
    turbLift = (Math.random() - 0.3) * weatherEff.turbulence * 0.5;
  }

  const pitchDelta = (pitchTarget - pitchAngle) * dampFactor + tailTorque + cgTorque + turbJitter;
  const angularAcc = pitchDelta * cfg.dt;
  const newAngularVelocity = prevPitchRate * 0.92 + angularAcc / cfg.dt;
  pitchAngle += newAngularVelocity * cfg.dt;
  if (pitchAngle > 85) pitchAngle = 85;
  if (pitchAngle < -85) pitchAngle = -85;

  const { CL, stallDepth } = computeLiftCoeff(fold, params.wingAngle, pitchAngle, relSpeed);
  const effectiveCL = CL + turbLift * 0.01;
  const CD = computeDragCoeff(fold, params.wingAngle, pitchAngle, relSpeed, effectiveCL) * weatherEff.dragMult;

  const dynPressure = 0.5 * cfg.airDensity * weatherEff.densityFactor * relSpeed * relSpeed * cfg.wingArea;
  const liftMag = dynPressure * effectiveCL;
  const dragMag = dynPressure * CD;

  let ax = 0;
  let ay = -cfg.gravity;

  if (relSpeed > 0.05) {
    const dirX = relVx / relSpeed;
    const dirY = relVy / relSpeed;
    const liftAngle = Math.atan2(dirY, dirX) + Math.PI / 2;
    const liftX = Math.cos(liftAngle) * liftMag;
    const liftY = Math.sin(liftAngle) * liftMag;
    const dragX = -dirX * dragMag;
    const dragY = -dirY * dragMag;
    ax += (liftX + dragX) / cfg.mass;
    ay += (liftY + dragY) / cfg.mass;
  }

  if (weatherEff.turbulence > 0) {
    ax += (Math.random() - 0.5) * weatherEff.turbulence * 2;
    ay += (Math.random() - 0.5) * weatherEff.turbulence * 1.5;
  }

  if (weatherEff.thermalLift > 0 && state.positionY > 2) {
    ay += Math.sin(state.flightTime * 1.5 + state.positionX * 0.5) * weatherEff.thermalLift * 0.3;
  }

  const sweepFactor = 1 - profile.sweepAngle * 0.0035;
  let nvx = vx + ax * cfg.dt * sweepFactor;
  let nvy = vy + ay * cfg.dt;

  const floorDrag = 0.0008;
  nvx *= 1 - floorDrag;
  nvy *= 1 - floorDrag * 0.3;

  let nx = state.positionX + nvx * cfg.dt;
  let ny = state.positionY + nvy * cfg.dt;

  let isLanded = false;
  if (ny <= 0) {
    ny = 0;
    isLanded = true;
    if (nvx > 0.05) {
      nx += nvx * cfg.dt * 0.6;
    }
    nvx *= 0.05;
    nvy = 0;
  }

  const newTrail = [...state.trail, { x: state.positionX, y: state.positionY }];
  if (newTrail.length > 180) newTrail.shift();

  const acrobatics = updateAcrobatics(
    { ...state, pitchAngle, velocityX: nvx, velocityY: nvy, positionX: nx, positionY: ny },
    prevPitch,
    cfg.dt
  );

  return {
    positionX: nx,
    positionY: ny,
    velocityX: nvx,
    velocityY: nvy,
    pitchAngle,
    pitchRate: Math.abs(pitchAngle - prevPitch) / cfg.dt,
    flightTime: state.flightTime + cfg.dt,
    isLanded,
    trail: newTrail,
    acrobatics,
    angularVelocity: newAngularVelocity,
    stallDepth,
  };
}

export function calcAcrobaticsScore(ac: NonNullable<FlightState['acrobatics']>): number {
  return Math.min(500, ac.score);
}
