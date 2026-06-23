import type { FigureSpec, FigurePrimitive } from '../types/quiz';

/**
 * Generates curve points for a curve preset based on domain and range.
 * file_path: src/lib/figurePresets.ts:6
 */
export function generateCurvePoints(
  preset: 'ppf' | 'indifference' | 'isoquant_l' | 'isocost',
  domain: [number, number],
  range: [number, number],
  presetParams?: Record<string, number>
): [number, number][] {
  const xMin = domain[0];
  const xMax = domain[1];
  const yMin = range[0];
  const yMax = range[1];
  const width = xMax - xMin;
  const height = yMax - yMin;

  const points: [number, number][] = [];
  const steps = 30;

  switch (preset) {
    case 'ppf': {
      // Concave curve: y = yMin + height * sqrt(1 - ((x - xMin) / width)^2)
      // Custom params can adjust xMax or yMax values if provided
      const cxMax = presetParams?.xMax ?? xMax;
      const cyMax = presetParams?.yMax ?? yMax;
      const cWidth = cxMax - xMin;
      const cHeight = cyMax - yMin;

      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * cWidth;
        if (x > cxMax) break;
        const ratio = (x - xMin) / cWidth;
        const y = yMin + cHeight * Math.sqrt(Math.max(0, 1 - ratio * ratio));
        points.push([x, y]);
      }
      break;
    }
    case 'indifference': {
      // Convex curve: y = yMin + K / (x - xMin + eps)
      // Cobb-Douglas style tangency or standard curve
      const K = presetParams?.utility ?? (0.16 * width * height);
      const xStart = xMin + width * 0.1;
      const xEnd = xMin + width * 0.9;

      for (let i = 0; i <= steps; i++) {
        const x = xStart + (i / steps) * (xEnd - xStart);
        const denom = x - xMin;
        if (denom === 0) continue;
        const y = yMin + K / denom;
        if (y <= yMax) {
          points.push([x, y]);
        }
      }
      break;
    }
    case 'isoquant_l': {
      // L-shaped Leontief: corner at (x0, y0)
      const x0 = presetParams?.x0 ?? (xMin + width * 0.4);
      const y0 = presetParams?.y0 ?? (yMin + height * 0.4);
      points.push([x0, yMax]);
      points.push([x0, y0]);
      points.push([xMax, y0]);
      break;
    }
    case 'isocost': {
      // Linear cost: straight line from (xMin, yMax * 0.8) to (xMax * 0.8, yMin)
      const x0 = presetParams?.xIntercept ?? (xMin + width * 0.8);
      const y0 = presetParams?.yIntercept ?? (yMin + height * 0.8);
      points.push([xMin, y0]);
      points.push([x0, yMin]);
      break;
    }
  }

  return points;
}

/**
 * Expands a high-level preset into a list of SVG figure primitives.
 * file_path: src/lib/figurePresets.ts:80
 */
export function expandPreset(spec: FigureSpec): FigurePrimitive[] {
  const domain = spec.domain ?? [0, 100];
  const range = spec.range ?? [0, 100];
  const xMin = domain[0];
  const xMax = domain[1];
  const yMin = range[0];
  const yMax = range[1];
  const width = xMax - xMin;
  const height = yMax - yMin;

  const primitives: FigurePrimitive[] = [];

  switch (spec.preset) {
    case 'supply_demand': {
      const params = spec.presetParams ?? {};
      const demandA = params.demandA ?? (yMin + height * 0.85); // P-intercept of Demand
      const demandB = params.demandB ?? 1.0;                     // Slope of Demand
      const supplyA = params.supplyA ?? (yMin + height * 0.05); // P-intercept of Supply
      const supplyB = params.supplyB ?? 1.0;                     // Slope of Supply

      // Solve Q: demandA - demandB * Q = supplyA + supplyB * Q
      // Q = (demandA - supplyA) / (demandB + supplyB)
      const denom = demandB + supplyB;
      const eqQ = denom > 0 ? (demandA - supplyA) / denom : xMin + width * 0.5;
      const eqP = demandA - demandB * eqQ;

      // Consumer Surplus (CS) Region
      primitives.push({
        kind: 'region',
        vertices: [[xMin, eqP], [xMin, demandA], [eqQ, eqP]],
        semantic: 'consumer_surplus'
      });

      // Producer Surplus (PS) Region
      primitives.push({
        kind: 'region',
        vertices: [[xMin, supplyA], [xMin, eqP], [eqQ, eqP]],
        semantic: 'producer_surplus'
      });

      // Demand Line
      // Max Q where P = 0 => Q = demandA / demandB
      const maxQ = demandB > 0 ? demandA / demandB : xMax;
      primitives.push({
        kind: 'line',
        from: [xMin, demandA],
        to: [Math.min(xMax, maxQ), demandB > 0 ? Math.max(yMin, demandA - demandB * Math.min(xMax, maxQ)) : yMin],
        label: 'D',
        color: 'var(--demand-color, #1d4ed8)',
        id: 'demand'
      });

      // Supply Line
      primitives.push({
        kind: 'line',
        from: [xMin, supplyA],
        to: [xMax, Math.min(yMax, supplyA + supplyB * (xMax - xMin))],
        label: 'S',
        color: 'var(--supply-color, #dc2626)',
        id: 'supply'
      });

      // Equilibrium Point E
      primitives.push({
        kind: 'point',
        at: [eqQ, eqP],
        label: 'E',
        labelPos: 'ne',
        dashed: true
      });

      // Price and Quantity labels
      primitives.push({
        kind: 'point',
        at: [xMin, eqP],
        label: 'P*',
        labelPos: 'nw'
      });

      primitives.push({
        kind: 'point',
        at: [eqQ, yMin],
        label: 'Q*',
        labelPos: 'se'
      });

      break;
    }

    case 'ppf': {
      const params = spec.presetParams ?? {};
      const cxMax = params.xMax ?? (xMin + width * 0.8);
      const cyMax = params.yMax ?? (yMin + height * 0.8);

      // Generate PPF curve points
      const ppfPoints: [number, number][] = [];
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (cxMax - xMin);
        const ratio = (x - xMin) / (cxMax - xMin);
        const y = yMin + (cyMax - yMin) * Math.sqrt(Math.max(0, 1 - ratio * ratio));
        ppfPoints.push([x, y]);
      }

      // Curve PPF
      primitives.push({
        kind: 'curve',
        points: ppfPoints,
        label: 'PPF',
        color: 'var(--curve-color, #7c3aed)',
        id: 'ppf'
      });

      // Standard PPF efficient/inefficient points
      // A: Efficient (on the curve)
      const qA = xMin + (cxMax - xMin) * 0.6;
      const ratioA = (qA - xMin) / (cxMax - xMin);
      const pA = yMin + (cyMax - yMin) * Math.sqrt(Math.max(0, 1 - ratioA * ratioA));
      primitives.push({
        kind: 'point',
        at: [qA, pA],
        label: 'A (Hiệu quả)',
        labelPos: 'ne',
        dashed: true
      });

      // B: Inefficient (inside)
      primitives.push({
        kind: 'point',
        at: [xMin + (cxMax - xMin) * 0.3, yMin + (cyMax - yMin) * 0.3],
        label: 'B (Kém)',
        labelPos: 'sw'
      });

      // C: Unobtainable (outside)
      primitives.push({
        kind: 'point',
        at: [xMin + (cxMax - xMin) * 0.8, yMin + (cyMax - yMin) * 0.8],
        label: 'C (Không đạt)',
        labelPos: 'ne'
      });

      break;
    }

    case 'indifference_budget': {
      const params = spec.presetParams ?? {};
      const I = params.I ?? 80;
      const Px = params.Px ?? 1;
      const Py = params.Py ?? 2;

      const xIntercept = Px > 0 ? I / Px : xMax;
      const yIntercept = Py > 0 ? I / Py : yMax;

      const optX = Px > 0 ? I / (2 * Px) : xMin + width * 0.5;
      const optY = Py > 0 ? I / (2 * Py) : yMin + height * 0.5;
      const utilityK = optX * optY;

      // Budget Line
      primitives.push({
        kind: 'line',
        from: [xMin, yIntercept],
        to: [xIntercept, yMin],
        label: 'Ngân sách',
        color: 'var(--budget-color, #059669)',
        id: 'budget'
      });

      // Generate Indifference curve points tangent to the budget line at (optX, optY)
      const indifPoints: [number, number][] = [];
      const steps = 30;
      const xStart = xMin + width * 0.15;
      const xEnd = xMin + width * 0.95;
      for (let i = 0; i <= steps; i++) {
        const x = xStart + (i / steps) * (xEnd - xStart);
        const denom = x - xMin;
        if (denom === 0) continue;
        const y = yMin + utilityK / denom;
        if (y <= yMax) {
          indifPoints.push([x, y]);
        }
      }

      // Indifference curve tangent to budget line
      primitives.push({
        kind: 'curve',
        points: indifPoints,
        label: 'U',
        color: 'var(--curve-color, #7c3aed)',
        id: 'indifference'
      });

      // Tangency Point T
      primitives.push({
        kind: 'point',
        at: [optX, optY],
        label: 'T',
        labelPos: 'ne',
        dashed: true
      });

      // Boundary intercept labels
      primitives.push({
        kind: 'point',
        at: [xIntercept, yMin],
        label: `${Math.round(xIntercept)}`,
        labelPos: 'se'
      });

      primitives.push({
        kind: 'point',
        at: [xMin, yIntercept],
        label: `${Math.round(yIntercept)}`,
        labelPos: 'nw'
      });

      break;
    }

    case 'cost_curves': {
      // MC = 0.04 * (q - 25)^2 + 8
      // AVC = 0.015 * (q - 40)^2 + 17
      // ATC = AVC + 240/q
      const mcPoints: [number, number][] = [];
      const avcPoints: [number, number][] = [];
      const atcPoints: [number, number][] = [];

      for (let q = 10; q <= 80; q += 2.5) {
        const mc = 0.04 * Math.pow(q - 25, 2) + 8;
        const avc = 0.015 * Math.pow(q - 40, 2) + 17;
        const atc = avc + 240 / q;

        if (mc <= yMax) mcPoints.push([q, mc]);
        if (avc <= yMax) avcPoints.push([q, avc]);
        if (atc <= yMax) atcPoints.push([q, atc]);
      }

      primitives.push({
        kind: 'curve',
        points: mcPoints,
        label: 'MC',
        color: 'var(--supply-color, #dc2626)',
        id: 'mc'
      });

      primitives.push({
        kind: 'curve',
        points: avcPoints,
        label: 'AVC',
        color: 'var(--budget-color, #059669)',
        id: 'avc'
      });

      primitives.push({
        kind: 'curve',
        points: atcPoints,
        label: 'ATC',
        color: 'var(--demand-color, #1d4ed8)',
        id: 'atc'
      });

      // Points of intersections (min AVC and min ATC)
      // MC intersects AVC at Q = 40, P = 17
      primitives.push({
        kind: 'point',
        at: [40, 17],
        label: 'A (min AVC)',
        labelPos: 'se',
        dashed: true
      });

      // MC intersects ATC at Q ~ 44, P ~ 22.5
      primitives.push({
        kind: 'point',
        at: [44, 22.5],
        label: 'B (min ATC)',
        labelPos: 'ne',
        dashed: true
      });

      break;
    }

    case 'monopoly': {
      const params = spec.presetParams ?? {};
      const demandA = params.demandA ?? 80;
      const demandB = params.demandB ?? 0.8;
      const supplyA = params.supplyA ?? 10; // MC intercept
      const supplyB = params.supplyB ?? 0.4; // MC slope

      // Q_m where MR = MC => demandA - 2*demandB * Q = supplyA + supplyB * Q
      // Q_m = (demandA - supplyA) / (2 * demandB + supplyB)
      const qm = (demandA - supplyA) / (2 * demandB + supplyB);
      const pmc = supplyA + supplyB * qm;
      const pm = demandA - demandB * qm;

      // Monopoly profit region (rectangle [0, qm] x [pmc, pm])
      primitives.push({
        kind: 'region',
        vertices: [[xMin, pmc], [xMin, pm], [qm, pm], [qm, pmc]],
        semantic: 'profit'
      });

      // Demand Line D
      const dQMax = demandB > 0 ? demandA / demandB : xMax;
      primitives.push({
        kind: 'line',
        from: [xMin, demandA],
        to: [Math.min(xMax, dQMax), demandB > 0 ? Math.max(yMin, demandA - demandB * Math.min(xMax, dQMax)) : yMin],
        label: 'D',
        color: 'var(--demand-color, #1d4ed8)',
        id: 'demand'
      });

      // MR Line
      const mrQMax = demandB > 0 ? demandA / (2 * demandB) : xMax;
      primitives.push({
        kind: 'line',
        from: [xMin, demandA],
        to: [Math.min(xMax, mrQMax), demandB > 0 ? Math.max(yMin, demandA - 2 * demandB * Math.min(xMax, mrQMax)) : yMin],
        label: 'MR',
        color: 'var(--curve-color, #7c3aed)',
        id: 'mr'
      });

      // MC Line
      primitives.push({
        kind: 'line',
        from: [xMin, supplyA],
        to: [xMax, Math.min(yMax, supplyA + supplyB * (xMax - xMin))],
        label: 'MC',
        color: 'var(--supply-color, #dc2626)',
        id: 'mc'
      });

      // MR = MC equilibrium point
      primitives.push({
        kind: 'point',
        at: [qm, pmc],
        label: 'E',
        labelPos: 'sw',
        dashed: true
      });

      // Monopoly Price point M
      primitives.push({
        kind: 'point',
        at: [qm, pm],
        label: 'M',
        labelPos: 'ne',
        dashed: true
      });

      // Label axes
      primitives.push({
        kind: 'point',
        at: [xMin, pm],
        label: 'Pm',
        labelPos: 'nw'
      });

      primitives.push({
        kind: 'point',
        at: [qm, yMin],
        label: 'Qm',
        labelPos: 'se'
      });

      break;
    }
  }

  return primitives;
}
