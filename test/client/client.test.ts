import axios from 'axios';
import { Client, DuoException, constants, util } from '../../src';

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
    const client = new Client(clientOps);

    expect(client).toBeInstanceOf(Client);
  });

  it('should throw during new client creation with short client ID', () => {
    const shortClientId = util.generateRandomString(constants.CLIENT_ID_LENGTH - 1);

    expect(() => new Client({ ...clientOps, clientId: shortClientId })).toThrowWithMessage(
      DuoException,
      constants.INVALID_CLIENT_ID_ERROR
    );
  });

  it('should throw during new client creation with long client ID', () => {
    const longClientId = util.generateRandomString(constants.CLIENT_ID_LENGTH + 1);

    expect(() => new Client({ ...clientOps, clientId: longClientId })).toThrowWithMessage(
      DuoException,
      constants.INVALID_CLIENT_ID_ERROR
    );
  });

  it('should throw during new client creation with short client secret', () => {
    const shortClientSecret = util.generateRandomString(constants.CLIENT_SECRET_LENGTH - 1);

    expect(() => new Client({ ...clientOps, clientSecret: shortClientSecret })).toThrowWithMessage(
      DuoException,
      constants.INVALID_CLIENT_SECRET_ERROR
    );
  });

  it('should throw during new client creation with long client secret', () => {
    const longClientSecret = util.generateRandomString(constants.CLIENT_SECRET_LENGTH + 1);

    expect(() => new Client({ ...clientOps, clientSecret: longClientSecret })).toThrowWithMessage(
      DuoException,
      constants.INVALID_CLIENT_SECRET_ERROR
    );
  });

  it('should throw during new client creation with invalid API host', () => {
    expect(() => new Client({ ...clientOps, apiHost: 'invalid.host.com' })).toThrowWithMessage(
      DuoException,
      constants.PARSING_CONFIG_ERROR
    );
  });

  it('should throw during new client creation with invalid redirect URL', () => {
    expect(() => new Client({ ...clientOps, redirectUrl: 'notAnUrl' })).toThrowWithMessage(
      DuoException,
      constants.PARSING_CONFIG_ERROR
    );
  });

  it('should generate state of correct length', () => {
    const client = new Client(clientOps);

    const state = client.generateState();

    expect(typeof state).toBe('string');
    expect(state.length).toBe(constants.DEFAULT_STATE_LENGTH);
  });
});
