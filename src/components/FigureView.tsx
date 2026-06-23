import React, { useMemo } from 'react';
import type { FigureSpec, FigurePrimitive, FigurePoint, FigureCurve } from '../types/quiz';
import { expandPreset, generateCurvePoints } from '../lib/figurePresets';

interface FigureViewProps {
  spec: FigureSpec;
  className?: string;
}

/**
 * Functional component to render responsive SVG graphs for economics questions.
 * file_path: src/components/FigureView.tsx:11
 */
export const FigureView: React.FC<FigureViewProps> = ({ spec, className = '' }) => {
  const width = 450;
  const height = 380;
  const margin = { top: 30, right: 40, bottom: 40, left: 45 };

  const domain = spec.domain ?? [0, 100];
  const range = spec.range ?? [0, 100];

  const xMin = domain[0];
  const xMax = domain[1];
  const yMin = range[0];
  const yMax = range[1];

  // Helper scale functions
  const scaleX = (x: number) => {
    if (xMax === xMin) return margin.left;
    return margin.left + ((x - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
  };

  const scaleY = (y: number) => {
    if (yMax === yMin) return height - margin.bottom;
    return height - margin.bottom - ((y - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);
  };

  // Compile and merge presets + custom primitives
  const primitives = useMemo<FigurePrimitive[]>(() => {
    try {
      const presetPrims = spec.preset ? expandPreset(spec) : [];
      const userPrims = spec.primitives ?? [];
      return [...presetPrims, ...userPrims];
    } catch (err) {
      console.error('Error expanding preset:', err);
      return [];
    }
  }, [spec]);

  // Handle errors or division by zero in coordinate ranges
  const hasError = xMin >= xMax || yMin >= yMax || isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax);

  if (hasError) {
    return (
      <div className={`figure-container error ${className}`} style={{ maxWidth: 450, margin: '16px auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ border: '1px solid #fca5a5', borderRadius: 8, background: '#fef2f2' }}>
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#dc2626" fontSize="16px" fontWeight="bold">
            Đồ thị không hợp lệ (Lỗi dải dữ liệu)
          </text>
        </svg>
      </div>
    );
  }

  // Predefined colors
  const getPrimitiveColor = (prim: FigurePrimitive): string => {
    if ((prim.kind === 'line' || prim.kind === 'curve') && prim.color) return prim.color;
    if (prim.kind === 'line') {
      if (prim.id === 'demand') return 'var(--demand-color, #1d4ed8)';
      if (prim.id === 'supply') return 'var(--supply-color, #dc2626)';
      if (prim.id === 'budget') return 'var(--budget-color, #059669)';
      return 'var(--curve-color, #7c3aed)';
    }
    if (prim.kind === 'curve') {
      if (prim.id === 'mc') return 'var(--supply-color, #dc2626)';
      if (prim.id === 'avc') return 'var(--budget-color, #059669)';
      if (prim.id === 'atc') return 'var(--demand-color, #1d4ed8)';
      return 'var(--curve-color, #7c3aed)';
    }
    return '#374151';
  };

  const getRegionFill = (semantic: string | undefined): string => {
    switch (semantic) {
      case 'consumer_surplus':
        return 'var(--cs-fill, rgba(29, 78, 216, 0.15))';
      case 'producer_surplus':
        return 'var(--ps-fill, rgba(220, 38, 38, 0.15))';
      case 'deadweight_loss':
        return 'url(#diagonalHatch)';
      case 'profit':
        return 'var(--profit-fill, rgba(16, 185, 129, 0.15))';
      case 'loss':
        return 'var(--loss-fill, rgba(239, 68, 68, 0.15))';
      case 'welfare':
        return 'var(--welfare-fill, rgba(139, 92, 246, 0.15))';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  };

  // Get point label offset coordinates
  const getLabelOffset = (pos: string = 'ne') => {
    switch (pos) {
      case 'nw':
        return { dx: -8, dy: -8, textAnchor: 'end' as const };
      case 'se':
        return { dx: 8, dy: 14, textAnchor: 'start' as const };
      case 'sw':
        return { dx: -8, dy: 14, textAnchor: 'end' as const };
      case 'ne':
      default:
        return { dx: 8, dy: -8, textAnchor: 'start' as const };
    }
  };

  return (
    <div className={`figure-container ${className}`} style={{ maxWidth: 450, margin: '16px auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {spec.title && (
        <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: '1rem', color: 'var(--text-color, #1f2937)' }}>
          {spec.title}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="auto"
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e5e7eb)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <defs>
          {/* Axis Arrow Marker */}
          <marker
            id="axis-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--text-color, #374151)" />
          </marker>

          {/* Shift Arrow Head Marker */}
          <marker
            id="shift-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--arrow-color, #d97706)" />
          </marker>

          {/* Diagonal Hatching Pattern for Deadweight Loss */}
          <pattern
            id="diagonalHatch"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="var(--dwl-stroke, #9ca3af)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>

        {/* 1. Regions (CS, PS, Profit, Loss, DWL) - Draw first, so they are in the background */}
        {primitives
          .filter((p): p is Extract<FigurePrimitive, { kind: 'region' }> => p.kind === 'region')
          .map((region, idx) => {
            const pointsString = region.vertices
              .map(([vx, vy]) => `${scaleX(vx)},${scaleY(vy)}`)
              .join(' ');
            return (
              <polygon
                key={`region-${idx}`}
                points={pointsString}
                fill={getRegionFill(region.semantic)}
                stroke={region.semantic === 'deadweight_loss' ? 'var(--dwl-stroke, #9ca3af)' : 'none'}
                strokeWidth={region.semantic === 'deadweight_loss' ? 1 : 0}
              />
            );
          })}

        {/* 2. Projection lines for point coordinates (drawn under axes and labels) */}
        {primitives
          .filter((p): p is FigurePoint => p.kind === 'point' && !!p.dashed)
          .map((pt, idx) => {
            const px = scaleX(pt.at[0]);
            const py = scaleY(pt.at[1]);
            const ox = scaleX(xMin);
            const oy = scaleY(yMin);

            // Projection lines are only drawn if point is not exactly on the axis boundary
            const showXProj = pt.at[1] > yMin;
            const showYProj = pt.at[0] > xMin;

            return (
              <g key={`proj-${idx}`}>
                {showXProj && (
                  <line
                    x1={px}
                    y1={py}
                    x2={px}
                    y2={oy}
                    stroke="var(--text-muted, #9ca3af)"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                )}
                {showYProj && (
                  <line
                    x1={px}
                    y1={py}
                    x2={ox}
                    y2={py}
                    stroke="var(--text-muted, #9ca3af)"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                )}
              </g>
            );
          })}

        {/* 3. Coordinate Axes */}
        <g className="axes">
          {/* Origin label '0' */}
          <text
            x={scaleX(xMin) - 10}
            y={scaleY(yMin) + 14}
            fontSize="0.75rem"
            fill="var(--text-muted, #6b7280)"
            textAnchor="end"
          >
            0
          </text>

          {/* X Axis */}
          <line
            x1={scaleX(xMin)}
            y1={scaleY(yMin)}
            x2={scaleX(xMax) + 15}
            y2={scaleY(yMin)}
            stroke="var(--text-color, #374151)"
            strokeWidth="1.5"
            markerEnd="url(#axis-arrow)"
          />
          {/* X Axis Label */}
          <text
            x={scaleX(xMax) + 22}
            y={scaleY(yMin) + 4}
            fontSize="0.85rem"
            fontWeight="bold"
            fill="var(--text-color, #1f2937)"
            textAnchor="start"
          >
            {spec.xLabel ?? 'Q'}
          </text>

          {/* Y Axis */}
          <line
            x1={scaleX(xMin)}
            y1={scaleY(yMin)}
            x2={scaleX(xMin)}
            y2={scaleY(yMax) - 15}
            stroke="var(--text-color, #374151)"
            strokeWidth="1.5"
            markerEnd="url(#axis-arrow)"
          />
          {/* Y Axis Label */}
          <text
            x={scaleX(xMin)}
            y={scaleY(yMax) - 25}
            fontSize="0.85rem"
            fontWeight="bold"
            fill="var(--text-color, #1f2937)"
            textAnchor="middle"
          >
            {spec.yLabel ?? 'P'}
          </text>
        </g>

        {/* 4. Lines (Supply, Demand, Budget, etc.) */}
        {primitives
          .filter((p): p is Extract<FigurePrimitive, { kind: 'line' }> => p.kind === 'line')
          .map((line, idx) => {
            const color = getPrimitiveColor(line);
            const x1 = scaleX(line.from[0]);
            const y1 = scaleY(line.from[1]);
            const x2 = scaleX(line.to[0]);
            const y2 = scaleY(line.to[1]);
            const isDashed = line.dash === 'dashed';

            return (
              <g key={`line-${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray={isDashed ? '4,4' : undefined}
                />
                {line.label && (
                  <text
                    x={x2 + 6}
                    y={y2 + 4}
                    fontSize="0.75rem"
                    fill={color}
                    fontWeight="bold"
                  >
                    {line.label}
                  </text>
                )}
              </g>
            );
          })}

        {/* 5. Curves (Indifference curves, PPF, MC/ATC, etc.) */}
        {primitives
          .filter((p): p is FigureCurve => p.kind === 'curve')
          .map((curve, idx) => {
            const color = getPrimitiveColor(curve);
            
            // Generate points if they are preset-based and not explicitly provided
            const pts = useMemo(() => {
              if (curve.points) return curve.points;
              if (curve.preset) {
                return generateCurvePoints(curve.preset, domain, range, spec.presetParams);
              }
              return [];
            }, [curve.points, curve.preset, domain, range, spec.presetParams]);

            if (pts.length === 0) return null;

            // Build path string
            const pathD = pts
              .map(([cx, cy], i) => `${i === 0 ? 'M' : 'L'} ${scaleX(cx)} ${scaleY(cy)}`)
              .join(' ');

            const lastPoint = pts[pts.length - 1];

            return (
              <g key={`curve-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                />
                {curve.label && lastPoint && (
                  <text
                    x={scaleX(lastPoint[0]) + 6}
                    y={scaleY(lastPoint[1]) + 4}
                    fontSize="0.75rem"
                    fill={color}
                    fontWeight="bold"
                  >
                    {curve.label}
                  </text>
                )}
              </g>
            );
          })}

        {/* 6. Arrows (Shifts) */}
        {primitives
          .filter((p): p is Extract<FigurePrimitive, { kind: 'arrow' }> => p.kind === 'arrow')
          .map((arrow, idx) => {
            const color = arrow.label ? 'var(--arrow-color, #d97706)' : '#d97706';
            const x1 = scaleX(arrow.from[0]);
            const y1 = scaleY(arrow.from[1]);
            const x2 = scaleX(arrow.to[0]);
            const y2 = scaleY(arrow.to[1]);

            return (
              <g key={`arrow-${idx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth="2.5"
                  markerEnd="url(#shift-arrow)"
                />
                {arrow.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 8}
                    fontSize="0.7rem"
                    fill={color}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {arrow.label}
                  </text>
                )}
              </g>
            );
          })}

        {/* 7. Points (Equilibrium, optimal choices, intercepts) - Draw last, so they sit on top */}
        {primitives
          .filter((p): p is FigurePoint => p.kind === 'point')
          .map((pt, idx) => {
            const px = scaleX(pt.at[0]);
            const py = scaleY(pt.at[1]);
            const { dx, dy, textAnchor } = getLabelOffset(pt.labelPos);

            // Hide the dot if it's purely a text label on the axis (i.e. x = xMin or y = yMin)
            const isDotHidden = pt.at[0] === xMin || pt.at[1] === yMin;

            return (
              <g key={`point-${idx}`}>
                {!isDotHidden && (
                  <circle
                    cx={px}
                    cy={py}
                    r="4"
                    fill="var(--text-color, #374151)"
                    stroke="var(--card-bg, #ffffff)"
                    strokeWidth="1.5"
                  />
                )}
                {pt.label && (
                  <text
                    x={px + dx}
                    y={py + dy}
                    fontSize="0.75rem"
                    fill="var(--text-color, #374151)"
                    fontWeight="bold"
                    textAnchor={textAnchor}
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
    </div>
  );
};

export default FigureView;
