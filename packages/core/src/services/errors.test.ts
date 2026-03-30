import { describe, it, expect } from 'vitest';
import { createError, isVibeTripError, getErrorMessage, ErrorCode, VibeTripError } from '../services/errors.js';

describe('Errors', () => {
  describe('createError', () => {
    it('should create error with correct properties', () => {
      const error = createError(ErrorCode.NOT_FOUND, 'Trip not found', { tripId: '123' });

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Trip not found');
      expect(error.details).toEqual({ tripId: '123' });
    });

    it('should extend Error', () => {
      const error = createError(ErrorCode.UNKNOWN, 'Something went wrong');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(VibeTripError);
    });
  });

  describe('isVibeTripError', () => {
    it('should return true for VibeTripError', () => {
      const error = createError(ErrorCode.INVALID_INPUT, 'Invalid input');
      expect(isVibeTripError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isVibeTripError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isVibeTripError('string')).toBe(false);
      expect(isVibeTripError(null)).toBe(false);
      expect(isVibeTripError(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return formatted message for VibeTripError', () => {
      const error = createError(ErrorCode.TRIP_NOT_FOUND, 'Trip not found');
      expect(getErrorMessage(error)).toBe('[TRIP_NOT_FOUND] Trip not found');
    });

    it('should return message for regular Error', () => {
      const error = new Error('Regular error message');
      expect(getErrorMessage(error)).toBe('Regular error message');
    });

    it('should return string representation for unknown types', () => {
      expect(getErrorMessage(123)).toBe('123');
    });
  });
});
