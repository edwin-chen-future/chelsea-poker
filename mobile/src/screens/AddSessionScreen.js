import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { createSession } from '../services/api';
import { colors, spacing, radius } from '../constants';

const STAKES = ['1/2', '1/3', '2/5', '5/10', '10/20'];

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function validate({ location, date, hours, minutes, result }) {
  if (!location.trim()) return 'Location is required';
  if (!date.trim()) return 'Date is required';
  const totalMinutes = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
  if (totalMinutes <= 0) return 'Duration must be at least 1 minute';
  if (result === '' || result === '-') return 'Result amount is required';
  if (isNaN(Number(result))) return 'Result must be a number';
  return null;
}

export function AddSessionScreen() {
  const [stake, setStake] = useState(STAKES[0]);
  const LOCATIONS = ['Commerce', 'Bicycle', 'Wynn', 'Palm Spring'];
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [date, setDate] = useState(todayString());
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit() {
    const validationError = validate({ location, date, hours, minutes, result });
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage('');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const totalMinutes =
        (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
      await createSession({
        stake,
        location: location.trim(),
        session_date: date.trim(),
        duration_minutes: totalMinutes,
        result_amount: Number(result),
        notes: notes.trim() || undefined,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSuccessMessage('Session recorded!');
      setLocation('');
      setDate(todayString());
      setHours('');
      setMinutes('');
      setResult('');
      setNotes('');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionHeader}>Stake</Text>
        <View style={styles.stakeRow}>
          {STAKES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.stakeButton, stake === s && styles.stakeButtonActive]}
              onPress={() => setStake(s)}
              accessibilityRole="radio"
              accessibilityState={{ checked: stake === s }}
            >
              <Text
                style={[
                  styles.stakeButtonText,
                  stake === s && styles.stakeButtonTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Location</Text>
        <View style={styles.stakeRow}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.stakeButton, location === loc && styles.stakeButtonActive]}
              onPress={() => setLocation(loc)}
            >
              <Text style={[styles.stakeButtonText, location === loc && styles.stakeButtonTextActive]}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Duration</Text>
        <View style={styles.durationRow}>
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={hours}
            onChangeText={setHours}
            placeholder="0h"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, styles.durationInput]}
            value={minutes}
            onChangeText={setMinutes}
            placeholder="0m"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.label}>Result ($)</Text>
        <TextInput
          style={styles.input}
          value={result}
          onChangeText={setResult}
          placeholder="e.g. 150 or -75"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any thoughts about the session..."
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
        />

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Recording...' : 'Record Session'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    minHeight: 44,
  },
  stakeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stakeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  stakeButtonActive: {
    backgroundColor: colors.accent,
  },
  stakeButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  stakeButtonTextActive: {
    color: colors.textPrimary,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.loss,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  successText: {
    color: colors.win,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 50,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
});
