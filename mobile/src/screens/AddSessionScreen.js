import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { createSession, updateSession } from '../services/api';
import { getItem, setItem } from '../services/storage';
import { impact } from '../services/haptics';
import { colors, spacing, radius } from '../constants';

const STAKES = ['1/3', '2/3', '2/5', '5/5', '5/10'];
const LOCATIONS = ['Commerce', 'Bicycle', 'Wynn', 'Palm Spring'];
const PREFS_KEY = 'last_session_prefs';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function validate({ location, date, result }) {
  if (!location.trim()) return 'Location is required';
  if (!date.trim()) return 'Date is required';
  if (result === '' || result === '-') return 'Result amount is required';
  if (isNaN(Number(result))) return 'Result must be a number';
  return null;
}

async function loadPrefs() {
  try {
    const raw = await getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load session prefs:', e);
  }
  return null;
}

async function savePrefs(stake, location) {
  try {
    await setItem(PREFS_KEY, JSON.stringify({ stake, location }));
  } catch (e) {
    console.warn('Failed to save session prefs:', e);
  }
}

export function AddSessionScreen({ navigation, route }) {
  const editSession = route?.params?.session;
  const isEditing = !!editSession;

  const [stake, setStake] = useState(STAKES[0]);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(todayString());
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (editSession) {
        setStake(editSession.stake);
        setLocation(editSession.location);
        setDate(editSession.session_date);
        setResult(String(editSession.result_amount));
        setNotes(editSession.notes || '');
      } else {
        async function applyPrefs() {
          const prefs = await loadPrefs();
          setStake(prefs?.stake || STAKES[0]);
          setLocation(prefs?.location || LOCATIONS[0]);
          setDate(todayString());
          setResult('');
          setNotes('');
        }
        applyPrefs();
      }
      setErrorMessage('');
    }, [editSession])
  );

  async function handleSubmit() {
    const validationError = validate({ location, date, result });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const sessionData = {
        stake,
        location: location.trim(),
        session_date: date.trim(),
        result_amount: Number(result),
        notes: notes.trim() || undefined,
      };
      if (isEditing) {
        await updateSession(editSession.id, sessionData);
      } else {
        await createSession(sessionData);
      }
      await savePrefs(stake, location.trim());
      await impact();
      navigation.navigate('Sessions', { refresh: Date.now() });
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
        <TextInput
          style={[styles.input, styles.locationInput]}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Bicycle Club"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={styles.label}>Date</Text>
        <DatePicker value={date} onChange={setDate} />

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

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Saving...' : isEditing ? 'Update Session' : 'Record Session'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Cross-platform date picker: native input[type=date] on web, styled text input on native
function DatePicker({ value, onChange }) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          borderRadius: radius.sm,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          paddingTop: spacing.sm + 2,
          paddingBottom: spacing.sm + 2,
          fontSize: 16,
          minHeight: 44,
          border: 'none',
          width: '100%',
          boxSizing: 'border-box',
          colorScheme: 'dark',
        }}
      />
    );
  }

  // On native, use a styled TextInput with YYYY-MM-DD format hint
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      placeholderTextColor={colors.textTertiary}
      keyboardType="numbers-and-punctuation"
    />
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
  locationInput: {
    marginTop: spacing.sm,
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
