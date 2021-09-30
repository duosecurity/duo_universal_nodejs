# Duo Universal Node.js library

[![Build Status](https://github.com/lukashroch/duo_universal_nodejs/workflows/Node.js%20CI/badge.svg)](https://github.com/lukashroch/duo_universal_nodejs/actions/workflows/nodejs-ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/lukashroch/duo_universal_nodejs.svg)](https://app.codecov.io/gh/lukashroch/duo_universal_nodejs)
![David](https://img.shields.io/david/lukashroch/duo_universal_nodejs)
[![GitHub license](https://img.shields.io/github/license/lukashroch/duo_universal_nodejs)](https://github.com/lukashroch/duo_universal_nodejs/blob/master/LICENSE)

Duo Web v4 SDK - Duo Universal Prompt implementation for Node.js

- follows [Duo Web v4 SDK](https://duo.com/docs/duoweb) implementation
- largely based on Duo Web v4 SDKs for [other languages](https://github.com/duosecurity)

## Installation

```
npm install duo_universal
```

## Usage

Read official Duo Web v4 SDK - Duo Universal Prompt docs (https://duo.com/docs/duoweb) to get familiar with the implementation details.

### 1. Import client

```ts
import { Client } from 'duo_universal';
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

Complete example of implementation can be found in [example folder](https://github.com/lukashroch/duo_universal_nodejs/tree/master/example). It's a simple express-based application. Please follow the README instructions in `example` folder to spin it up.

## Contribute

Fork the repository

Install dependencies
```
npm install
```

Make your proposed changes. Add tests if applicable, lint the code. Submit a pull request.

## Tests
```
npm test
```

## Lint
```
npm lint
```
