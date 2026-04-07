import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants';

function formatAmount(amount) {
  const abs = Math.abs(amount);
  const dollars = `$${Math.round(abs)}`;
  return amount >= 0 ? `+${dollars}` : `-${dollars}`;
}

export function StatsHeader({ stats }) {
  const count = stats?.count || 0;
  const total = stats?.totalProfit || 0;
  const average = count > 0 ? total / count : 0;
  const totalColor = total >= 0 ? colors.win : colors.loss;
  const avgColor = average >= 0 ? colors.win : colors.loss;

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text testID="stat-count" style={styles.value}>
          {count}
        </Text>
        <Text style={styles.label}>Sessions</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text testID="stat-total" style={[styles.value, { color: totalColor }]}>
          {formatAmount(total)}
        </Text>
        <Text style={styles.label}>Total</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text testID="stat-average" style={[styles.value, { color: avgColor }]}>
          {formatAmount(average)}
        </Text>
        <Text style={styles.label}>Average</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    backgroundColor: colors.separator,
    marginVertical: 4,
  },
});
