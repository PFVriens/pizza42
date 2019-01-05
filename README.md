# Pizza 42

This Proof-of-Concept was created as the result of a technical challenge.

It demonstrates the following:

- [x] Show how a new customer can sign up and an existing customer can sign in with email/password or Google
- [x] Ensure that if a customer signs in with either an email/password or Google, it will be treated as the same user if they use the same email address
- [x] Show that the solution can be built as a “modern” web application (SPA) which can then securely call the API backend of Pizza 42 using OAuth.
- [x] Require that a customer has a verified email address before they can place a pizza order, but they should still be able to sign into the app.
- [ ] Use Auth0 features to gather additional information about a user (specifically their gender) without prompting them directly.<br/><br/>Gender is not asked for during email/password registration but could be provided through a social provider like Google.  
    - [x] Gender is shown when the user wants to see his profile for a Google Account at Auth0. <br/>**Note: Regardless of whether the scope 'gender' is added.**
- [ ] Use Auth0 to call the Google People API to fetch the total number of Google connections a user has and store that count in their user profile.<br/><br/>Google could store the residences of  user and a user can control [if/what others can see.](https://aboutme.google.com)
    - [x] The backend of this PoC fetches the residences (if any) and stores this in the user profile

## Getting Started

If you haven't already done so, [sign up](https://auth0.com) for your free Auth0 account.

Create a new 'Single Page Web App' Application in the [dashboard](https://manage.auth0.com/#/applications). Find the **Domain** and **Client ID** from the Settings area and add the URL for your application to the **Allowed Callback URLs** box. If you are serving the application with the provided `serve` library, that URL is `http://localhost:3000`.

Create a new 'Machine to Machine App' Application and authorize this application to request access tokens for the 'Auth0 Management API'. Note down the **Client ID** and **Client Secret** as you will need those for configuring later on. The scopes that need to be granted for the 'Auth0 Management API' API:
- read:users and update:users
- read:user_idp_tokens
- create:users_app_metadata, read:users_app_metadata and update:users_app_metadata

If you haven't already done so, create a new API in the [APIs section](https://manage.auth0.com/#/apis) and provide an identifier for it (you will use this as the **AUTH0_AUDIENCE** later on). The following scopes will be needed for this PoC:
- read:messages
- read:users

Clone the repo directly from GitHub and install npm:

```bash
git clone https://github.com/PFVriens/pizza42.git
cd pizza42
npm install
```

## Set the Client ID, Domain, and API URL

### Set up the `auth0-variables.js` file

Rename the `auth0-variables.js.example` file to `auth0-variables.js` and provide the **Client ID** (as `AUTH0_CLIENT_ID`) and **Domain** (as `AUTH0_DOMAIN`) there.

You should also provide the identifier for the API you create in the Auth0 dashboard as your **identifier** (as `AUTH0_AUDIENCE`).

### Set Up the `.env` file

In addition to the above-mentioned `auth0-variables.js` file, a `.env.example` file is provided at the root of the application; rename this file to `.env`. This file provides your application's credentials to the small Node server located in `server.js`.

This file has four values, `AUTH0_AUDIENCE`, `AUTH0_DOMAIN`, `AUTH0_M2MAPP_CLIENT_ID` and `AUTH0_M2MAPP_CLIENT_SECRET`. The value for `AUTH0_AUDIENCE` is the identifier used for an API that you create in the Auth0 dashboard. `AUTH0_DOMAIN` is your domain and the same as the one used in the `auth0-variables.js` file.

## Run the Application

The `serve` module provided with this sample can be run with the `start` command.

```bash
npm start
```

The application will be served at `http://localhost:3000`.

## Run the Application With Docker

In order to run the example with docker you need to have `docker` installed.

You also need to set the environment variables as explained [previously](#set-the-client-id-domain-and-api-url).

Execute in command line `sh exec.sh` to run the Docker in Linux, or `.\exec.ps1` to run the Docker in Windows.

## What is Auth0?

[Auth0](https://auth0.com) helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, among others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE.txt) file for more info.


