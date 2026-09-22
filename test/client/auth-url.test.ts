// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest';
import { jwtVerify } from 'jose';
import { URL } from 'url';
import { Client, DuoException, constants, util } from '../../src';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};
const username = 'username';

/* Pull the signed `request` JWT out of an authorization URL and return its verified payload. */
const getRequestPayload = async (authUrl: string) => {
  const request = new URL(authUrl).searchParams.get('request');
  if (!request) throw new Error('authorization URL is missing the request parameter');

  const secret = new TextEncoder().encode(clientOps.clientSecret);
  const { payload } = await jwtVerify(request, secret, {
    algorithms: [constants.SIG_ALGORITHM],
  });

  return payload;
};

describe('Authentication URL', () => {
  it('should throw if state is short for authentication URL', async () => {
    const client = new Client(clientOps);
    const shortLengthState = util.generateRandomString(constants.MIN_STATE_LENGTH - 1);

    await expect(client.createAuthUrl(username, shortLengthState)).rejects.instanceOf(
      DuoException,
      constants.DUO_STATE_ERROR,
    );
  });

  it('should thrown if state is long for authentication URL', async () => {
    const client = new Client(clientOps);
    const longLengthState = util.generateRandomString(constants.MAX_STATE_LENGTH + 1);

    await expect(client.createAuthUrl(username, longLengthState)).rejects.instanceOf(
      DuoException,
      constants.DUO_STATE_ERROR,
    );
  });

  it('should throw if state is null for authentication URL', async () => {
    const client = new Client(clientOps);

    await expect(client.createAuthUrl(username, null as any)).rejects.instanceOf(
      DuoException,
      constants.DUO_STATE_ERROR,
    );
  });

  it('should throw if username is null for authentication URL', async () => {
    const client = new Client(clientOps);
    const state = client.generateState();

    await expect(client.createAuthUrl(null as any, state)).rejects.instanceOf(
      DuoException,
      constants.DUO_USERNAME_ERROR,
    );
  });

  it(`should create correct authentication URL (default 'useDuoCodeAttribute')`, async () => {
    expect.assertions(7);

    const client = new Client(clientOps);
    const secret = new TextEncoder().encode(clientOps.clientSecret);
    const state = client.generateState();

    const { host, protocol, pathname, searchParams } = new URL(
      await client.createAuthUrl(username, state),
    );
    const request = searchParams.get('request');

    expect(host).toBe(clientOps.apiHost);
    expect(protocol).toBe('https:');
    expect(pathname).toBe(client.AUTHORIZE_ENDPOINT);

    expect(searchParams.get('client_id')).toBe(clientOps.clientId);
    expect(searchParams.get('redirect_uri')).toBe(clientOps.redirectUrl);

    expect(request).not.toBe(null);
    if (request) {
      const token = await jwtVerify(request, secret, { algorithms: [constants.SIG_ALGORITHM] });
      expect(token.payload.use_duo_code_attribute).toBe(true);
    }
  });

  it(`should create correct authentication URL (explicit 'useDuoCodeAttribute')`, async () => {
    expect.assertions(7);

    const client = new Client({ ...clientOps, useDuoCodeAttribute: false });
    const secret = new TextEncoder().encode(clientOps.clientSecret);
    const state = client.generateState();

    const { host, protocol, pathname, searchParams } = new URL(
      await client.createAuthUrl(username, state),
    );
    const request = searchParams.get('request');

    expect(host).toBe(clientOps.apiHost);
    expect(protocol).toBe('https:');
    expect(pathname).toBe(client.AUTHORIZE_ENDPOINT);

    expect(searchParams.get('client_id')).toBe(clientOps.clientId);
    expect(searchParams.get('redirect_uri')).toBe(clientOps.redirectUrl);

    expect(request).not.toBe(null);
    if (request) {
      const token = await jwtVerify(request, secret, { algorithms: [constants.SIG_ALGORITHM] });
      expect(token.payload.use_duo_code_attribute).toBe(false);
    }
  });

  it('should omit the nonce claim when no nonce is supplied', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);
    const state = client.generateState();

    const request = await getRequestPayload(await client.createAuthUrl(username, state));

    expect(request).not.toHaveProperty('nonce');
  });

  it('should include the supplied nonce in the request JWT', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);
    const state = client.generateState();
    const nonce = client.generateNonce();

    const request = await getRequestPayload(await client.createAuthUrl(username, state, { nonce }));

    expect(request.nonce).toBe(nonce);
  });

  it('should throw if nonce is short for authentication URL', async () => {
    expect.assertions(2);

    const client = new Client(clientOps);
    const nonce = util.generateRandomString(constants.MIN_NONCE_LENGTH - 1);

    try {
      await client.createAuthUrl(username, client.generateState(), { nonce });
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.DUO_NONCE_ERROR);
    }
  });

  it('should throw if nonce is long for authentication URL', async () => {
    expect.assertions(2);

    const client = new Client(clientOps);
    const nonce = util.generateRandomString(constants.MAX_NONCE_LENGTH + 1);

    try {
      await client.createAuthUrl(username, client.generateState(), { nonce });
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.DUO_NONCE_ERROR);
    }
  });

  it('should throw if nonce is an empty string for authentication URL', async () => {
    expect.assertions(2);

    const client = new Client(clientOps);

    try {
      await client.createAuthUrl(username, client.generateState(), { nonce: '' });
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.DUO_NONCE_ERROR);
    }
  });

  it('should include dest_app_name in the request JWT when supplied', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState(), {
        dest_app_name: 'Production Console',
      }),
    );

    expect(request.dest_app_name).toBe('Production Console');
  });

  it('should include dest_app_id in the request JWT when supplied', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState(), { dest_app_id: 'app-42' }),
    );

    expect(request.dest_app_id).toBe('app-42');
  });

  it('should include display_username in the request JWT when supplied', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState(), {
        display_username: 'Sam Weber',
      }),
    );

    expect(request.display_username).toBe('Sam Weber');
  });

  it('should include max_age in the request JWT when supplied', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState(), { max_age: 300 }),
    );

    expect(request.max_age).toBe(300);
  });

  it('should include a max_age of zero, which forces interactive authentication', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState(), { max_age: 0 }),
    );

    expect(request.max_age).toBe(0);
  });

  it('should throw if max_age is negative', async () => {
    expect.assertions(2);

    const client = new Client(clientOps);

    try {
      await client.createAuthUrl(username, client.generateState(), { max_age: -1 });
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.DUO_MAX_AGE_ERROR);
    }
  });

  it('should throw if max_age is not an integer', async () => {
    expect.assertions(2);

    const client = new Client(clientOps);

    try {
      await client.createAuthUrl(username, client.generateState(), { max_age: 1.5 });
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.DUO_MAX_AGE_ERROR);
    }
  });

  it('should include prompt in the request JWT when supplied', async () => {
    expect.assertions(1);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState(), { prompt: 'login' }),
    );

    expect(request.prompt).toBe('login');
  });

  it('should omit the optional authorize claims when they are not supplied', async () => {
    expect.assertions(5);

    const client = new Client(clientOps);

    const request = await getRequestPayload(
      await client.createAuthUrl(username, client.generateState()),
    );

    expect(request).not.toHaveProperty('dest_app_name');
    expect(request).not.toHaveProperty('dest_app_id');
    expect(request).not.toHaveProperty('display_username');
    expect(request).not.toHaveProperty('max_age');
    expect(request).not.toHaveProperty('prompt');
  });
});
