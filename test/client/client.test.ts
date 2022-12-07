// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import axios from 'axios';
import { Client, ClientBuilder, DuoException, constants, util } from '../../src';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Client instance', () => {
  beforeAll(() => {
    mockedAxios.create.mockReturnThis();
  });

  it('should successfully create new Client', () => {
    const client = new ClientBuilder(clientOps).build();

    expect(client).toBeInstanceOf(Client);
  });

  it('should throw during new client creation with short client ID', () => {
    const shortClientId = util.generateRandomString(constants.CLIENT_ID_LENGTH - 1);

    expect(() =>
      new ClientBuilder({ ...clientOps, clientId: shortClientId }).build()
    ).toThrowWithMessage(DuoException, constants.INVALID_CLIENT_ID_ERROR);
  });

  it('should throw during new client creation with long client ID', () => {
    const longClientId = util.generateRandomString(constants.CLIENT_ID_LENGTH + 1);

    expect(() =>
      new ClientBuilder({ ...clientOps, clientId: longClientId }).build()
    ).toThrowWithMessage(DuoException, constants.INVALID_CLIENT_ID_ERROR);
  });

  it('should throw during new client creation with short client secret', () => {
    const shortClientSecret = util.generateRandomString(constants.CLIENT_SECRET_LENGTH - 1);

    expect(() =>
      new ClientBuilder({ ...clientOps, clientSecret: shortClientSecret }).build()
    ).toThrowWithMessage(DuoException, constants.INVALID_CLIENT_SECRET_ERROR);
  });

  it('should throw during new client creation with long client secret', () => {
    const longClientSecret = util.generateRandomString(constants.CLIENT_SECRET_LENGTH + 1);

    expect(() =>
      new ClientBuilder({ ...clientOps, clientSecret: longClientSecret }).build()
    ).toThrowWithMessage(DuoException, constants.INVALID_CLIENT_SECRET_ERROR);
  });

  it('should throw during new client creation with invalid API host', () => {
    expect(() => new ClientBuilder({ ...clientOps, apiHost: '' }).build()).toThrowWithMessage(
      DuoException,
      constants.PARSING_CONFIG_ERROR
    );
  });

  it('should throw during new client creation with invalid redirect URL', () => {
    expect(() =>
      new ClientBuilder({ ...clientOps, redirectUrl: 'notAnUrl' }).build()
    ).toThrowWithMessage(DuoException, constants.PARSING_CONFIG_ERROR);
  });

  it('should generate state of correct length', () => {
    const client = new ClientBuilder(clientOps).build();

    const state = client.generateState();

    expect(typeof state).toBe('string');
    expect(state.length).toBe(constants.DEFAULT_STATE_LENGTH);
  });
});
