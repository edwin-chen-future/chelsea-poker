import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants';

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatResult(amount) {
  const abs = Math.abs(amount);
  const dollars = `$${Math.round(abs)}`;
  return amount >= 0 ? `+${dollars}` : `-${dollars}`;
}

export function SessionCard({ session, onPress }) {
  const amount = Number(session.result_amount);
  const isWin = amount > 0;
  const isDraw = amount === 0;
  const resultColor = isWin ? colors.win : isDraw ? colors.textSecondary : colors.loss;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.stake}>{session.stake}</Text>
          <Text style={styles.location}>{session.location}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.result, { color: resultColor }]}>
            {formatResult(amount)}
          </Text>
          <Text style={styles.duration}>{formatDuration(session.duration_minutes)}</Text>
        </View>
      </View>
      <Text style={styles.date}>{session.session_date}</Text>
      {session.notes ? <Text style={styles.notes}>{session.notes}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  stake: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  location: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  result: {
    fontSize: 20,
    fontWeight: '700',
  },
  duration: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
  date: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
