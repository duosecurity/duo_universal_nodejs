import axios from 'axios';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Client, DuoException, constants, util } from '../../src';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};
const username = 'username';
const code = util.generateRandomString(20);
const nonce = util.generateRandomString(20);

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const createIdToken = (
  removeKey: string | null = null,
  changeVal: Record<string, string | number> | null = null
) => {
  const time = util.getTimeInSeconds();

  let payload: any = {
    exp: time + constants.JWT_EXPIRATION,
    iat: time,
    iss: `https://${clientOps.apiHost}/oauth/v1/token`,
    aud: clientOps.clientId,
    preferred_username: username,
    nonce,
  };

  if (removeKey) {
    const { [removeKey]: remove, ...rest } = payload;
    payload = { ...rest };
  }

  if (changeVal) payload = { ...payload, ...changeVal };

  return jwt.sign(payload, clientOps.clientSecret, { algorithm: constants.SIG_ALGORITHM });
};

const createTokenResult = (token: string | null = null) => {
  return {
    id_token: token ?? createIdToken(),
    access_token: '12345678',
    expires_in: util.getTimeInSeconds(),
    token_type: 'Bearer',
  };
};

describe('Token Exchange', () => {
  let client: Client;

  beforeAll(() => {
    mockedAxios.create.mockReturnThis();

    client = new Client(clientOps);
  });

  it('should throw with missing code', async () => {
    expect.assertions(2);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult('', username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MISSING_CODE_ERROR);
    }
  });

  it('should throw with missing username', async () => {
    expect.assertions(2);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, '');
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.USERNAME_ERROR);
    }
  });

  it('should thrown when request has missing properties', async () => {
    expect.assertions(2);

    const { id_token, ...rest } = createTokenResult();
    const response = { data: rest };
    mockedAxios.post.mockResolvedValue(response);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when request has bad token type', async () => {
    expect.assertions(2);

    const tokenResult = createTokenResult();
    const response = { data: { ...tokenResult, token_type: 'BadTokenType' } };
    mockedAxios.post.mockResolvedValue(response);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when request has bad nonce', async () => {
    expect.assertions(2);

    const token = createIdToken(null, { nonce: util.generateRandomString(10) });
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username, nonce);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.NONCE_ERROR);
    }
  });

  it('should thrown when token has missing properties', async () => {
    expect.assertions(2);

    const token = createIdToken('iss');
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when token has bad iss', async () => {
    expect.assertions(2);

    const token = createIdToken(null, { iss: 'bad-iss' });
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when token has bad aud', async () => {
    expect.assertions(2);

    const token = createIdToken(null, { aud: 'bad-aud' });
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when token has bad username', async () => {
    expect.assertions(2);

    const token = createIdToken(null, { preferred_username: 'bad-username' });
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.USERNAME_ERROR);
    }
  });

  it('should thrown when token expired', async () => {
    expect.assertions(3);

    const token = createIdToken(null, { exp: util.getTimeInSeconds() - constants.JWT_LEEWAY * 2 });
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
      expect(err.inner).toBeInstanceOf(TokenExpiredError);
    }
  });

  it('should allow small clock skew', async () => {
    const token = createIdToken(null, { exp: util.getTimeInSeconds() - constants.JWT_LEEWAY / 2 });
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    const result = await client.exchangeAuthorizationCodeFor2FAResult(code, username);

    expect(result).toEqual(jwt.decode(token));
  });

  it('should return successful exchange', async () => {
    expect.assertions(1);

    const token = createIdToken();
    const data = createTokenResult(token);
    mockedAxios.post.mockResolvedValue({ data });

    const result = await client.exchangeAuthorizationCodeFor2FAResult(code, username);

    expect(result).toEqual(jwt.decode(token));
  });

  it('should thrown when http request failed (missing data)', async () => {
    expect.assertions(3);
    mockedAxios.post.mockImplementation(() => Promise.reject({ response: {} }));

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown when http request failed (missing response)', async () => {
    expect.assertions(3);
    mockedAxios.post.mockImplementation(() => Promise.reject({}));

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
