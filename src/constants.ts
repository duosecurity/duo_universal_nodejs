import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));

export const CLIENT_ID_LENGTH = 20;
export const CLIENT_SECRET_LENGTH = 40;
export const DEFAULT_STATE_LENGTH = 36;
export const MAX_STATE_LENGTH = 1024;
export const MIN_STATE_LENGTH = 22;
export const JTI_LENGTH = 36;
export const JWT_EXPIRATION = 300;
export const JWT_LEEWAY = 60;

export const USER_AGENT = `duo_universal_node/${pkg.version}`;
export const SIG_ALGORITHM = 'HS512';
export const GRANT_TYPE = 'authorization_code';
export const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

export const USERNAME_ERROR = 'The username is invalid';
export const NONCE_ERROR = 'The nonce is invalid';
export const JWT_DECODE_ERROR = 'Error decoding JWT';
export const PARSING_CONFIG_ERROR = 'Error parsing config';
export const INVALID_CLIENT_ID_ERROR = 'The Client ID is invalid';
export const INVALID_CLIENT_SECRET_ERROR = 'The Client Secret is invalid';
export const DUO_STATE_ERROR = `State must be between ${MIN_STATE_LENGTH} to ${MAX_STATE_LENGTH} characters long`;
export const FAILED_CONNECTION = 'Unable to connect to Duo';
export const MALFORMED_RESPONSE = 'Result missing expected data';
export const MISSING_CODE_ERROR = 'Missing authorization code';
