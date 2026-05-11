import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { DimensionConfig } from "../types";

interface Props {
  dimensions: DimensionConfig[];
  scoreSummary: Record<string, number>;
}

// Custom tick that wraps multi-word labels onto separate lines so they
// never overflow the SVG viewport horizontally.
const CustomTick = ({ x, y, textAnchor, value }: {
  x: number;
  y: number;
  textAnchor: string;
  value: string;
  [key: string]: unknown;
}) => {
  const words = String(value).split(' ');
  const lineHeight = 13;
  // Shift the whole label up so multi-line blocks are centred on the axis point
  const offsetY = -((words.length - 1) * lineHeight) / 2;

  return (
    <text
      x={x}
      y={y + offsetY}
      textAnchor={textAnchor}
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
    >
      {words.map((word, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
          {word}
        </tspan>
      ))}
    </text>
  );
};

export default function ScoreChart({ dimensions, scoreSummary }: Props) {
  const data = dimensions.map(dim => ({
    dimension: dim.shortName,
    score: Number((scoreSummary[dim.id] ?? 0).toFixed(1)),
    fullMark: 5,
  }));

  return (
    // Outer padding gives overflowing SVG text room without being clipped
    // by the parent container.
    <div className="px-8 py-4">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          // Allow SVG content (labels) to render outside the SVG viewport
          style={{ overflow: 'visible' }}
        >
          <PolarGrid gridType="polygon" />
          {/* Force fixed 0–5 domain so the scale is always consistent */}
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={(props) => <CustomTick {...props} />}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(1), 'Score (1–5)']}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Radar
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
