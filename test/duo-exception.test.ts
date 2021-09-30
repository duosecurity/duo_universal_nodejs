import { DuoException } from '../src';

describe('DuoException', () => {
  it('should create DuoException with inner error', () => {
    class InnerError extends Error {}

    const innerError = new InnerError('InnerError error message');
    const duoException = new DuoException('DuoException error message', innerError);

    expect(duoException).toBeInstanceOf(DuoException);
    expect(duoException.name).toBe('DuoException');
    expect(duoException.message).toBe('DuoException error message');
    expect(duoException.inner).toBeInstanceOf(InnerError);
    expect(duoException.inner?.message).toBe('InnerError error message');
  });

  it('should create DuoException without inner error', () => {
    const duoException = new DuoException('DuoException error message');

    expect(duoException).toBeInstanceOf(DuoException);
    expect(duoException.name).toBe('DuoException');
    expect(duoException.message).toBe('DuoException error message');
    expect(duoException.inner).toBeUndefined();
  });
});
