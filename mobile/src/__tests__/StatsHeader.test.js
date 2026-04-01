import React from 'react';
import { render } from '@testing-library/react-native';
import { StatsHeader } from '../components/StatsHeader';

describe('StatsHeader', () => {
  it('shows zero for all stats when sessions is empty', () => {
    const { getByTestId } = render(<StatsHeader sessions={[]} />);

    expect(getByTestId('stat-count')).toHaveTextContent('0');
    expect(getByTestId('stat-total')).toHaveTextContent('+$0');
    expect(getByTestId('stat-average')).toHaveTextContent('+$0');
  });

  it('calculates correct totals for multiple wins', () => {
    const sessions = [
      { id: 1, result_amount: 100 },
      { id: 2, result_amount: 50 },
    ];
    const { getByTestId } = render(<StatsHeader sessions={sessions} />);

    expect(getByTestId('stat-count')).toHaveTextContent('2');
    expect(getByTestId('stat-total')).toHaveTextContent('+$150');
    expect(getByTestId('stat-average')).toHaveTextContent('+$75');
  });

  it('calculates correct totals for multiple losses', () => {
    const sessions = [
      { id: 1, result_amount: -100 },
      { id: 2, result_amount: -50 },
    ];
    const { getByTestId } = render(<StatsHeader sessions={sessions} />);

    expect(getByTestId('stat-count')).toHaveTextContent('2');
    expect(getByTestId('stat-total')).toHaveTextContent('-$150');
    expect(getByTestId('stat-average')).toHaveTextContent('-$75');
  });

  it('calculates correct totals for mixed wins and losses', () => {
    const sessions = [
      { id: 1, result_amount: 200 },
      { id: 2, result_amount: -50 },
    ];
    const { getByTestId } = render(<StatsHeader sessions={sessions} />);

    expect(getByTestId('stat-total')).toHaveTextContent('+$150');
    expect(getByTestId('stat-average')).toHaveTextContent('+$75');
  });

  it('shows correct session count', () => {
    const sessions = Array.from({ length: 7 }, (_, i) => ({
      id: i,
      result_amount: 0,
    }));
    const { getByTestId } = render(<StatsHeader sessions={sessions} />);

    expect(getByTestId('stat-count')).toHaveTextContent('7');
  });

  it('handles string result_amount from API (coerces to number)', () => {
    const sessions = [{ id: 1, result_amount: '300' }];
    const { getByTestId } = render(<StatsHeader sessions={sessions} />);

    expect(getByTestId('stat-total')).toHaveTextContent('+$300');
  });
});
