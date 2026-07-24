// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import axios from 'axios';
import https from 'https';
import { beforeAll, describe, it, expect, vi, type MockInstance } from 'vitest';
import { Client, DuoException, constants, util } from '../../src';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};

describe('Client instance', () => {
  beforeAll(() => {
    vi.spyOn(axios, 'create').mockReturnThis();
  });

  it('should successfully create new Client', () => {
    const client = new Client(clientOps);

    expect(client).toBeInstanceOf(Client);
  });

  it('should throw during new client creation with short client ID', () => {
    const shortClientId = util.generateRandomString(constants.CLIENT_ID_LENGTH - 1);

    expect(() => new Client({ ...clientOps, clientId: shortClientId })).throw(
      DuoException,
      constants.INVALID_CLIENT_ID_ERROR,
    );
  });

  it('should throw during new client creation with long client ID', () => {
    const longClientId = util.generateRandomString(constants.CLIENT_ID_LENGTH + 1);

    expect(() => new Client({ ...clientOps, clientId: longClientId })).throw(
      DuoException,
      constants.INVALID_CLIENT_ID_ERROR,
    );
  });

  it('should throw during new client creation with short client secret', () => {
    const shortClientSecret = util.generateRandomString(constants.CLIENT_SECRET_LENGTH - 1);

    expect(() => new Client({ ...clientOps, clientSecret: shortClientSecret })).throw(
      DuoException,
      constants.INVALID_CLIENT_SECRET_ERROR,
    );
  });

  it('should throw during new client creation with long client secret', () => {
    const longClientSecret = util.generateRandomString(constants.CLIENT_SECRET_LENGTH + 1);

    expect(() => new Client({ ...clientOps, clientSecret: longClientSecret })).throw(
      DuoException,
      constants.INVALID_CLIENT_SECRET_ERROR,
    );
  });

  it('should throw during new client creation with invalid API host', () => {
    expect(() => new Client({ ...clientOps, apiHost: '' })).throw(
      DuoException,
      constants.PARSING_CONFIG_ERROR,
    );
  });

  it('should throw during new client creation with invalid redirect URL', () => {
    expect(() => new Client({ ...clientOps, redirectUrl: 'notAnUrl' })).throw(
      DuoException,
      constants.PARSING_CONFIG_ERROR,
    );
  });

  it('should generate state of correct length', () => {
    const client = new Client(clientOps);

    const state = client.generateState();

    expect(typeof state).toBe('string');
    expect(state.length).toBe(constants.DEFAULT_STATE_LENGTH);
  });
});

describe('User Agent', () => {
  let axiosCreateSpy: MockInstance;

  beforeAll(() => {
    axiosCreateSpy = vi.spyOn(axios, 'create').mockReturnThis();
  });

  it('User agent includes ca_bundle version and ca_pinning=enabled when pinning is on', () => {
    new Client(clientOps);

    const config = axiosCreateSpy.mock.lastCall?.[0];
    const ua = config?.headers?.['User-Agent'] as string;

    expect(ua).toContain(`ca_bundle/${constants.CA_BUNDLE_VERSION}`);
    expect(ua).toContain('(ca_pinning=enabled)');
  });

  it('User agent includes ca_pinning=disabled when pinning is off', () => {
    new Client({ ...clientOps, enableCAPinning: false });

    const config = axiosCreateSpy.mock.lastCall?.[0];
    const ua = config?.headers?.['User-Agent'] as string;

    expect(ua).toContain(`ca_bundle/${constants.CA_BUNDLE_VERSION}`);
    expect(ua).toContain('(ca_pinning=disabled)');
  });
});

describe('CA Pinning', () => {
  let agentSpy: MockInstance;

  beforeAll(() => {
    vi.spyOn(axios, 'create').mockReturnThis();
    agentSpy = vi.spyOn(https, 'Agent') as unknown as MockInstance;
  });

  it('CA pinning is enabled by default', () => {
    const client = new Client(clientOps);

    expect(client.enableCAPinning).toBe(true);
    expect(agentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ca: constants.DUO_PINNED_CERT,
        rejectUnauthorized: true,
      }),
    );
  });

  it('CA pinning can be disabled via constructor parameter', () => {
    const client = new Client({ ...clientOps, enableCAPinning: false });

    expect(client.enableCAPinning).toBe(false);
    expect(agentSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        ca: constants.DUO_PINNED_CERT,
      }),
    );
  });

  it('TLS verification is still enforced when CA pinning is disabled', () => {
    new Client({ ...clientOps, enableCAPinning: false });

    expect(agentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        rejectUnauthorized: true,
      }),
    );
  });
});
