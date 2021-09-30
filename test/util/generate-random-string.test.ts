import { util } from '../../src';

describe('utils', () => {
  it('should generate random string of given length', () => {
    const randomString = util.generateRandomString(36);

    expect(typeof randomString).toBe('string');
    expect(randomString.length).toBe(36);
  });

  it('should generate random strings', () => {
    expect(util.generateRandomString(36)).not.toBe(util.generateRandomString(36));
  });
});
