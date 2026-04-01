import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SessionsScreen } from '../screens/SessionsScreen';

jest.mock('../services/api', () => ({
  getSessions: jest.fn(),
}));

// Mock useFocusEffect to call the callback immediately via useEffect
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback) => {
      React.useEffect(() => {
        callback();
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
    },
  };
});

const { getSessions } = require('../services/api');

const mockSessions = [
  {
    id: 1,
    stake: '1/2',
    location: 'Bicycle Club',
    session_date: '2026-01-15',
    duration_minutes: 180,
    result_amount: 250,
    notes: null,
  },
  {
    id: 2,
    stake: '2/5',
    location: 'Commerce Casino',
    session_date: '2026-01-14',
    duration_minutes: 90,
    result_amount: -75,
    notes: null,
  },
];

describe('SessionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator while fetching', () => {
    // Never-resolving promise keeps the loading state visible
    getSessions.mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(<SessionsScreen />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders session cards after data loads', async () => {
    getSessions.mockResolvedValueOnce(mockSessions);

    const { getByText } = render(<SessionsScreen />);

    await waitFor(() => {
      expect(getByText('Bicycle Club')).toBeTruthy();
      expect(getByText('Commerce Casino')).toBeTruthy();
    });
  });

  it('shows empty state when no sessions exist', async () => {
    getSessions.mockResolvedValueOnce([]);

    const { getByText } = render(<SessionsScreen />);

    await waitFor(() => {
      expect(getByText('No sessions yet')).toBeTruthy();
    });
  });

  it('shows error message when API call fails', async () => {
    getSessions.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<SessionsScreen />);

    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy();
    });
  });

  it('displays stats header with correct session count', async () => {
    getSessions.mockResolvedValueOnce(mockSessions);

    const { getByTestId } = render(<SessionsScreen />);

    await waitFor(() => {
      expect(getByTestId('stat-count')).toHaveTextContent('2');
    });
  });
});
