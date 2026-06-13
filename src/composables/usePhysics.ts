import type { FlightParams, FlightState } from '@/types';
import type { PaperPlaneFold } from '@/types';

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

export function computeLiftCoeff(fold: PaperPlaneFold, wingAngleDeg: number, pitchDeg: number): number {
  const effAngle = wingAngleDeg + pitchDeg;
  const absEff = Math.abs(effAngle);
  const optimal = 15;
  const deviation = Math.abs(effAngle - optimal);
  const gaussian = Math.exp(-(deviation * deviation) / (2 * 18 * 18));
  const stallAngle = 20;
  const stallPenalty = absEff <= stallAngle
    ? 1
    : Math.max(0.2, 1 - 0.8 * Math.min(1, (absEff - stallAngle) / 30));
  return fold.baseLiftCoeff * (0.4 + 0.9 * gaussian) * stallPenalty;
}

export function computeDragCoeff(fold: PaperPlaneFold, wingAngleDeg: number, pitchDeg: number): number {
  const baseDrag = fold.baseDragCoeff;
  const wingDrag = Math.abs(wingAngleDeg) / 50 * 0.035;
  const pitchDrag = (pitchDeg * pitchDeg) / (45 * 45) * 0.08;
  const absEff = Math.abs(wingAngleDeg + pitchDeg);
  const stallAngle = 20;
  const stall = absEff <= stallAngle
    ? 0
    : 0.2 * Math.min(1, (absEff - stallAngle) / 25);
  return baseDrag + wingDrag + pitchDrag + stall;
}

export function stepPhysics(
  state: FlightState,
  params: FlightParams,
  fold: PaperPlaneFold,
  cfg: PhysicsConfig = DEFAULT_PHYSICS
): FlightState {
  if (state.isLanded) return state;

  const vx = state.velocityX;
  const vy = state.velocityY;
  const speed = Math.sqrt(vx * vx + vy * vy);

  let pitchAngle = state.pitchAngle;
  const pitchTarget = speed > 0.2 ? (Math.atan2(vy, vx) * 180) / Math.PI : pitchAngle;
  const dampFactor = fold.baseStability * 2.2;
  const tailTorque = -params.tailAngle * 0.9 * fold.baseStability;
  const pitchDelta = ((pitchTarget - pitchAngle) * dampFactor + tailTorque) * cfg.dt;
  pitchAngle += pitchDelta;
  if (pitchAngle > 85) pitchAngle = 85;
  if (pitchAngle < -85) pitchAngle = -85;

  const C_L = computeLiftCoeff(fold, params.wingAngle, pitchAngle);
  const C_D = computeDragCoeff(fold, params.wingAngle, pitchAngle);

  const dynPressure = 0.5 * cfg.airDensity * speed * speed * cfg.wingArea;
  const liftMag = dynPressure * C_L;
  const dragMag = dynPressure * C_D;

  let ax = 0;
  let ay = -cfg.gravity;

  if (speed > 0.05) {
    const dirX = vx / speed;
    const dirY = vy / speed;
    const liftX = -dirY * liftMag;
    const liftY = dirX * liftMag;
    const dragX = -dirX * dragMag;
    const dragY = -dirY * dragMag;
    ax += (liftX + dragX) / cfg.mass;
    ay += (liftY + dragY) / cfg.mass;
  }

  let nvx = vx + ax * cfg.dt;
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

  return {
    positionX: nx,
    positionY: ny,
    velocityX: nvx,
    velocityY: nvy,
    pitchAngle,
    flightTime: state.flightTime + cfg.dt,
    isLanded,
    trail: newTrail,
  };
}
