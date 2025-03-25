// SPDX-FileCopyrightText: 2021 Lukas Hroch
// SPDX-FileCopyrightText: 2022 Cisco Systems, Inc. and/or its affiliates
//
// SPDX-License-Identifier: MIT

import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { SignJWT, jwtVerify } from 'jose';
import * as constants from './constants';
import { DuoException } from './duo-exception';
import {
  AuthorizationRequest,
  AuthorizationRequestPayload,
  HealthCheckRequest,
  HealthCheckResponse,
  TokenRequest,
  TokenResponse,
  TokenResponsePayload,
} from './http';
import { generateRandomString, getTimeInSeconds } from './util';

export type ClientOptions = {
  clientId: string;
  clientSecret: string;
  apiHost: string;
  redirectUrl: string;
  useDuoCodeAttribute?: boolean;
};

export class Client {
  readonly HEALTH_CHECK_ENDPOINT = '/oauth/v1/health_check';

  readonly AUTHORIZE_ENDPOINT = '/oauth/v1/authorize';

  readonly TOKEN_ENDPOINT = '/oauth/v1/token';

  private clientId: string;

  private clientSecret: Uint8Array;

  private apiHost: string;

  private baseURL: string;

  private redirectUrl: string;

  private useDuoCodeAttribute: boolean;

  private axios: AxiosInstance;

  constructor(options: ClientOptions) {
    this.validateInitialConfig(options);

    const { clientId, clientSecret, apiHost, redirectUrl, useDuoCodeAttribute } = options;

    this.clientId = clientId;
    this.clientSecret = new TextEncoder().encode(clientSecret);
    this.apiHost = apiHost;
    this.baseURL = `https://${this.apiHost}`;
    this.redirectUrl = redirectUrl;
    this.useDuoCodeAttribute = useDuoCodeAttribute ?? true;

    const agent = new https.Agent({
      ca: constants.DUO_PINNED_CERT,
    });

    this.axios = axios.create({
      baseURL: this.baseURL,
      httpsAgent: agent,
      httpAgent: Error('HTTP disabled. Must use HTTPS'),
    });
  }

  /**
   * Validate that the clientId and clientSecret are the proper length.
   *
   * @private
   * @param {ClientOptions} options
   * @memberof Client
   */
  private validateInitialConfig(options: ClientOptions): void {
    const { clientId, clientSecret, apiHost, redirectUrl } = options;

    if (clientId.length !== constants.CLIENT_ID_LENGTH)
      throw new DuoException(constants.INVALID_CLIENT_ID_ERROR);

    if (clientSecret.length !== constants.CLIENT_SECRET_LENGTH)
      throw new DuoException(constants.INVALID_CLIENT_SECRET_ERROR);

    if (apiHost === '') throw new DuoException(constants.PARSING_CONFIG_ERROR);
    try {
      new globalThis.URL(redirectUrl);
    } catch {
      throw new DuoException(constants.PARSING_CONFIG_ERROR);
    }
  }

  /**
   * Retrieves exception message for DuoException from HTTPS result message.
   *
   * @private
   * @param {*} result
   * @returns {string}
   * @memberof Client
   */
  private getExceptionFromResult(result: any): string {
    const { message, message_detail, error, error_description } = result;

    if (message && message_detail) return `${message}: ${message_detail}`;

    if (error && error_description) return `${error}: ${error_description}`;

    return constants.MALFORMED_RESPONSE;
  }

  /**
   * Create client JWT payload
   *
   * @private
   * @param {string} audience
   * @returns {string}
   * @memberof Client
   */
  private async createJwtPayload(audience: string): Promise<string> {
    const timeInSecs = getTimeInSeconds();

    const jwt = await new SignJWT({
      iss: this.clientId,
      sub: this.clientId,
      aud: audience,
      jti: generateRandomString(constants.JTI_LENGTH),
      iat: timeInSecs,
      exp: timeInSecs + constants.JWT_EXPIRATION,
    })
      .setProtectedHeader({ alg: constants.SIG_ALGORITHM })
      .sign(this.clientSecret);

    return jwt;
  }

  /**
   * Verify JWT token
   *
   * @private
   * @template T
   * @param {string} token
   * @returns {Promise<T>}
   * @memberof Client
   */
  private async verifyToken<T>(token: string): Promise<T> {
    const tokenEndpoint = `${this.baseURL}${this.TOKEN_ENDPOINT}`;
    const clientId = this.clientId;
    try {
      const decoded = await jwtVerify<T>(token, this.clientSecret, {
        algorithms: [constants.SIG_ALGORITHM],
        clockTolerance: constants.JWT_LEEWAY,
        issuer: tokenEndpoint,
        audience: clientId,
      });

      return decoded.payload;
    } catch (err) {
      throw new DuoException(constants.JWT_DECODE_ERROR, err instanceof Error ? err : undefined);
    }
  }

  /**
   * Error handler to throw relevant error
   *
   * @private
   * @param {unknown} error
   * @returns {never}
   * @memberof Client
   */
  private handleErrorResponse(error: unknown): never {
    if (error instanceof DuoException) throw error;

    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      throw new DuoException(data ? this.getExceptionFromResult(data) : error.message, error);
    }

    if (error instanceof Error) throw new DuoException(error.message, error);

    throw new DuoException(constants.MALFORMED_RESPONSE);
  }

  /**
   * Generate a random hex string with a length of DEFAULT_STATE_LENGTH.
   *
   * @returns {string}
   * @memberof Client
   */
  generateState(): string {
    return generateRandomString(constants.DEFAULT_STATE_LENGTH);
  }

  /**
   * Makes a call to HEALTH_CHECK_ENDPOINT to see if Duo is available.
   *
   * @returns {Promise<HealthCheckResponse>}
   * @memberof Client
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const audience = `${this.baseURL}${this.HEALTH_CHECK_ENDPOINT}`;
    const jwtPayload = await this.createJwtPayload(audience);
    const request: HealthCheckRequest = {
      client_id: this.clientId,
      client_assertion: jwtPayload,
    };

    try {
      const { data } = await this.axios.post<HealthCheckResponse>(
        this.HEALTH_CHECK_ENDPOINT,
        new globalThis.URLSearchParams(request),
      );
      const { stat } = data;

      if (!stat || stat !== 'OK') throw new DuoException(this.getExceptionFromResult(data));

      return data;
    } catch (err) {
      this.handleErrorResponse(err);
    }
  }

  /**
   * Generate URI to redirect to for the Duo prompt.
   *
   * @param {string} username
   * @param {string} state
   * @returns {string}
   * @memberof Client
   */
  async createAuthUrl(username: string, state: string): Promise<string> {
    if (!username) throw new DuoException(constants.DUO_USERNAME_ERROR);

    if (
      !state ||
      state.length < constants.MIN_STATE_LENGTH ||
      state.length > constants.MAX_STATE_LENGTH
    )
      throw new DuoException(constants.DUO_STATE_ERROR);

    const timeInSecs = getTimeInSeconds();

    const payload: AuthorizationRequestPayload = {
      response_type: 'code',
      scope: 'openid',
      exp: timeInSecs + constants.JWT_EXPIRATION,
      client_id: this.clientId,
      redirect_uri: this.redirectUrl,
      state,
      duo_uname: username,
      iss: this.clientId,
      aud: this.baseURL,
      use_duo_code_attribute: this.useDuoCodeAttribute,
    };

    const request = await new SignJWT(payload)
      .setProtectedHeader({ alg: constants.SIG_ALGORITHM })
      .sign(this.clientSecret);

    const query: AuthorizationRequest = {
      response_type: 'code',
      client_id: this.clientId,
      request: request,
      redirect_uri: this.redirectUrl,
      scope: 'openid',
    };

    return `${this.baseURL}${this.AUTHORIZE_ENDPOINT}?${new globalThis.URLSearchParams(query).toString()}`;
  }

  /**
   * Exchange a code returned by Duo for a token that contains information about the authorization.
   *
   * @param {string} code
   * @param {string} username
   * @param {(string | null)} [nonce=null]
   * @returns {Promise<TokenResponsePayload>}
   * @memberof Client
   */
  async exchangeAuthorizationCodeFor2FAResult(
    code: string,
    username: string,
    nonce: string | null = null,
  ): Promise<TokenResponsePayload> {
    if (!code) throw new DuoException(constants.MISSING_CODE_ERROR);

    if (!username) throw new DuoException(constants.USERNAME_ERROR);

    const tokenEndpoint = `${this.baseURL}${this.TOKEN_ENDPOINT}`;
    const jwtPayload = await this.createJwtPayload(tokenEndpoint);

    const request: TokenRequest = {
      grant_type: constants.GRANT_TYPE,
      code,
      redirect_uri: this.redirectUrl,
      client_id: this.clientId,
      client_assertion_type: constants.CLIENT_ASSERTION_TYPE,
      client_assertion: jwtPayload,
    };

    try {
      const { data } = await this.axios.post<TokenResponse>(
        this.TOKEN_ENDPOINT,
        new globalThis.URLSearchParams(request),
        {
          headers: {
            'user-agent': `${constants.USER_AGENT} node/${process.versions.node} v8/${process.versions.v8}`,
          },
        },
      );

      /* Verify that we are receiving the expected response from Duo */
      const resultKeys = Object.keys(data);
      const requiredKeys = ['id_token', 'access_token', 'expires_in', 'token_type'];

      if (requiredKeys.some((key) => !resultKeys.includes(key)))
        throw new DuoException(constants.MALFORMED_RESPONSE);

      if (data.token_type !== 'Bearer') throw new DuoException(constants.MALFORMED_RESPONSE);

      const token = await this.verifyToken<TokenResponsePayload>(data.id_token);

      const tokenKeys = Object.keys(token);
      const requiredTokenKeys = ['exp', 'iat', 'iss', 'aud'];

      if (requiredTokenKeys.some((key) => !tokenKeys.includes(key)))
        throw new DuoException(constants.MALFORMED_RESPONSE);

      if (!token.preferred_username || token.preferred_username !== username)
        throw new DuoException(constants.USERNAME_ERROR);

      if (nonce && (!token.nonce || token.nonce !== nonce))
        throw new DuoException(constants.NONCE_ERROR);

      return token;
    } catch (err) {
      this.handleErrorResponse(err);
    }
  }
}
