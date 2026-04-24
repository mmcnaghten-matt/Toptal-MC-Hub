import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
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
    dimension: dim.label,
    score: Number((scoreSummary[dim.id] ?? 0).toFixed(1)),
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          formatter={(value: number) => [value.toFixed(1), 'Score']}
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
