import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

const BAR_GAP = 10;
const MAX_FIXED_BARS = 14;
const FIXED_SLOT = 42;
const BASE_COLOR = theme.colors.primary;

interface BarChartProps {
  data: ChartDatum[];
  height?: number;
}

/**
 * Graphique en barres avec étiquettes de valeur. Jusqu'à 14 barres, elles
 * remplissent la largeur de l'écran ; au-delà, le graphe défile horizontalement
 * (périodes personnalisées longues).
 */
export function BarChart({ data, height = 170 }: BarChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const many = data.length > MAX_FIXED_BARS;
  const slotWidth = many
    ? FIXED_SLOT
    : (containerWidth - BAR_GAP * Math.max(data.length - 1, 0)) / Math.max(data.length, 1);
  const barWidth = Math.max(6, slotWidth - BAR_GAP);
  const chartWidth = many ? slotWidth * data.length : containerWidth;

  const content = (
    <Svg width={chartWidth} height={height}>
      {data.map((datum, index) => {
        const x = many ? index * slotWidth : index * (slotWidth + BAR_GAP);
        const barHeight = (datum.value / maxValue) * (height - 30);
        const y = height - 26 - barHeight;
        const cx = x + barWidth / 2;
        return (
          <G key={datum.label}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight || 2}
              rx={6}
              fill={datum.color ?? BASE_COLOR}
              opacity={datum.value > 0 ? 1 : 0.12}
            />
            {datum.value > 0 ? (
              <SvgText
                x={cx}
                y={y - 5}
                fontSize={10}
                fontWeight="600"
                fill={theme.colors.textSecondary}
                textAnchor="middle"
              >
                {datum.value}
              </SvgText>
            ) : null}
            <SvgText
              x={cx}
              y={height - 8}
              fontSize={9}
              fill={theme.colors.textMuted}
              textAnchor="middle"
            >
              {datum.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );

  if (many) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {content}
      </ScrollView>
    );
  }

  return <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>{content}</View>;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end - 0.0001);
  const e = polarToCartesian(cx, cy, r, start);
  const largeArc = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

interface DonutChartProps {
  data: ChartDatum[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

/** Anneau de répartition (donut), sans dépendance supplémentaire. */
export function DonutChart({
  data,
  size = 150,
  strokeWidth = 20,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const positive = data.filter((d) => d.value > 0);
  const max = Math.max(total, 1);
  const endAngles = positive.reduce<number[]>((acc, d) => {
    acc.push((acc[acc.length - 1] ?? 0) + (d.value / max) * 360);
    return acc;
  }, []);
  const segments = positive.map((d, index) => {
    const start = index === 0 ? 0 : endAngles[index - 1];
    const sweep = endAngles[index];
    const fullTurn = sweep - start >= 359.9;
    const path = fullTurn
      ? arcPath(cx, cy, radius, start, start + 179.9) +
        arcPath(cx, cy, radius, start + 180, start + 359.9)
      : arcPath(cx, cy, radius, start, sweep);
    return { path, color: d.color ?? BASE_COLOR };
  });

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={theme.colors.border}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {segments.map((segment) => (
        <Path
          key={segment.path}
          d={segment.path}
          stroke={segment.color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      ))}
      <SvgText
        x={cx}
        y={cy - (centerSubLabel ? 4 : 0)}
        fontSize={centerLabel ? 18 : 12}
        fontWeight="700"
        fill={theme.colors.text}
        textAnchor="middle"
      >
        {centerLabel ?? total}
      </SvgText>
      {centerSubLabel ? (
        <SvgText
          x={cx}
          y={cy + 16}
          fontSize={10}
          fill={theme.colors.textSecondary}
          textAnchor="middle"
        >
          {centerSubLabel}
        </SvgText>
      ) : null}
    </Svg>
  );
}
