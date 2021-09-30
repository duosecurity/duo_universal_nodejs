import { util } from '../../src/';

describe('utils', () => {
  const testTimeInMs = 1623060957123;
  const testTimeInSecs = 1623060957;

  const RealDate = Date;

  beforeEach(() => {
    global.Date.now = jest.fn(() => new Date(testTimeInMs).getTime());
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  it('should get timestamp in seconds', () => {
    const time = util.getTimeInSeconds();

    expect(time).toBe(testTimeInSecs);
  });
});
