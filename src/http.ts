export type ClientPayload = {
  iss: string;
  sub: string;
  aud: string;
  jti: string;
  exp: number;
  iat: number;
};

export type ErrorResponse = {
  error?: string;
  error_description?: string;
};

export type HealthCheckRequest = {
  client_id: string;
  client_assertion: string;
};

export type HealthCheckResponse = {
  stat: string;
  response: { timestamp: number };
  code?: number;
  timestamp?: number;
  message?: string;
  message_detail?: string;
};

export type AuthorizationRequest = {
  response_type: string;
  client_id: string;
  request: string;
  redirect_uri?: string;
  scope?: string;
  nonce?: string;
  state?: string;
};

export type AuthorizationRequestPayload = {
  response_type: string;
  scope: string;
  exp: number;
  client_id: string;
  redirect_uri: string;
  state: string;
  duo_uname: string;
  iss?: string;
  aud?: string;
  nonce?: string;
  use_duo_code_attribute?: boolean;
};

export type AuthorizationResponse = {
  code: string;
  state: string;
};

export type TokenRequest = {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_assertion_type: string;
  client_assertion: string;
  client_id: string;
};

export type TokenResponse = {
  id_token: string;
  access_token: string;
  expires_in: string;
  token_type: string;
};

export type Location = {
  city: string;
  state: string;
  country: string;
};

export type TokenResponsePayload = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time: number;
  auth_result: { result: string; status: string; status_msg: string };
  auth_context: {
    txid: string;
    timestamp: number;
    user: { name: string; key: string | null; groups: string[] };
    application: { name: string; key: string };
    auth_device: { ip: string | null; location: Location; name: string | null };
    access_device: {
      ip: string;
      location: Location;
      hostname: string | null;
      epkey: string | null;
    };
    factor: string;
    event_type: string;
    result: string;
    reason: string;
    alias: string;
    isotimestamp: string;
    email: string | null;
    ood_software: string | null;
  };
  preferred_username?: string;
  nonce?: string;
};
