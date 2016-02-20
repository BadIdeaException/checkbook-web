// System description

// This module is there to handle the authorization when accessing the Checkbook server.
// It should do it transparently whenever possible. 

// If an access token is available, it is attached in the HTTP authorization header, 
// if one is not already present. If no access token is available, the request is optimistically
// sent anyway because there is no client side knowledge about whether the request will
// require authorization or not.

// On receiving a 401 response, the service will attempt to acquire a new access token. For this,
// it will first try to exchange a refresh token for a new access token (a new refresh token will
// also be issued if this succeeds). If this is successful, the original request is rerun with 
// the new access token.

// If no refresh token is available, or negotiation failed, the user is redirected to the login page.
// The original request will be dropped as it will have become obsolete with the redirect: a 
// successful login will be followed by another redirect anyway.

var module = angular.module('Checkbook.Auth', [ 'ngCookies' ]);

module.factory('authService', [ '$cookies', '$injector', '$q', '$location', function($cookies, $injector, $q, $location) {
	const ACCESS_TOKEN_KEY = 'access_token';
	const REFRESH_TOKEN_KEY = 'refresh_token';

	// The server route at which token negotiation takes place
	const TOKEN_ROUTE = '/oauth/token';

	var auth = {
		pending: [],
		request: function(config) {
			// If the authorization header is not already set (need to check case-insensitively here because the 
			// HTTP specification does not require the header name to be case sensitive)
			if (!Object.keys(config.headers).some(function(key) { return key.toLowerCase() === 'authorization'; })) {
				var token = $cookies.get(ACCESS_TOKEN_KEY);
				if (token) config.headers['Authorization'] = 'Bearer ' + token;
			}
			return config;
		},
		// Try to exchange the provided refresh token for a new token pair.
		// This is the Refresh Token Flow (RFC 6749 Section 6)
		// @Returns A promise resolving to an object { access, refresh }
		refresh: function(token) {
			var $http = $injector.get('$http');

			return $http
				.post(TOKEN_ROUTE, { grant_type: 'refresh_token', refresh_token: token })
				.then(function(response) {										
					return { access: response.data['access_token'], refresh: response.data['refresh_token'] };					
				})
				.catch(function(response) {
					response.data.status = response.status;
					return $q.reject(response.data);
				});
		},
		// Try to get a new token pair using the user's credentials.
		// This is the Resource Owner Credentials Flow (RFC 6749 Section 4.3)
		// @Returns A promise resolving to an object { access, refresh }
		credentials: function(username, password) {
			var $http = $injector.get('$http');
			return $http
				.post(TOKEN_ROUTE, { grant_type: 'password', username: username, password: password })
				.then(function(response) {
					return { access: response.data['access_token'], refresh: response.data['refresh_token'] };
				})
				.catch(function(response) {
					response.data.status = response.status;
					return $q.reject(response.data);
				});
		},
		negotiate: function() {
			var self = this;
			// Now negotiating
			self.negotiating = true;
			return self
				.refresh()
				.then(function(tokens) {
					// Update tokens
					$cookies.put(ACCESS_TOKEN_KEY, tokens.access);
					$cookies.put(REFRESH_TOKEN_KEY, tokens.refresh);					
					// Promise will resolve to access token now
					return tokens.access;
				})
				.catch(function(error) {
					// The refresh token was not accepted - remove it
					$cookies.remove(REFRESH_TOKEN_KEY);
					// Propagate negotiation failure
					return $q.reject(error);
				})
				.finally(function() {
					// Negotiations have ended
					self.negotiating = false;
				});
		},
		responseError: function(response) {
			var self = this;
			// 401 Unauthorized
			// This means either no access token was available or the provided one has expired
			if (response.status === 401) {				
				// Remove the expired access token
				$cookies.remove(ACCESS_TOKEN_KEY);
				// Make a copy of the response. This is for two reasons:
				// 1. To avoid modifying the original config (we'll be deleting the Authorization header in a minute)
				// 2. To make sure we will be rerunning the exact same request (apart from authorization) - if config is 
				//    changed (e.g. externally) while negotiations are happening, we'd be sending a different request 
				//    on the rerun!
				response.config = angular.copy(response.config);
				// Detach the invalid access token from the request
				delete response.config.headers['Authorization'];
				// If currently negotiating, queue request to be rerun if negotations are successful
				if (self.negotiating) {
					var deferred = $q.defer(); // Deferred object to represent the future rerun of this response's request
					deferred.response = response; // Attach the response to the deferred so we'll be able to access it when rerunning
					self.pending.push(deferred); // Push to pending request queue
					return deferred.promise; // This is where the magic is: return the promise representing the future rerun 
											 // as the result of this response. This links the outcome of this request (the
											 // already failed one) to its future outcome after rerunning
				}

				var token = $cookies.get(REFRESH_TOKEN_KEY);								
				// Try to renegotiate a new token
				// If no refresh token is available, do not attempt to negotiate, but instead
				// follow the ".catch" chain immediately
				return (token ? self.negotiate(token) : $q.reject({ status: 400, error: 'invalid_grant' }))
					.then(function(access) {
						// Negotiations successful - rerun this and all subsequently queued requests
						var $http = $injector.get('$http');						
						var result = $http(response.config);
						// Rerun all queued requests
						self.pending
							.forEach(function(deferred) { 
								// Resolve each pending request with the value of its rerun (resolve the deferred's promise
								// which had been returned earlier when queueing with the value of the $http for the rerun).
								// If the rerun also fails, the promise will automatically be rejected instead.
								// Whichever it is will propagate looking as if it is the result of the original request.
								deferred.resolve($http(deferred.response.config)); 
							});
						self.pending = []; // Empty queue
						return result;					
					})
					.catch(function(error) {
						// Negotiations unsuccessful - redirect to login and fail all queued requests
						self
							.pending
							.forEach(function(deferred) { 
								// Fail all queued requests (reject the deferred's promise which had been returned earlier
								// when queueing with the original response). The original failures have only been held
								// back until negotiations have failed.
								deferred.reject(deferred.response); 
							});
						self.pending = [];
						$location.path('/login');
						// Propagate failed request
						return $q.reject(response);
					});
			}
		}
	}

	return auth;
}]);