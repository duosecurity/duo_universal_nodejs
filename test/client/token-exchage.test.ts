// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, beforeAll } from 'vitest';
import axios from 'axios';
import { errors, SignJWT, decodeJwt } from 'jose';
import { Client, DuoException, constants, util } from '../../src';
import { AxiosError } from '../../src/axios-error';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};
const secret = new TextEncoder().encode(clientOps.clientSecret);
const username = 'username';
const code = util.generateRandomString(20);
const nonce = util.generateRandomString(20);

const createIdToken = async (
  removeKey: string | null = null,
  changeVal: Record<string, string | number> | null = null,
) => {
  const time = util.getTimeInSeconds();

  let payload: any = {
    exp: time + constants.JWT_EXPIRATION,
    iat: time,
    nbf: time,
    sub: username,
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

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: constants.SIG_ALGORITHM })
    .sign(secret);
};

const createTokenResult = async (token: string | null = null) => {
  return {
    id_token: token ?? (await createIdToken()),
    access_token: '12345678',
    expires_in: util.getTimeInSeconds(),
    token_type: 'Bearer',
  };
};

describe('Token Exchange', () => {
  let client: Client;

  beforeAll(() => {
    vi.spyOn(axios, 'create').mockReturnThis();

    client = new Client(clientOps);
  });

  it('should throw with missing code', async () => {
    expect.assertions(2);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult('', username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MISSING_CODE_ERROR);
    }
  });

  it('should throw with missing username', async () => {
    expect.assertions(2);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, '');
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.USERNAME_ERROR);
    }
  });

  it('should thrown when request has missing properties', async () => {
    expect.assertions(2);

    const { id_token, ...rest } = await createTokenResult();
    const response = { data: rest };
    vi.spyOn(axios, 'post').mockResolvedValue(response);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when request has bad token type', async () => {
    expect.assertions(2);

    const tokenResult = createTokenResult();
    const response = { data: { ...tokenResult, token_type: 'BadTokenType' } };
    vi.spyOn(axios, 'post').mockResolvedValue(response);

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should thrown when request has bad nonce', async () => {
    expect.assertions(2);

    const token = await createIdToken(null, { nonce: util.generateRandomString(10) });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username, nonce);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.NONCE_ERROR);
    }
  });

  it('should thrown when token has missing properties', async () => {
    expect.assertions(2);

    const token = await createIdToken('iss');
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
    }
  });

  it('should thrown when token has bad iss', async () => {
    expect.assertions(2);

    const token = await createIdToken(null, { iss: 'bad-iss' });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
    }
  });

  it('should thrown when token has bad exp', async () => {
    expect.assertions(3);

    const token = await createIdToken(null, {
      exp: util.getTimeInSeconds() - constants.JWT_EXPIRATION,
    });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
      expect(err.inner).toBeInstanceOf(errors.JWTExpired);
    }
  });

  it('should thrown when token has bad nbf', async () => {
    expect.assertions(3);

    const token = await createIdToken(null, {
      nbf: util.getTimeInSeconds() + constants.JWT_EXPIRATION,
    });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
      expect(err.inner).toBeInstanceOf(errors.JWTClaimValidationFailed);
    }
  });

  it('should thrown when token has bad aud', async () => {
    expect.assertions(2);

    const token = await createIdToken(null, { aud: 'bad-aud' });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
    }
  });

  it('should thrown when token has bad username', async () => {
    expect.assertions(2);

    const token = await createIdToken(null, { preferred_username: 'bad-username' });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.USERNAME_ERROR);
    }
  });

  it('should thrown when token expired', async () => {
    expect.assertions(3);

    const token = await createIdToken(null, {
      exp: util.getTimeInSeconds() - constants.JWT_LEEWAY * 2,
    });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.JWT_DECODE_ERROR);
      expect(err.inner).toBeInstanceOf(errors.JWTExpired);
    }
  });

  it('should thrown when token is missing exp', async () => {
    expect.assertions(2);

    const token = await createIdToken('exp');
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username, nonce);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
  });

  it('should allow small clock skew', async () => {
    const token = await createIdToken(null, {
      exp: util.getTimeInSeconds() - constants.JWT_LEEWAY / 2,
    });
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    const result = await client.exchangeAuthorizationCodeFor2FAResult(code, username);

    expect(result).toEqual(decodeJwt(token));
  });

  it('should return successful exchange', async () => {
    expect.assertions(1);

    const token = await createIdToken();
    const data = await createTokenResult(token);
    vi.spyOn(axios, 'post').mockResolvedValue({ data });

    const result = await client.exchangeAuthorizationCodeFor2FAResult(code, username);

    expect(result).toEqual(decodeJwt(token));
  });

  it('should thrown when http request failed (missing data)', async () => {
    expect.assertions(2);
    vi.spyOn(axios, 'post').mockImplementation(() =>
      Promise.reject(new AxiosError({ response: {} })),
    );

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
  });

  it('should thrown when http request failed (missing response)', async () => {
    expect.assertions(2);
    vi.spyOn(axios, 'post').mockImplementation(() => Promise.reject(new AxiosError()));

    try {
      await client.exchangeAuthorizationCodeFor2FAResult(code, username);
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
  });
});
