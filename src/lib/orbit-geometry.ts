export const ORBIT_COORD_PRECISION = 4;

const FACTOR = 10 ** ORBIT_COORD_PRECISION;

export function formatCoord(value: number): string {
  return (Math.round(value * FACTOR) / FACTOR).toFixed(ORBIT_COORD_PRECISION);
}

export function formatPercent(value: number): string {
  return `${formatCoord(value)}%`;
}

export interface OrbitNodeGeometry {
  readonly x2: string;
  readonly y2: string;
  readonly left: string;
  readonly top: string;
}

export function orbitNodeGeometry(
  angleDeg: number,
  stageSize: number,
  ringRadius: number,
  nodeRadiusPercent: number,
): OrbitNodeGeometry {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x2: formatCoord(stageSize / 2 + ringRadius * cos),
    y2: formatCoord(stageSize / 2 + ringRadius * sin),
    left: formatPercent(50 + nodeRadiusPercent * cos),
    top: formatPercent(50 + nodeRadiusPercent * sin),
  };
}