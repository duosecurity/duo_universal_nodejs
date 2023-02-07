# Duo Universal Node.js library

[![Build Status](https://github.com/duosecurity/duo_universal_nodejs/workflows/Node.js%20CI/badge.svg)](https://github.com/duosecurity/duo_universal_nodejs/actions/workflows/nodejs-ci.yml)
[![npm version](https://badge.fury.io/js/@duosecurity%2Fduo_universal.svg)](https://badge.fury.io/js/@duosecurity%2Fduo_universal)
[![GitHub license](https://img.shields.io/github/license/duosecurity/duo_universal_nodejs)](https://github.com/duosecurity/duo_universal_nodejs/blob/main/LICENSE)

This library allows a web developer to quickly add Duo's interactive, self-service, two-factor authentication to any Node.js web login form.

See our developer documentation at https://www.duosecurity.com/docs/duoweb for guidance on integrating Duo 2FA into your web application.

Duo especially thanks [Lukas Hroch](https://github.com/lukashroch) for creating the initial version of this library.

## Getting Started

This library requires Node.js v14 or later.

To use this client in your existing developing environment, install it from NPM

```sh
npm install @duosecurity/duo_universal
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
const authUrl = client.createAuthUrl('username', 'state');
```

### 6. Token & code exchange

Exchanges received `duo code` from callback redirect for token result.

```ts
const token = await client.exchangeAuthorizationCodeFor2FAResult('duoCode', 'username');
```

## Example

A complete implementation example can be found in [`example/`](/example).
It's a simple express-based application.
Please follow the [`example/README.md`](/example/README.md) to spin it up.

## Contribute

Fork the repository

Install dependencies

```sh
npm install
```

Make your proposed changes. Add tests if applicable, lint the code. Submit a pull request.

## Tests

```sh
npm run test
```

## Lint

```sh
npm run lint
```
