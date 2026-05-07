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

export default function ScoreChart({ dimensions, scoreSummary }: Props) {
  const data = dimensions.map(dim => ({
    dimension: dim.shortName,
    score: Number((scoreSummary[dim.id] ?? 0).toFixed(1)),
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid gridType="polygon" />
        {/* Force fixed 0–5 domain so the scale is always consistent */}
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
  );
}
