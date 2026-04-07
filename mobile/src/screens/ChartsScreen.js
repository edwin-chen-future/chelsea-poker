import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  PanResponder,
} from 'react-native';
import { getAllSessions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radius } from '../constants';

const RANGES = ['Week', 'Month', 'Year', 'All'];
const CHART_HEIGHT = 220;
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
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('Week');

  const load = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const filtered = useMemo(() => {
    const cutoff = getRangeCutoff(range);
    // Sort ascending by date, then by created_at timestamp for same-date sessions
    const sorted = [...sessions].sort(
      (a, b) =>
        a.session_date.localeCompare(b.session_date) ||
        new Date(a.created_at) - new Date(b.created_at)
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

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Please sign in from the Profile tab to view charts.</Text>
      </View>
    );
  }

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
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
  const [activeIndex, setActiveIndex] = useState(null);
  const chartInnerRef = useRef(null);
  const chartOffsetX = useRef(0);

  const LEFT_MARGIN = 48;
  const RIGHT_PAD = 16;
  const lineAreaHeight = CHART_HEIGHT - 20;
  const chartWidth = Dimensions.get('window').width - spacing.md * 2 - CHART_PADDING * 2 - LEFT_MARGIN - RIGHT_PAD;
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        updateIndex(touchX);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        updateIndex(touchX);
      },
      onPanResponderRelease: () => {
        setActiveIndex(null);
      },
      onPanResponderTerminate: () => {
        setActiveIndex(null);
      },
    })
  ).current;

  function updateIndex(touchX) {
    if (data.length < 2 || stepX === 0) return;
    const idx = Math.round(touchX / stepX);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setActiveIndex(clamped);
  }

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

  const getY = (val) => {
    return lineAreaHeight - ((val - minVal) / range) * lineAreaHeight;
  };

  const zeroY = getY(0);
  const finalValue = data[data.length - 1].value;
  const lineColor = finalValue >= 0 ? colors.win : colors.loss;

  const isScrubbing = activeIndex !== null;
  const displayPoint = isScrubbing ? data[activeIndex] : data[data.length - 1];
  const displayValue = displayPoint.value;
  const displayColor = displayValue >= 0 ? colors.win : colors.loss;

  // Pick ~5 evenly spaced label indices
  const labelCount = Math.min(5, data.length);
  const labelStep = data.length > 1 ? (data.length - 1) / (labelCount - 1) : 0;
  const labelIndices = new Set(
    Array.from({ length: labelCount }, (_, i) => Math.round(i * labelStep))
  );

  return (
    <View style={styles.chartArea}>
      {/* Scrub display */}
      <View style={styles.scrubHeader}>
        <Text style={[styles.scrubValue, { color: displayColor }]}>
          {formatAmount(displayValue)}
        </Text>
        {isScrubbing && (
          <Text style={styles.scrubDate}>{formatDateLabel(displayPoint.date)}</Text>
        )}
      </View>

      {/* Zero line */}
      <View style={[styles.zeroLine, { top: zeroY + 28 }]} />
      <Text style={[styles.axisLabel, { top: zeroY + 20, left: 0 }]}>$0</Text>

      {/* Max label */}
      {maxVal !== 0 && (
        <Text style={[styles.axisLabel, { top: 28, left: 0 }]}>
          {formatAmount(maxVal)}
        </Text>
      )}

      {/* Min label */}
      {minVal !== 0 && (
        <Text style={[styles.axisLabel, { bottom: 20, left: 0 }]}>
          {formatAmount(minVal)}
        </Text>
      )}

      {/* Line segments, dots, and touch area */}
      <View
        ref={chartInnerRef}
        style={[styles.chartInner, { height: lineAreaHeight, top: 28 }]}
        {...panResponder.panHandlers}
      >
        {data.map((point, i) => {
          const x = i * stepX;
          const y = getY(point.value);

          return (
            <React.Fragment key={i}>
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

        {/* Scrub cursor line */}
        {isScrubbing && (
          <View
            style={{
              position: 'absolute',
              left: activeIndex * stepX,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: colors.textSecondary,
            }}
          />
        )}

        {/* Scrub cursor dot */}
        {isScrubbing && (
          <View
            style={[
              styles.scrubDot,
              {
                left: activeIndex * stepX - 6,
                top: getY(data[activeIndex].value) - 6,
                borderColor: displayColor,
              },
            ]}
          />
        )}
      </View>

      {/* X-axis date labels */}
      <View style={[styles.cumLabels, { width: chartWidth, left: LEFT_MARGIN }]}>
        {data.map((point, i) => {
          if (!labelIndices.has(i)) return null;
          return (
            <Text
              key={i}
              style={[
                styles.barsLabelText,
                { position: 'absolute', left: i * stepX - 20, width: 45, textAlign: 'center' },
              ]}
            >
              {formatDateLabel(point.date)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatShortAmount(amount) {
  const abs = Math.abs(amount);
  const str = abs >= 1000 ? `${Math.round(abs / 100) / 10}k` : `${Math.round(abs)}`;
  return amount >= 0 ? `$${str}` : `-$${str}`;
}

function SessionBars({ sessions }) {
  const amounts = sessions.map((s) => Number(s.result_amount));
  const maxPos = Math.max(...amounts, 0);
  const maxNeg = Math.min(...amounts, 0);
  const maxAbs = Math.max(maxPos, Math.abs(maxNeg), 1);
  const barAreaHeight = CHART_HEIGHT - 20; // leave room for date labels
  const halfHeight = barAreaHeight / 2;

  const Y_AXIS_WIDTH = 40;
  const availableWidth = Dimensions.get('window').width - spacing.md * 2 - CHART_PADDING * 2 - Y_AXIS_WIDTH;
  const minBarWidth = 20;
  const barWidth = Math.max(minBarWidth, Math.floor(availableWidth / sessions.length) - 2);
  const totalWidth = sessions.length * (barWidth + 2);
  const needsScroll = totalWidth > availableWidth;
  const contentWidth = needsScroll ? totalWidth : undefined;

  // Pick ~5 evenly spaced label indices
  const labelCount = Math.min(5, sessions.length);
  const labelStep = sessions.length > 1 ? (sessions.length - 1) / (labelCount - 1) : 0;
  const labelIndices = new Set(
    Array.from({ length: labelCount }, (_, i) => Math.round(i * labelStep))
  );

  const barsContent = (
    <View style={[styles.barsInner, contentWidth && { width: contentWidth }]}>
      <View style={[styles.barsRow, { height: barAreaHeight }, contentWidth && { width: contentWidth }]}>
        {sessions.map((s, i) => {
          const amount = Number(s.result_amount);
          const barHeight = (Math.abs(amount) / maxAbs) * halfHeight;
          const isWin = amount >= 0;

          return (
            <View key={s.id || i} style={{ alignItems: 'center', width: barWidth }}>
              {/* Top half — wins grow upward */}
              <View style={{ height: halfHeight, justifyContent: 'flex-end' }}>
                {isWin && (
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight, width: barWidth - 2, backgroundColor: colors.win },
                    ]}
                  />
                )}
              </View>
              {/* Bottom half — losses grow downward */}
              <View style={{ height: halfHeight, justifyContent: 'flex-start' }}>
                {!isWin && (
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight, width: barWidth - 2, backgroundColor: colors.loss },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
      {/* Zero line */}
      <View style={[styles.barsZeroLine, { top: halfHeight }]} />
      {/* Date labels */}
      <View style={[styles.barsLabels, contentWidth && { width: contentWidth }]}>
        {sessions.map((s, i) => (
          <View key={s.id || i} style={{ width: barWidth, alignItems: 'center', overflow: 'visible' }}>
            {labelIndices.has(i) ? (
              <Text style={styles.barsLabelText} numberOfLines={1}>{formatDateLabel(s.session_date)}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );

  const padLeft = 20; // ensure first date label is fully visible

  const yAxis = (
    <View style={{ width: Y_AXIS_WIDTH, height: barAreaHeight, justifyContent: 'space-between' }}>
      <Text style={styles.yAxisLabel}>{formatShortAmount(maxPos)}</Text>
      <Text style={[styles.yAxisLabel, { color: colors.textTertiary }]}>$0</Text>
      <Text style={styles.yAxisLabel}>{formatShortAmount(maxNeg)}</Text>
    </View>
  );

  if (needsScroll) {
    return (
      <View style={[styles.barsContainer, { flexDirection: 'row' }]}>
        {yAxis}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: padLeft, paddingRight: padLeft }} style={{ flex: 1 }}>
          {barsContent}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.barsContainer, { flexDirection: 'row' }]}>
      {yAxis}
      <View style={{ flex: 1, paddingHorizontal: padLeft }}>{barsContent}</View>
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
  scrubHeader: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 48,
  },
  scrubValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrubDate: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  scrubDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 3,
  },
  // Session bars
  barsContainer: {
    height: CHART_HEIGHT,
    overflow: 'hidden',
  },
  barsInner: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    borderRadius: 2,
    minHeight: 2,
    alignSelf: 'center',
  },
  barsZeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.separator,
  },
  barsLabels: {
    flexDirection: 'row',
    height: 20,
    gap: 2,
    overflow: 'visible',
  },
  barsLabelText: {
    color: colors.textTertiary,
    fontSize: 9,
    width: 50,
    textAlign: 'center',
  },
  yAxisLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
  },
  cumLabels: {
    position: 'absolute',
    bottom: 0,
    height: 20,
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
