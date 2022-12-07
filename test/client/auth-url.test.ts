// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { URL } from 'url';
import { ClientBuilder, DuoException, constants, util } from '../../src';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};
const username = 'username';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Authentication URL', () => {
  beforeAll(() => {
    mockedAxios.create.mockReturnThis();
  });

  it('should throw if state is short for authentication URL', () => {
    const client = new ClientBuilder(clientOps).build();
    const shortLengthState = util.generateRandomString(constants.MIN_STATE_LENGTH - 1);

    expect(() => {
      client.createAuthUrl(username, shortLengthState);
    }).toThrowWithMessage(DuoException, constants.DUO_STATE_ERROR);
  });

  it('should thrown if state is long for authentication URL', () => {
    const client = new ClientBuilder(clientOps).build();
    const longLengthState = util.generateRandomString(constants.MAX_STATE_LENGTH + 1);

    expect(() => {
      client.createAuthUrl(username, longLengthState);
    }).toThrowWithMessage(DuoException, constants.DUO_STATE_ERROR);
  });

  it('should throw if state is null for authentication URL', () => {
    const client = new ClientBuilder(clientOps).build();

    expect(() => {
      client.createAuthUrl(username, null as any);
    }).toThrowWithMessage(DuoException, constants.DUO_STATE_ERROR);
  });

  it('should throw if username is null for authentication URL', () => {
    const client = new ClientBuilder(clientOps).build();
    const state = client.generateState();

    expect(() => {
      client.createAuthUrl(null as any, state);
    }).toThrowWithMessage(DuoException, constants.DUO_USERNAME_ERROR);
  });

  it(`should create correct authentication URL (default 'useDuoCodeAttribute')`, () => {
    expect.assertions(7);

    const client = new ClientBuilder(clientOps).build();
    const state = client.generateState();

    const { host, protocol, pathname, searchParams } = new URL(
      client.createAuthUrl(username, state)
    );
    const request = searchParams.get('request');

    expect(host).toBe(clientOps.apiHost);
    expect(protocol).toBe('https:');
    expect(pathname).toBe(client.AUTHORIZE_ENDPOINT);

    expect(searchParams.get('client_id')).toBe(clientOps.clientId);
    expect(searchParams.get('redirect_uri')).toBe(clientOps.redirectUrl);

    expect(request).not.toBe(null);
    if (request) {
      const token = jwt.verify(request, clientOps.clientSecret, {
        algorithms: [constants.SIG_ALGORITHM],
      });
      expect((token as any).use_duo_code_attribute).toBe(true);
    }
  });

  it(`should create correct authentication URL (explicit 'useDuoCodeAttribute')`, () => {
    expect.assertions(7);

    const client = new ClientBuilder(clientOps).set_useDuoCodeAttribute(false).build();
    const state = client.generateState();

    const { host, protocol, pathname, searchParams } = new URL(
      client.createAuthUrl(username, state)
    );
    const request = searchParams.get('request');

    expect(host).toBe(clientOps.apiHost);
    expect(protocol).toBe('https:');
    expect(pathname).toBe(client.AUTHORIZE_ENDPOINT);

    expect(searchParams.get('client_id')).toBe(clientOps.clientId);
    expect(searchParams.get('redirect_uri')).toBe(clientOps.redirectUrl);

    expect(request).not.toBe(null);
    if (request) {
      const token = jwt.verify(request, clientOps.clientSecret, {
        algorithms: [constants.SIG_ALGORITHM],
      });
      expect((token as any).use_duo_code_attribute).toBe(false);
    }
  });
});
