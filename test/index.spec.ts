import { myPackage } from '../src/MB';

describe('index', () => {
  describe('myPackage', () => {
    it('should return a string containing the message', () => {
      const message = 'Hello';

      const result = myPackage(message);

      expect(result).toMatch(message);
    });
  });
});
