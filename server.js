const moment = require('moment');
const request = require('request');
const express = require('express');
const app = require('express')();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const axios = require("axios");
const async = require('async');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE || !process.env.AUTH0_M2MAPP_CLIENT_ID || !process.env.AUTH0_M2MAPP_CLIENT_SECRET) {
    throw 'Make sure you have AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_M2MAPP_CLIENT_ID and AUTH0_M2MAPP_CLIENT_SECRET in your .env file'
}

const AUTH0_DOMAIN_URL = 'https://' + process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const AUTH0_M2MAPP_CLIENT_ID = process.env.AUTH0_M2MAPP_CLIENT_ID;
const AUTH0_M2MAPP_CLIENT_SECRET = process.env.AUTH0_M2MAPP_CLIENT_SECRET;

const AUTH0_ISSUER = AUTH0_DOMAIN_URL + '/';
const AUTH0_MGMT_AUDIENCE = AUTH0_DOMAIN_URL + '/api/v2/';
const AUTH0_WELLKNOWN = AUTH0_DOMAIN_URL + '/.well-known/jwks.json';
const AUTH0_MGMT_TOKEN_API = AUTH0_DOMAIN_URL + '/oauth/token';
const AUTH0_MGMT_USERS_API = AUTH0_DOMAIN_URL + '/api/v2/users';

const GOOGLE_PEOPLE_API = 'https://people.googleapis.com/v1/people/me';

app.use(cors());

const checkJwt = jwt({
    // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: AUTH0_WELLKNOWN
    }),

    // Validate the audience and the issuer.
    audience: AUTH0_AUDIENCE,
    issuer: AUTH0_ISSUER,
    algorithms: ['RS256']
});

const checkScopes = jwtAuthz(['read:messages']);

app.get('/api/public', function(req, res) {
    res.json({
        message: "Hello from a public endpoint! You don't need to be authenticated to see this."
    });
});

app.get('/api/private', function(req, res) {
    console.log('Query: ' + req.query.id);
    res.json({
        message: "Hello from a secured endpoint! You need to be authenticated and have a scope of read:messages to see this."
    });
});

app.get('/api/update_user', checkJwt, checkScopes, function(req, res) {
    var userId = req.query.id;
    var auth0AccessToken;
    var googleResidences = [];

    async.waterfall([
            function getAuth0AccessToken(done) {

                axios({
                        method: 'POST',
                        url: AUTH0_MGMT_TOKEN_API,
                        headers: {
                            'content-type': 'application/json'
                        },
                        data: `{"client_id":"${AUTH0_M2MAPP_CLIENT_ID}","client_secret":"${AUTH0_M2MAPP_CLIENT_SECRET}","audience":"${AUTH0_MGMT_AUDIENCE}","grant_type":"client_credentials"}`
                    })
                    .then(response => {
                        auth0AccessToken = response.data.access_token;
                        done(null, response.data.access_token);
                    })
                    .catch(error => {
                        console.log(error);
                    });

            },
            function getGoogleAccessToken(auth0AccessToken, done) {

                console.log('Result from getAuth0AccessToken: ' + auth0AccessToken);
                axios({
                        method: 'GET',
                        url: `${AUTH0_MGMT_USERS_API}/${userId}`,
                        headers: {
                            'authorization': 'Bearer ' + auth0AccessToken
                        },
                        params: {
                            fields: 'identities'
                        }
                    })
                    .then(response => {
                        var i, googleAccessToken = '';
                        // Axios does something weird with arrays in JSON
                        var jsonData = JSON.parse(JSON.stringify(response.data));

                        console.log('Number of identities found: ' + jsonData.identities.length);

                        // Check if we have a Google Account
                        for (i = 0; i < jsonData.identities.length; i++) {
                            if (jsonData.identities[i].provider === 'google-oauth2') {
                                googleAccessToken = jsonData.identities[i].access_token;
                            }
                        }

                        if (googleAccessToken === '') {
                            done('No Google account found, skipping the calls to Google');
                        } else {
                            done(null, googleAccessToken);
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });

            },
            function getGoogleResidences(googleAccessToken, done) {

                // TODO: Gracefully fail when the Google accesstoken is no longer valid
                console.log('Result from getGoogleAccessToken: ' + googleAccessToken);
                axios({
                        method: 'GET',
                        url: GOOGLE_PEOPLE_API,
                        headers: {
                            'authorization': 'Bearer ' + googleAccessToken
                        },
                        params: {
                            personFields: 'residences'
                        }
                    })
                    .then(response => {
                        var jsonData = JSON.parse(JSON.stringify(response.data));

                        // Get all the residences (if any)
                        if (jsonData.hasOwnProperty('residences')) {
                            var i, patchData;
                            console.log('Number of residences found: ' + jsonData.residences.length);

                            for (i = 0; i < jsonData.residences.length; i++) {
                                googleResidences.push(jsonData.residences[i].value);
                            }
                            patchData = '{"user_metadata":{"residences":' + JSON.stringify(googleResidences) + '}}';
                            done(null, patchData);
                        } else {
                            done('No Google residences found so we can\'t store any');
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });

            },
            function patchUserWithResidences(patchData, done) {
                // Here is where we are going to enrich the user profile with the residences
                // TODO: Error handling
                axios({
                        method: 'PATCH',
                        url: `${AUTH0_MGMT_USERS_API}/${userId}`,
                        headers: {
                            'authorization': 'Bearer ' + auth0AccessToken,
                            'content-type': 'application/json'
                        },
                        data: patchData
                    })
                    .then(response => {
                        done(null);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
        ],
        function(message) {
            if (message) {
                console.log(message);
                res.json({
                    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.<br><br>We were not able to fetch the residences if/as known by Google due to:<br><br>" + message
                });
            } else {
                console.log('No errors or skips happened in any of the steps, operation done!');
                res.json({
                    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.<br><br>We have retrieved and saved the residences as known by Google:<br><br>" + JSON.stringify(googleResidences)
                });
            }
        });

    //res.json({
    //    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
    //});
});

app.listen(3001);
console.log('Listening on http://localhost:3001');