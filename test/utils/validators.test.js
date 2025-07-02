/**
 * Tests unitaires Validators

 */

const { validateEmail, validatePassword, validateName, sanitizeString } = require('../../utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    test('Devrait valider des emails corrects', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('Devrait rejeter des emails incorrects', () => {
      const invalidEmails = [
        'email-sans-arobase',
        '@domain.com',
        'user@',
        'user@@domain.com',
        'user@domain',
        '',
        null,
        undefined,
        123,
        'user name@domain.com' // espace
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    test('Devrait valider des mots de passe corrects', () => {
      const validPasswords = [
        'password123',
        'MotDePasse',
        '123456',
        'a'.repeat(100), // Très long
        'P@ssw0rd!'
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    test('Devrait rejeter des mots de passe incorrects', () => {
      const invalidPasswords = [
        'short', // Trop court
        '12345', // Trop court
        '',
        null,
        undefined,
        123
      ];

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });

  describe('validateName', () => {
    test('Devrait valider des noms corrects', () => {
      const validNames = [
        'Jean',
        'Marie-Claire',
        'Jean Dupont',
        'O\'Connor',
        'Al',
        'a'.repeat(100) // Exactement 100 caractères
      ];

      validNames.forEach(name => {
        expect(validateName(name)).toBe(true);
      });
    });

         test('Devrait rejeter des noms incorrects et gérer les espaces', () => {
       const invalidNames = [
         'A', '  A  ', '', '   ', 'a'.repeat(101), null, undefined, 123
       ];

       invalidNames.forEach(name => {
         expect(validateName(name)).toBe(false);
       });

       // Test des espaces
       expect(validateName('  Jean  ')).toBe(true);
       expect(validateName('  A  ')).toBe(false); // Trop court après trim
     });
  });

  describe('sanitizeString', () => {
    test('Devrait nettoyer les chaînes correctement', () => {
      const testCases = [
        { input: '  Hello World  ', expected: 'Hello World' },
        { input: 'Text<script>alert("hack")</script>', expected: 'Textscriptalert("hack")/script' },
        { input: 'Normal text', expected: 'Normal text' },
        { input: '', expected: '' },
        { input: '   ', expected: '' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeString(input)).toBe(expected);
      });
    });

         test('Devrait gérer valeurs invalides et caractères dangereux', () => {
       // Test des valeurs invalides
       const invalidInputs = [null, undefined, 123, {}, []];
       invalidInputs.forEach(input => {
         expect(sanitizeString(input)).toBe('');
       });

       // Test des caractères dangereux
       expect(sanitizeString('<>')).toBe('');
       expect(sanitizeString('Text<>More')).toBe('TextMore');
       expect(sanitizeString('<<>>')).toBe('');
     });
  });
}); 