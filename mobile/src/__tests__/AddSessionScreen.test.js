import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AddSessionScreen } from '../screens/AddSessionScreen';

jest.mock('../services/api', () => ({
  createSession: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((cb) => cb()),
}));

const { createSession } = require('../services/api');

const mockNavigation = { navigate: jest.fn() };

describe('AddSessionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all required form fields', () => {
    const { getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

    expect(getByPlaceholderText('e.g. Bicycle Club')).toBeTruthy();
    expect(getByPlaceholderText('YYYY-MM-DD')).toBeTruthy();
    expect(getByPlaceholderText('0h')).toBeTruthy();
    expect(getByPlaceholderText('0m')).toBeTruthy();
    expect(getByPlaceholderText('e.g. 150 or -75')).toBeTruthy();
    expect(getByPlaceholderText('Any thoughts about the session...')).toBeTruthy();
  });

  it('renders all stake options', () => {
    const { getByText } = render(<AddSessionScreen navigation={mockNavigation} />);

    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('1/3')).toBeTruthy();
    expect(getByText('2/5')).toBeTruthy();
    expect(getByText('5/10')).toBeTruthy();
    expect(getByText('10/20')).toBeTruthy();
  });

  it('renders the submit button', () => {
    const { getByText } = render(<AddSessionScreen navigation={mockNavigation} />);

    expect(getByText('Record Session')).toBeTruthy();
  });

  it('shows validation error when location is empty', () => {
    const { getByText } = render(<AddSessionScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('Record Session'));

    expect(getByText('Location is required')).toBeTruthy();
  });

  it('shows validation error when duration is zero', () => {
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Test Casino');
    fireEvent.press(getByText('Record Session'));

    expect(getByText('Duration must be at least 1 minute')).toBeTruthy();
  });

  it('shows validation error when result amount is missing', () => {
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Test Casino');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.press(getByText('Record Session'));

    expect(getByText('Result amount is required')).toBeTruthy();
  });

  it('submits successfully with valid data and navigates back', async () => {
    createSession.mockResolvedValueOnce({ id: 1 });
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bicycle Club');
    fireEvent.changeText(getByPlaceholderText('0h'), '3');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '200');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Sessions');
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
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

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
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

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
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByPlaceholderText('e.g. Bicycle Club'), 'Bicycle Club');
    fireEvent.changeText(getByPlaceholderText('0h'), '2');
    fireEvent.changeText(getByPlaceholderText('e.g. 150 or -75'), '150');

    await act(async () => {
      fireEvent.press(getByText('Record Session'));
    });

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Sessions');
    });
  });

  it('allows selecting a different stake', () => {
    const { getByText } = render(<AddSessionScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('2/5'));

    // Verify the element is present and pressable (state change reflected on next submit)
    expect(getByText('2/5')).toBeTruthy();
  });

  it('submits with selected stake', async () => {
    createSession.mockResolvedValueOnce({ id: 3 });
    const { getByText, getByPlaceholderText } = render(<AddSessionScreen navigation={mockNavigation} />);

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
});
