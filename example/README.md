# Duo Universal Node.js example

A simple Node.js web application that serves a logon page integrated with Duo 2FA.

## Setup

Clone the repository
```
git clone https://github.com/lukashroch/duo_universal_nodejs.git
```

Navigate to example folder
```
cd duo_universal_nodejs/example
```

Install dependencies
```
npm install
```

Copy .env-template file
```
cp .env-template .env
```

## Run the application

1. Copy the Client ID, Client Secret, and API Hostname values for your Web SDK application into the .env file

2. Start the application
```
npm run start
```

3. Navigate to http://localhost:3000

4. Log in with enrolled Duo user (any password will work, example doesn't verify first authentication step)
