import React from 'react';
import { render } from '@testing-library/react-native';
import { SessionCard } from '../components/SessionCard';

const winSession = {
  id: 1,
  stake: '1/2',
  location: 'Bicycle Club',
  session_date: '2026-01-15',
  duration_minutes: 180,
  result_amount: 250,
  notes: null,
};

const lossSession = {
  id: 2,
  stake: '2/5',
  location: 'Commerce Casino',
  session_date: '2026-01-16',
  duration_minutes: 90,
  result_amount: -75,
  notes: 'Bad beat on the river',
};

describe('SessionCard', () => {
  it('renders stake and location', () => {
    const { getByText } = render(<SessionCard session={winSession} />);

    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('Bicycle Club')).toBeTruthy();
  });

  it('shows positive formatted result for a win', () => {
    const { getByText } = render(<SessionCard session={winSession} />);

    expect(getByText('+$250')).toBeTruthy();
  });

  it('shows negative formatted result for a loss', () => {
    const { getByText } = render(<SessionCard session={lossSession} />);

    expect(getByText('-$75')).toBeTruthy();
  });

  it('shows +$0 for a break-even session', () => {
    const evenSession = { ...winSession, result_amount: 0 };
    const { getByText } = render(<SessionCard session={evenSession} />);

    expect(getByText('+$0')).toBeTruthy();
  });

  it('formats duration as hours-only when minutes are zero', () => {
    const { getByText } = render(<SessionCard session={winSession} />);

    expect(getByText('3h')).toBeTruthy();
  });

  it('formats duration as minutes-only when under one hour', () => {
    const session = { ...winSession, duration_minutes: 45 };
    const { getByText } = render(<SessionCard session={session} />);

    expect(getByText('45m')).toBeTruthy();
  });

  it('formats duration with both hours and minutes', () => {
    const session = { ...winSession, duration_minutes: 150 };
    const { getByText } = render(<SessionCard session={session} />);

    expect(getByText('2h 30m')).toBeTruthy();
  });

  it('renders the session date', () => {
    const { getByText } = render(<SessionCard session={winSession} />);

    expect(getByText('2026-01-15')).toBeTruthy();
  });

  it('renders notes when present', () => {
    const { getByText } = render(<SessionCard session={lossSession} />);

    expect(getByText('Bad beat on the river')).toBeTruthy();
  });

  it('does not render notes element when notes is null', () => {
    const { queryByText } = render(<SessionCard session={winSession} />);

    expect(queryByText('Bad beat on the river')).toBeNull();
  });

  it('handles string result_amount from API (coerces to number)', () => {
    const session = { ...winSession, result_amount: '100' };
    const { getByText } = render(<SessionCard session={session} />);

    expect(getByText('+$100')).toBeTruthy();
  });
});
