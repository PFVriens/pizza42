window.addEventListener('load', function() {

    //var content = document.querySelector('.content');
    var loadingSpinner = document.getElementById('loading');
    //content.style.display = 'block';
    loadingSpinner.style.display = 'none';

    var userProfile;
    var apiUrl = 'http://localhost:3001/api';

    var webAuth = new auth0.WebAuth({
        domain: AUTH0_DOMAIN,
        clientID: AUTH0_CLIENT_ID,
        redirectUri: AUTH0_CALLBACK_URL,
        audience: AUTH0_AUDIENCE,
        responseType: 'token id_token',
        scope: 'openid profile email read:messages read:users',
        leeway: 60
    });

    var homeView = document.getElementById('home-view');
    var profileView = document.getElementById('profile-view');
    var pingView = document.getElementById('ping-view');

    // buttons and event listeners
    var loginBtn = document.getElementById('qsLoginBtn');
    var logoutBtn = document.getElementById('qsLogoutBtn');

    var homeViewBtn = document.getElementById('btn-home-view');
    var profileViewBtn = document.getElementById('btn-profile-view');
    var apiViewBtn = document.getElementById('btn-api-view');

    var apiPublicBtn = document.getElementById('btn-api-public');
    var apiPrivateBtn = document.getElementById('btn-api-private');
    var apiUpdateBtn = document.getElementById('btn-api-update');

    var callPrivateMessage = document.getElementById('call-private-message');
    var pingMessage = document.getElementById('ping-message');

    var pizzaButton1 = document.getElementsByClassName('pizza-add')[0];
    var pizzaButton2 = document.getElementsByClassName('pizza-add')[1];
    var pizzaButton3 = document.getElementsByClassName('pizza-add')[2];
    var submitButton = document.getElementById('submitBtn');
    var clearCartButton = document.getElementById('clearCartBtn');
    var totalOrder = document.getElementById('total');
    // Get the current cart value from the cookie
    var totalPrice = localStorage.getItem('cart_total');

    function clearCart() {
        totalPrice = 0;
        totalOrder.innerHTML = totalPrice;
        submitButton.style.display = 'none';
        clearCartButton.style.display = 'none';
        localStorage.removeItem('cart_total');
    }

    function updateCart(price) {
        var emailVerified = localStorage.getItem('email_verified');
        // Calculate the new total, display it and update the cookie value
        totalPrice = (Number(totalPrice) + Number(price)).toFixed(2);
        totalOrder.innerHTML = totalPrice;
        localStorage.setItem('cart_total', totalPrice);
        // Only show the submit button if the user has a verified email-address
        if (emailVerified == 'true') {
            submitButton.style.display = 'inline-block';
        } else {
            submitButton.style.display = 'none';
        }
        // We can show the clear cart button if there is something in the cart
        clearCartButton.style.display = 'inline-block';
    }

    submitButton.addEventListener('click', function() {
        //alert('Ordered pizza1');
        if (totalPrice > 0) {
            alert('Your order is succesfully placed!')
        } else {
            alert('Nothing in the cart yet!');
        }
        clearCart();
    });

    clearCartButton.addEventListener('click', function() {
        clearCart();
    });

    pizzaButton1.addEventListener('click', function() {
        updateCart(6.99);
    });

    pizzaButton2.addEventListener('click', function() {
        updateCart(8.99);
    });

    pizzaButton3.addEventListener('click', function() {
        updateCart(7.99);
    });

    apiPublicBtn.addEventListener('click', function() {
        callAPI('/public', false);
    });

    apiPrivateBtn.addEventListener('click', function() {
        callAPI('/private', true);
    });

    apiUpdateBtn.addEventListener('click', function() {
        callAPI('/update_user', true);
    });

    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);

    homeViewBtn.addEventListener('click', function() {
        homeView.style.display = 'block';
        pingView.style.display = 'none';
        profileView.style.display = 'none';
    });

    apiViewBtn.addEventListener('click', function() {
        homeView.style.display = 'none';
        pingView.style.display = 'block';
        profileView.style.display = 'none';
    });

    profileViewBtn.addEventListener('click', function() {
        homeView.style.display = 'none';
        pingView.style.display = 'none';
        profileView.style.display = 'block';
        getProfile();
    });

    function login() {
        webAuth.authorize();
    }

    function setSession(authResult) {
        // Set the time that the access token will expire at
        var expiresAt = JSON.stringify(
            authResult.expiresIn * 1000 + new Date().getTime()
        );
        localStorage.setItem('access_token', authResult.accessToken);
        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem('expires_at', expiresAt);
        webAuth.client.userInfo(authResult.accessToken, function(err, user) {
            if (user) {
                localStorage.setItem('user_id', user.sub);
                localStorage.setItem('email_verified', user.email_verified);
            }
        });
    }

    function logout() {
        // Remove tokens and expiry time from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('user_id');
        localStorage.removeItem('email_verified');
        pingMessage.style.display = 'none';
        displayButtons();
    }

    function isAuthenticated() {
        // Check whether the current time is past the
        // access token's expiry time
        var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }

    function displayButtons() {
        var loginStatus = document.getElementById('loginStatus');
        loginStatus.style.color = 'white';
        console.log('displayButtons called');
        if (isAuthenticated()) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            profileViewBtn.style.display = 'inline-block';
            apiViewBtn.style.display = 'inline-block';
            apiPrivateBtn.style.display = 'inline-block'; // Why only this one?
            callPrivateMessage.style.display = 'none';
            pizzaButton1.style.display = 'inline-block';
            pizzaButton2.style.display = 'inline-block';
            pizzaButton3.style.display = 'inline-block';

            var accessToken = localStorage.getItem('access_token');
            webAuth.client.userInfo(accessToken, function(err, user) {
                if (user) {
                    console.log('userinfo retrieved: ' + user.email_verified);
                    submitButton.innerHTML = 'Submit my order';
                    if (user.email_verified) {
                        loginStatus.innerHTML = 'Your email-address ' + user.email + ' has been verified so you are allowed to order';
                        loginStatus.style.backgroundColor = '#5cb85c';
                        if (totalPrice > 0) {
                            submitButton.style.display = 'inline-block';
                            clearCartButton.style.display = 'inline-block';
                            totalOrder.innerHTML = totalPrice;
                        } else {
                            clearCartButton.style.display = 'none';
                        }
                    } else {
                        loginStatus.innerHTML = 'You are not allowed to order yet. Please verify your email-address ' + user.email + ' first';
                        loginStatus.style.backgroundColor = '#ffd280';
                        submitButton.style.display = 'none';
                        clearCartButton.style.display = 'none';
                    }
                }
            });
        } else {
            homeView.style.display = 'block';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            profileViewBtn.style.display = 'none';
            profileView.style.display = 'none';
            pingView.style.display = 'none';
            apiViewBtn.style.display = 'none';
            apiPrivateBtn.style.display = 'none';
            callPrivateMessage.style.display = 'block';
            pizzaButton1.style.display = 'none';
            pizzaButton2.style.display = 'none';
            pizzaButton3.style.display = 'none';
            clearCart();
            loginStatus.innerHTML = 'Please log in to order our delicious pizza\'s';
            loginStatus.style.backgroundColor = '#ff8080';
        }
    }

    function getProfile() {
        console.log('getProfile called');
        if (!userProfile) {
            var accessToken = localStorage.getItem('access_token');

            if (!accessToken) {
                console.log('Access token must exist to fetch profile');
            }

            webAuth.client.userInfo(accessToken, function(err, profile) {
                if (profile) {
                    console.log('profile retrieved');
                    userProfile = profile;
                    displayProfile();
                }
            });
        } else {
            console.log('userProfile was already defined');
            displayProfile();
        }
    }

    function displayProfile() {
        // display the profile
        console.log('displayProfile called');
        document.querySelector(
            '#profile-view .nickname'
        ).innerHTML = userProfile.nickname;
        document.querySelector(
            '#profile-view .full-profile'
        ).innerHTML = JSON.stringify(userProfile, null, 2);
        document.querySelector('#profile-view img').src = userProfile.picture;
    }

    function handleAuthentication() {
        console.log('handleAuthentication called with \'' + window.location.hash + '\'');
        webAuth.parseHash(function(err, authResult) {
            if (authResult && authResult.accessToken && authResult.idToken) {
                window.location.hash = '';
                loginBtn.style.display = 'none';
                homeView.style.display = 'inline-block';
                setSession(authResult);
            } else if (err) {
                homeView.style.display = 'inline-block';
                console.log(err);
                alert(
                    'Error: ' + err.error + '. Check the console for further details.'
                );
            }
            displayButtons();
        });
    }

    function callAPI(endpoint, secured) {
        var url = apiUrl + endpoint;
        var xhr = new XMLHttpRequest();

        // Retrieve the subject to pass to the API via a query parameter
        var userId = localStorage.getItem('user_id');

        url = url + '?id=' + userId;
        console.log('userId sent: ' + userId);
        xhr.open('GET', url);
        if (secured) {
            xhr.setRequestHeader(
                'Authorization',
                'Bearer ' + localStorage.getItem('access_token')
            );
        }

        xhr.onload = function() {
            if (xhr.status == 200) {
                console.log('response: \'' + xhr.responseText + '\'');
                // update message
                document.getElementById('ping-message').innerHTML = JSON.parse(xhr.responseText).message;
            } else {
                alert('Request failed: ' + xhr.statusText);
            }
        };

        xhr.send();
    }

    handleAuthentication();
    displayButtons();
});