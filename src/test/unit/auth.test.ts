import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, generateId, generateSessionToken, getSessionExpiry } from '../../../lib/auth';

describe('Auth Utilities', () => {
  describe('generateId', () => {
    it('should generate a valid UUID-like string', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate a URL-safe base64 token', () => {
      const token = generateSessionToken();
      // Should not contain +, /, or =
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    });

    it('should generate tokens of consistent length', () => {
      const token = generateSessionToken();
      // 32 bytes -> 43 characters in base64 without padding
      expect(token.length).toBe(43);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSessionToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should accept valid passwords', () => {
      expect(isValidPassword('Password123').valid).toBe(true);
      expect(isValidPassword('SecurePass1').valid).toBe(true);
      expect(isValidPassword('MyP@ssw0rd!').valid).toBe(true);
    });

    it('should require minimum 8 characters', () => {
      const result = isValidPassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('8 characters');
    });

    it('should require uppercase letter', () => {
      const result = isValidPassword('password123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should require lowercase letter', () => {
      const result = isValidPassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should require a number', () => {
      const result = isValidPassword('PasswordABC');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });
  });

  describe('getSessionExpiry', () => {
    it('should return a date 7 days in the future', () => {
      const expiry = getSessionExpiry();
      const expiryDate = new Date(expiry);
      const now = new Date();

      // Should be approximately 7 days from now (allowing 1 second tolerance)
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeGreaterThan(6.99);
      expect(diffDays).toBeLessThan(7.01);
    });

    it('should return ISO format string', () => {
      const expiry = getSessionExpiry();
      expect(expiry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });
});
