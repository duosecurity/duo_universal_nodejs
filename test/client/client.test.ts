// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import axios from 'axios';
import { beforeAll, describe, it, expect, vi } from 'vitest';
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
