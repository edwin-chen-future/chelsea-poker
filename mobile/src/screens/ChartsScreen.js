import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessions } from '../services/api';
import { colors, spacing, radius } from '../constants';

const RANGES = ['Week', 'Month', 'Year', 'All'];
const CHART_HEIGHT = 200;
const CHART_PADDING = 16;

function getRangeCutoff(range) {
  const now = new Date();
  switch (range) {
    case 'Week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case 'Month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'Year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
}

function formatAmount(amount) {
  const abs = Math.abs(amount);
  const dollars = `$${Math.round(abs).toLocaleString()}`;
  return amount >= 0 ? `+${dollars}` : `-${dollars}`;
}

function formatHours(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ChartsScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const cutoff = getRangeCutoff(range);
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.session_date) - new Date(b.session_date)
    );
    if (!cutoff) return sorted;
    return sorted.filter((s) => new Date(s.session_date) >= cutoff);
  }, [sessions, range]);

  const stats = useMemo(() => {
    const count = filtered.length;
    if (count === 0) return null;
    const total = filtered.reduce((s, x) => s + Number(x.result_amount), 0);
    const wins = filtered.filter((x) => Number(x.result_amount) > 0).length;
    const losses = filtered.filter((x) => Number(x.result_amount) < 0).length;
    const totalMinutes = filtered.reduce((s, x) => s + x.duration_minutes, 0);
    const hourlyRate = totalMinutes > 0 ? (total / totalMinutes) * 60 : 0;
    const bestSession = Math.max(...filtered.map((x) => Number(x.result_amount)));
    const worstSession = Math.min(...filtered.map((x) => Number(x.result_amount)));
    return {
      count,
      total,
      average: total / count,
      wins,
      losses,
      winRate: (wins / count) * 100,
      totalMinutes,
      hourlyRate,
      bestSession,
      worstSession,
    };
  }, [filtered]);

  // Cumulative P/L data points
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return filtered.map((s) => {
      cumulative += Number(s.result_amount);
      return { date: s.session_date, value: cumulative };
    });
  }, [filtered]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Range Selector */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text
              style={[
                styles.rangeBtnText,
                range === r && styles.rangeBtnTextActive,
              ]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No sessions in this range</Text>
        </View>
      ) : (
        <>
          {/* Cumulative P/L Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cumulative Profit / Loss</Text>
            <CumulativeChart data={cumulativeData} />
          </View>

          {/* Session Results Bar Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Results</Text>
            <SessionBars sessions={filtered} />
          </View>

          {/* Stats Grid */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Summary</Text>
            <View style={styles.statsGrid}>
              <StatItem
                label="Sessions"
                value={String(stats.count)}
              />
              <StatItem
                label="Total"
                value={formatAmount(stats.total)}
                color={stats.total >= 0 ? colors.win : colors.loss}
              />
              <StatItem
                label="Average"
                value={formatAmount(stats.average)}
                color={stats.average >= 0 ? colors.win : colors.loss}
              />
              <StatItem
                label="Win Rate"
                value={`${Math.round(stats.winRate)}%`}
                color={stats.winRate >= 50 ? colors.win : colors.loss}
              />
              <StatItem
                label="$/Hour"
                value={formatAmount(stats.hourlyRate)}
                color={stats.hourlyRate >= 0 ? colors.win : colors.loss}
              />
              <StatItem
                label="Time Played"
                value={formatHours(stats.totalMinutes)}
              />
              <StatItem
                label="Best Session"
                value={formatAmount(stats.bestSession)}
                color={colors.win}
              />
              <StatItem
                label="Worst Session"
                value={formatAmount(stats.worstSession)}
                color={colors.loss}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatItem({ label, value, color }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CumulativeChart({ data }) {
  if (data.length < 2) {
    return (
      <View style={[styles.chartArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Need at least 2 sessions</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const RIGHT_PAD = 16;
  const chartWidth = Dimensions.get('window').width - spacing.md * 2 - CHART_PADDING * 2 - 48 - RIGHT_PAD;
  const stepX = chartWidth / (data.length - 1);

  // Calculate y position (inverted because 0,0 is top-left)
  const getY = (val) => {
    return CHART_HEIGHT - ((val - minVal) / range) * CHART_HEIGHT;
  };

  const zeroY = getY(0);
  const finalValue = data[data.length - 1].value;
  const lineColor = finalValue >= 0 ? colors.win : colors.loss;

  return (
    <View style={styles.chartArea}>
      {/* Zero line */}
      <View style={[styles.zeroLine, { top: zeroY }]} />
      <Text style={[styles.axisLabel, { top: zeroY - 8, left: 0 }]}>$0</Text>

      {/* Max label */}
      {maxVal !== 0 && (
        <Text style={[styles.axisLabel, { top: 0, left: 0 }]}>
          {formatAmount(maxVal)}
        </Text>
      )}

      {/* Min label */}
      {minVal !== 0 && (
        <Text style={[styles.axisLabel, { bottom: 0, left: 0 }]}>
          {formatAmount(minVal)}
        </Text>
      )}

      {/* Line segments and dots */}
      <View style={styles.chartInner}>
        {data.map((point, i) => {
          const x = i * stepX;
          const y = getY(point.value);

          return (
            <React.Fragment key={i}>
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  {
                    left: x - 3,
                    top: y - 3,
                    backgroundColor: lineColor,
                  },
                ]}
              />
              {/* Line to next point */}
              {i < data.length - 1 && (() => {
                const nextX = (i + 1) * stepX;
                const nextY = getY(data[i + 1].value);
                const dx = nextX - x;
                const dy = nextY - y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                  <View
                    style={[
                      styles.lineSegment,
                      {
                        left: x,
                        top: y,
                        width: length,
                        backgroundColor: lineColor,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })()}
            </React.Fragment>
          );
        })}
      </View>

      {/* Final value label */}
      <View style={styles.finalLabel}>
        <Text style={[styles.finalLabelText, { color: lineColor }]}>
          {formatAmount(finalValue)}
        </Text>
      </View>
    </View>
  );
}

function SessionBars({ sessions }) {
  const amounts = sessions.map((s) => Number(s.result_amount));
  const maxAbs = Math.max(...amounts.map(Math.abs), 1);
  const barWidth = Math.max(
    2,
    (Dimensions.get('window').width - spacing.md * 2 - CHART_PADDING * 2 - 32) / sessions.length - 2
  );

  return (
    <View style={styles.barsContainer}>
      <View style={styles.barsRow}>
        {sessions.map((s, i) => {
          const amount = Number(s.result_amount);
          const height = (Math.abs(amount) / maxAbs) * (CHART_HEIGHT / 2);
          const isWin = amount >= 0;

          return (
            <View key={s.id || i} style={styles.barWrapper}>
              {/* Win bar (above zero) */}
              <View style={styles.barHalf}>
                {isWin && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        width: barWidth,
                        backgroundColor: colors.win,
                        alignSelf: 'flex-end',
                      },
                    ]}
                  />
                )}
              </View>
              {/* Loss bar (below zero) */}
              <View style={styles.barHalf}>
                {!isWin && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        width: barWidth,
                        backgroundColor: colors.loss,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
      {/* Zero line for bars */}
      <View style={[styles.barsZeroLine]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.loss,
    fontSize: 15,
    textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 2,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm - 2,
  },
  rangeBtnActive: {
    backgroundColor: colors.surfaceElevated,
  },
  rangeBtnText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  rangeBtnTextActive: {
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 15,
  },
  // Cumulative chart
  chartArea: {
    height: CHART_HEIGHT + 24,
    position: 'relative',
  },
  chartInner: {
    position: 'absolute',
    top: 0,
    left: 48,
    right: 16,
    height: CHART_HEIGHT,
  },
  zeroLine: {
    position: 'absolute',
    left: 44,
    right: 0,
    height: 1,
    backgroundColor: colors.separator,
  },
  axisLabel: {
    position: 'absolute',
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
    borderRadius: 1,
  },
  finalLabel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  finalLabelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Session bars
  barsContainer: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: CHART_HEIGHT,
    justifyContent: 'center',
    gap: 2,
  },
  barWrapper: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
  },
  barHalf: {
    height: CHART_HEIGHT / 2,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
  },
  barsZeroLine: {
    position: 'absolute',
    top: CHART_HEIGHT / 2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.separator,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
