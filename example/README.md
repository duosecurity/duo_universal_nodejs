# Duo Universal Node.js example

A simple Node.js web application that serves a logon page integrated with Duo 2FA.

## Setup

Clone the repository
```
git clone https://github.com/duosecurity/duo_universal_nodejs.git
```

Navigate to example folder
```
cd duo_universal_nodejs/example
```

## Run the application

1. Copy the Client ID, Client Secret, and API Hostname values for your Web SDK application into `src/config.js`

2. Start the application
```
pnpm start
```

3. Navigate to http://localhost:3000

4. Log in with enrolled Duo user (any password will work, example doesn't verify first authentication step)
