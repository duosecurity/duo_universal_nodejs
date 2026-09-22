# Duo Universal Node.js library

[![Build Status](https://github.com/duosecurity/duo_universal_nodejs/workflows/Node.js%20CI/badge.svg)](https://github.com/duosecurity/duo_universal_nodejs/actions/workflows/nodejs-ci.yml)
[![npm version](https://badge.fury.io/js/@duosecurity%2Fduo_universal.svg)](https://badge.fury.io/js/@duosecurity%2Fduo_universal)
[![GitHub license](https://img.shields.io/github/license/duosecurity/duo_universal_nodejs)](https://github.com/duosecurity/duo_universal_nodejs/blob/main/LICENSE)

This library allows a web developer to quickly add Duo's interactive, self-service, two-factor authentication to any Node.js web login form.

See our developer documentation at https://www.duosecurity.com/docs/duoweb for guidance on integrating Duo 2FA into your web application.

Duo especially thanks [Lukas Hroch](https://github.com/lukashroch) for creating the initial version of this library.

## Getting Started

This library requires Node.js LTS (v20 or later).

To use this client in your existing developing environment, install it with your package manager of choice.

```sh
npm install @duosecurity/duo_universal

pnpm add @duosecurity/duo_universal

yarn add @duosecurity/duo_universal
```

Once it's installed, see our developer documentation at https://duo.com/docs/duoweb and the `example` folder in this repo for guidance on integrating Duo 2FA into your web application.

### TLS 1.2 and 1.3 Support

Duo_universal_nodejs uses the Node tls library and OpenSSL for TLS operations. All versions of Node receiving security support (14 and higher) use OpenSSL 1.1.1 which supports TLS 1.2 and 1.3.

## Usage Details

### 1. Import client

```ts
import { Client } from '@duosecurity/duo_universal';
```

### 2. Create client

Creates new client instance. Provide your Duo Security application credentials and host URL. Include redirect URL to make a way back to your application.

```ts
const client = new Client({
    clientId: 'yourDuoApplicationClientId',
    clientSecret: 'yourDuoApplicationSecret',
    apiHost: 'api-12345678.duosecurity.com',
    redirectUrl: 'http://localhost:3000/redirect',
});
```

### 3. Heath check

Determines if Duo’s servers are accessible and available to accept the 2FA request.

```ts
const status = await client.healthCheck();
```

### 4. Generate state

Generates new state (random string) to link the with authentication attempt. Store appropriately, so you can retrieve/compare on callback.

```ts
const state = client.generateState();
```

### 5. Create authentication URL

Creates authentication URL to redirect user to Duo Security Universal prompt. Provide user identifier and state generated in previous step.

```ts
const authUrl = await client.createAuthUrl('username', 'state');
```

### 6. Token & code exchange

Exchanges received `duo code` from callback redirect for token result.

```ts
const token = await client.exchangeAuthorizationCodeFor2FAResult('duoCode', 'username');
```

### Optional: nonce

A nonce binds the authentication request to the resulting token. Generate one alongside the state,
store it with the state, and pass it to both calls — the returned token is then rejected unless its
`nonce` claim matches.

```ts
const state = client.generateState();
const nonce = client.generateNonce();
/* Store both against the user's session before redirecting. */

const authUrl = await client.createAuthUrl('username', state, { nonce });

/* On callback, after confirming the returned state matches the stored one: */
const token = await client.exchangeAuthorizationCodeFor2FAResult('duoCode', 'username', nonce);
```

A supplied nonce must be between `MIN_NONCE_LENGTH` (16) and `MAX_NONCE_LENGTH` (1024) characters,
otherwise a `DuoException` is thrown. Omit `nonce` entirely to leave the claim out of the request.

### Optional: additional authorization parameters

`createAuthUrl` accepts the remaining optional parameters documented for the authorization request.
Any option you omit is left out of the request entirely.

```ts
const authUrl = await client.createAuthUrl('username', state, {
  /* Shown to the user in the prompt and to the admin in the authentication log. */
  dest_app_name: 'Production Console',
  /* Long-lived unique identifier for the application being accessed. */
  dest_app_id: 'console-prod',
  /* Displayed in the Duo Mobile push request, when it differs from the username. */
  display_username: 'Sam Weber',
  /* Reauthenticate if the last interactive authentication is older than this many seconds. */
  max_age: 300,
  /* Always reauthenticate, even within an active Duo session. */
  prompt: 'login',
});
```

`max_age` must be a non-negative integer or a `DuoException` is thrown; `0` always forces an
interactive authentication. `prompt` accepts only `login`, the one value Duo supports.

## Example

A complete implementation example can be found in [`example/`](/example).
It's a simple express-based application.
Please follow the [`example/README.md`](/example/README.md) to spin it up.

## Contribute

Fork the repository

Install dependencies

```sh
pnpm install
```

Make your proposed changes. Add tests if applicable, lint the code. Submit a pull request.

## Tests

```sh
pnpm run test
```

## Lint

```sh
pnpm run lint
```
