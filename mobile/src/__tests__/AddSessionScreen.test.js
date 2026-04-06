import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AddSessionScreen } from '../screens/AddSessionScreen';

jest.mock('../services/api', () => ({
  createSession: jest.fn(),
  updateSession: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((cb) => cb()),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const { createSession, updateSession } = require('../services/api');
const SecureStore = require('expo-secure-store');

const mockNavigation = { navigate: jest.fn() };
const mockRoute = { params: {} };

// Helper: render the component and flush all pending async state (e.g. prefs loading)
async function renderScreen(props = {}) {
  const result = render(
    <AddSessionScreen
      navigation={mockNavigation}
      route={mockRoute}
      {...props}
    />
  );
  // Flush pending microtasks so prefs load completes before test interactions
  await act(async () => {});
  return result;
}

describe('AddSessionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
  });

  it('renders all required form fields', async () => {
    const { getByPlaceholderText } = await renderScreen();

    expect(getByPlaceholderText('e.g. Bicycle Club')).toBeTruthy();
    expect(getByPlaceholderText('YYYY-MM-DD')).toBeTruthy();
    expect(getByPlaceholderText('0h')).toBeTruthy();
    expect(getByPlaceholderText('0m')).toBeTruthy();
    expect(getByPlaceholderText('e.g. 150 or -75')).toBeTruthy();
    expect(getByPlaceholderText('Any thoughts about the session...')).toBeTruthy();
  });

  it('renders all stake options', async () => {
    const { getByText } = await renderScreen();

    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('1/3')).toBeTruthy();
    expect(getByText('2/5')).toBeTruthy();
    expect(getByText('5/10')).toBeTruthy();
    expect(getByText('10/20')).toBeTruthy();
  });

  it('renders all preset location buttons', async () => {
    const { getByText } = await renderScreen();

    expect(getByText('Commerce')).toBeTruthy();
    expect(getByText('Bicycle')).toBeTruthy();
    expect(getByText('Wynn')).toBeTruthy();
    expect(getByText('Palm Spring')).toBeTruthy();
  });

  it('renders the submit button', async () => {
    const { getByText } = await renderScreen();

    expect(getByText('Record Session')).toBeTruthy();
  });

  it('shows validation error when location is empty', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    // Clear the location text input so it is empty
    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), '');
    fireEvent.press(getByText('Record Session'));

    expect(getByText('Location is required')).toBeTruthy();
  });

  it('shows validation error when duration is zero', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Test Casino');
    fireEvent.press(getByText('Record Session'));

    expect(getByText('Duration must be at least 1 minute')).toBeTruthy();
  });

  it('shows validation error when result amount is missing', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Test Casino');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.press(getByText('Record Session'));

    expect(getByText('Result amount is required')).toBeTruthy();
  });

  it('submits successfully with valid data and navigates back', async () => {
    createSession.mockResolvedValueOnce({ id: 1 });
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bicycle Club');
    fireEvent.changeText(getByPlaceholderText('0h'), '3');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '200');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Sessions', expect.any(Object));
    });

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        stake: '1/2',
        location: 'Bicycle Club',
        duration_minutes: 180,
        result_amount: 200,
      })
    );
  });

  it('submits with negative result (loss)', async () => {
    createSession.mockResolvedValueOnce({ id: 2 });
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Commerce');
    fireEvent.changeText(getByPlaceholderText('0h'), '1');
    fireEvent.changeText(getByPlaceholderText('0m'), '30');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '-50');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_minutes: 90,
          result_amount: -50,
        })
      );
    });
  });

  it('shows API error message on submission failure', async () => {
    createSession.mockRejectedValueOnce(new Error('Server error'));
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bicycle Club');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '100');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(getByText('Server error')).toBeTruthy();
    });
  });

  it('navigates to Sessions after successful submission', async () => {
    createSession.mockResolvedValueOnce({ id: 1 });
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bicycle Club');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '150');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Sessions', expect.any(Object));
    });
  });

  it('allows selecting a different stake', async () => {
    const { getByText } = await renderScreen();

    fireEvent.press(getByText('2/5'));

    expect(getByText('2/5')).toBeTruthy();
  });

  it('submits with selected stake', async () => {
    createSession.mockResolvedValueOnce({ id: 3 });
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.press(getByText('2/5'));
    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Wynn');
    fireEvent.changeText(getByPlaceholderText('0h'), '4');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '500');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(createSession).toHaveBeenCalledWith(
        expect.objectContaining({ stake: '2/5' })
      );
    });
  });

  // --- Prefs persistence tests ---

  it('saves prefs to SecureStore on successful submission', async () => {
    createSession.mockResolvedValueOnce({ id: 4 });
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.press(getByText('2/5'));
    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Wynn');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '300');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'last_session_prefs',
        JSON.stringify({ stake: '2/5', location: 'Wynn' })
      );
    });
  });

  it('does not save prefs when submission fails', async () => {
    createSession.mockRejectedValueOnce(new Error('Network error'));
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Commerce');
    fireEvent.changeText(getByPlaceholderText('0h'), '1');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '50');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy();
    });

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('pre-fills stake and location from saved prefs on focus', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify({ stake: '5/10', location: 'Wynn' })
    );

    const { getByPlaceholderText } = await renderScreen();

    expect(getByPlaceholderText('e.g. Bicycle Club').props.value).toBe('Wynn');
  });

  it('defaults to first stake and first location when no prefs are saved', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);

    const { getByPlaceholderText } = await renderScreen();

    expect(getByPlaceholderText('e.g. Bicycle Club').props.value).toBe('Commerce');
  });

  // --- Custom location input tests ---

  it('typing a custom location is reflected in the text input', async () => {
    const { getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bike Club');

    expect(getByPlaceholderText('e.g. Bicycle Club').props.value).toBe('Bike Club');
  });

  it('selecting a preset location button updates the text input', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.press(getByText('Wynn'));

    expect(getByPlaceholderText('e.g. Bicycle Club').props.value).toBe('Wynn');
  });

  it('submits with custom typed location', async () => {
    createSession.mockResolvedValueOnce({ id: 5 });
    const { getByText, getByPlaceholderText } = await renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bike Club');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '100');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(createSession).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'Bike Club' })
      );
    });
  });

  // --- Edit mode tests ---

  it('does not load prefs in edit mode', async () => {
    const editSession = {
      id: 10,
      stake: '1/3',
      location: 'Bicycle',
      session_date: '2026-01-01',
      duration_minutes: 120,
      result_amount: '100',
      notes: '',
    };

    await renderScreen({ route: { params: { session: editSession } } });

    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it('pre-fills form fields from session in edit mode', async () => {
    const editSession = {
      id: 10,
      stake: '1/3',
      location: 'Bicycle',
      session_date: '2026-01-01',
      duration_minutes: 120,
      result_amount: '100',
      notes: 'good game',
    };

    const { getByPlaceholderText } = await renderScreen({
      route: { params: { session: editSession } },
    });

    expect(getByPlaceholderText('e.g. Bicycle Club').props.value).toBe('Bicycle');
    expect(getByPlaceholderText('e.g. 150 or -75').props.value).toBe('100');
  });

  it('renders Update Session button in edit mode', async () => {
    const editSession = {
      id: 10,
      stake: '1/3',
      location: 'Bicycle',
      session_date: '2026-01-01',
      duration_minutes: 120,
      result_amount: '100',
      notes: '',
    };

    const { getByText } = await renderScreen({
      route: { params: { session: editSession } },
    });

    expect(getByText('Update Session')).toBeTruthy();
  });

  it('calls updateSession in edit mode', async () => {
    updateSession.mockResolvedValueOnce({ id: 10 });
    const editSession = {
      id: 10,
      stake: '1/3',
      location: 'Bicycle',
      session_date: '2026-01-01',
      duration_minutes: 120,
      result_amount: '100',
      notes: '',
    };

    const { getByText, getByPlaceholderText } = await renderScreen({
      route: { params: { session: editSession } },
    });

    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '200');

    await act(async () => {
      fireEvent.press(getByText('Update Session'));
    });

    await waitFor(() => {
      expect(updateSession).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ result_amount: 200 })
      );
    });
  });
});
