// SPDX-FileCopyrightText: 2021 Lukas Hroch
//
// SPDX-License-Identifier: MIT

import axios from 'axios';
import { Client, DuoException, constants, util } from '../../src';
import { AxiosError } from '../../src/axios-error';

const clientOps = {
  clientId: '12345678901234567890',
  clientSecret: '1234567890123456789012345678901234567890',
  apiHost: 'api-123456.duo.com',
  redirectUrl: 'https://redirect-example.com/callback',
};

const healthCheckGoodHttpRequest = { response: { timestamp: util.getTimeInSeconds() }, stat: 'OK' };
const healthCheckFailedHttpRequest = {
  code: 40002,
  message: 'invalid_client',
  message_detail: 'Failed to verify signature.',
  stat: 'FAIL',
  timestamp: util.getTimeInSeconds(),
};
const healthCheckHttpErrorResponse = {
  error: 'invalid_client',
  error_description: 'Failed to verify signature.',
};
const healthCheckMissingStatRequest = { response: { timestamp: util.getTimeInSeconds() } };
const healthCheckMissingMessageRequest = { stat: 'FAIL' };

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Health check', () => {
  let client: Client;

  beforeAll(() => {
    mockedAxios.create.mockReturnThis();
    // restore isAxiosError
    mockedAxios.isAxiosError.mockImplementation(
      (payload) => typeof payload === 'object' && payload.isAxiosError === true,
    );

    client = new Client(clientOps);
  });

  it('should thrown when request returned failed result', async () => {
    const response = { data: healthCheckFailedHttpRequest };
    mockedAxios.post.mockResolvedValue(response);

    await expect(client.healthCheck()).rejects.toBeInstanceOf(DuoException);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown when http request failed (includes data)', async () => {
    expect.assertions(3);
    const response = { data: healthCheckHttpErrorResponse };
    mockedAxios.post.mockImplementation(() => Promise.reject(new AxiosError({ response })));

    try {
      await client.healthCheck();
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown when http request failed (missing data)', async () => {
    expect.assertions(3);
    mockedAxios.post.mockImplementation(() => Promise.reject(new AxiosError()));

    try {
      await client.healthCheck();
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown when http request failed (missing response)', async () => {
    expect.assertions(3);
    mockedAxios.post.mockImplementation(() => Promise.reject(new AxiosError()));

    try {
      await client.healthCheck();
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown on generic error', async () => {
    expect.assertions(4);
    mockedAxios.post.mockImplementation(() => Promise.reject(new Error()));

    try {
      await client.healthCheck();
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.inner).toBeDefined();
      expect(err.inner).toBeInstanceOf(Error);
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown on unknown error', async () => {
    expect.assertions(3);
    mockedAxios.post.mockImplementation(() => Promise.reject({}));

    try {
      await client.healthCheck();
    } catch (err: any) {
      expect(err).toBeInstanceOf(DuoException);
      expect(err.message).toBe(constants.MALFORMED_RESPONSE);
    }
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown with missing response data #1', async () => {
    const response = { data: healthCheckMissingMessageRequest };
    mockedAxios.post.mockResolvedValue(response);

    await expect(client.healthCheck()).rejects.toBeInstanceOf(DuoException);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should thrown with missing response data #2', async () => {
    const response = { data: healthCheckMissingStatRequest };
    mockedAxios.post.mockResolvedValue(response);

    await expect(client.healthCheck()).rejects.toBeInstanceOf(DuoException);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should return correct health check response', async () => {
    const response = { data: healthCheckGoodHttpRequest };
    mockedAxios.post.mockResolvedValue(response);

    const healthCheck = await client.healthCheck();

    expect(healthCheck).toBe(response.data);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
