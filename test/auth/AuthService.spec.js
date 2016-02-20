describe('AuthService', function() {
	beforeEach(angular.mock.module('Checkbook.Auth'));

	var authService,
		$cookies, 
		$q,
		$rootScope,
		$httpBackend,
		$location;

	// before(function() {
	// 	// Switch out angular's $q against the "original" implementation (Kris Kowal's Q)
	// 	// Otherwise it will be impossible to use chai-as-promised because of how angular's
	// 	// $q is tied into the $digest cycle - tests constructed using chai-as-promised's
	// 	// eventually property will always fail (timeout exceeded).
	// 	// This transparently switches out the $q service, i.e. when requesting $q in these
	// 	// tests, it will actually be given Q.
	// 	angular
	// 		.module('ngMock')
	// 		.provider('$q', { $get: function() { return Q; }});
	// });

	beforeEach(inject(function($injector) {
		authService = $injector.get('authService');
		$cookies = $injector.get('$cookies'); 
		$rootScope = $injector.get('$rootScope');
		$q = $injector.get('$q')
		$httpBackend = $injector.get('$httpBackend');
		$location = $injector.get('$location');
	}));

	describe('refresh token flow', function() {
		it('should send a correctly formed message for the refresh token flow', function() {
			const REFRESH = 'refresh token';

			$httpBackend
				.expectPOST('/oauth/token', {
					grant_type: 'refresh_token',
					refresh_token: REFRESH
				}).respond(200, {});

			var p = authService.refresh(REFRESH);
			$httpBackend.flush(); 
			// return expect(p).to.eventually.deep.equal({ access: ACCESS, refresh: NEW_REFRESH });
		});

		it('should resolve to the new token pair', function() {
			const REFRESH = 'refresh token';
			const ACCESS = 'access token';

			$httpBackend
				.expectPOST('/oauth/token')
				.respond(200, { access_token: ACCESS, refresh_token: REFRESH });

			var tokens;
			authService.refresh().then(function(_tokens) { tokens = _tokens });
			$httpBackend.flush(); 
			$rootScope.$apply(); // Propagate promise resolution - see e.g. http://stackoverflow.com/questions/26751846/unit-testing-angularjs-q-all-promise-never-completes

			expect(tokens).to.deep.equal({ access: ACCESS, refresh: REFRESH });
		});

		it('should reject to an error object', function() {
			const DATA = {
				error: 'invalid_grant',
				error_description: 'The provided refresh token was invalid',
				error_uri: 'uri'
			};

			$httpBackend
				.expectPOST('/oauth/token')
				.respond(400, DATA);

			var reason;
			authService.refresh().catch(function(_reason) { reason = _reason; });
			$httpBackend.flush(); $rootScope.$apply();

			expect(reason).to.exist;
			expect(reason).to.have.property('status', 400);
			// Remove the status field so we can use "equal" instead of having to compare everything by hand
			delete reason.status;
			expect(reason).to.deep.equal(DATA);
		});
	});

	describe('resource owner credentials flow', function() {
		it('should send a correctly formed message for the resource owner credentials flow', function() {
			const USERNAME = 'user';
			const PASSWORD = 'password';

			$httpBackend
				.expectPOST('/oauth/token', {
					grant_type: 'password',
					username: USERNAME,
					password: PASSWORD
				}).respond(200, {});

			var p = authService.credentials(USERNAME, PASSWORD);
			$httpBackend.flush(); 			
		});

		it('should resolve to the new token pair', function() {
			const REFRESH = 'refresh token';
			const ACCESS = 'access token';

			$httpBackend
				.expectPOST('/oauth/token')
				.respond(200, { access_token: ACCESS, refresh_token: REFRESH });

			var tokens;
			authService.credentials().then(function(_tokens) { tokens = _tokens });
			$httpBackend.flush(); 
			$rootScope.$apply(); // Propagate promise resolution - see e.g. http://stackoverflow.com/questions/26751846/unit-testing-angularjs-q-all-promise-never-completes

			expect(tokens).to.deep.equal({ access: ACCESS, refresh: REFRESH });
		});

		it('should reject to an error object', function() {
			const DATA = {
				error: 'invalid_grant',
				error_description: 'The provided username or password were incorrect',
				error_uri: 'uri'
			};

			$httpBackend
				.expectPOST('/oauth/token')
				.respond(400, DATA);

			var reason;
			authService.credentials().catch(function(_reason) { reason = _reason; });
			$httpBackend.flush(); $rootScope.$apply();

			expect(reason).to.exist;
			expect(reason).to.have.property('status', 400);
			// Remove the status field so we can use "equal" instead of having to compare everything by hand
			delete reason.status;
			expect(reason).to.deep.equal(DATA);
		});
	});

	describe('.negotiate', function() {
		const TOKENS = { access: 'access token', refresh: 'refresh token' };

		it('should set negotiating to true', function() {
			authService.negotiate();
			expect(authService.negotiating).to.be.true;
		});

		it('should store the new tokens after successful negotiations', function() {
			$httpBackend
				.expectPOST('/oauth/token')
				.respond(200, { access_token: TOKENS.access, refresh_token: TOKENS.refresh });

			var put = sinon.spy($cookies, 'put');
			var accessStored, refreshStored;

			authService
				.negotiate()
				.then(function() { 
					accessStored = put.calledWith('access_token', TOKENS.access);
					refreshStored = put.calledWith('refresh_token', TOKENS.refresh);
				});

			$httpBackend.flush(); $rootScope.$apply();

			expect(accessStored).to.be.true;
			expect(refreshStored).to.be.true;
			put.restore();
		});

		it('should remove the refresh token after failed negotiations', function() {
			var remove = sinon.spy($cookies, 'remove');
			var refresh = sinon.stub(authService, 'refresh');
			refresh.returns($q.reject({ status: 400, error: 'invalid_grant' }));

			var refreshRemoved;
			authService
				.negotiate()
				.catch(function() { 
					refreshRemoved = remove.calledWith('refresh_token');
				})
				.finally(remove.restore);
			$rootScope.$apply();

			expect(refreshRemoved).to.be.true;
			refresh.restore();
		});

		it('should set negotiating to false after negotiations regardless of the outcome', function() {
			var refresh = sinon.stub(authService, 'refresh');
			var negotiating;
			
			// Successful negotiation
			refresh.returns($q.when(TOKENS));
			authService
				.negotiate()
				.then(function() { negotiating = authService.negotiating; });
			$rootScope.$apply();
			expect(negotiating).to.be.false;

			// Unsuccessful negotiation
			negotiating = undefined;
			refresh.returns($q.reject({ status: 400, error: 'invalid_grant' }));
			authService
				.negotiate()
				.catch(function() { negotiating = authService.negotiating; });
			$rootScope.$apply();
			expect(negotiating).to.be.false;

			refresh.restore();
		});
	});

	it('should attach an access token to every request', function() {
		const TOKEN = 'access token';

		var getCookie = sinon.stub($cookies, 'get');
		getCookie.returns(TOKEN);

		var config = { headers: {} };
		config = authService.request(config);

		expect(config.headers).to.have.property('Authorization', 'Bearer ' + TOKEN);

		getCookie.restore();
	});

	it('should not alter the authorization header if one is already present', function() {
		var getCookie = sinon.stub($cookies, 'get');
		getCookie.returns('access token');

		var config = { headers: { Authorization: 'original' }};
		config = authService.request(config);
		
		expect(config.headers).to.have.property('Authorization', 'original');
		getCookie.restore();
	});

	it('should return the request unaltered for optimistic sending if no access token is available', function() {
		var getCookie = sinon.stub($cookies, 'get');
		getCookie.returns(null);

		var config = { headers: {} };
		config = authService.request(config);

		expect(config.headers).to.not.have.property('Authorization');
		getCookie.restore();
	});

	it('should remove the access token from storage after a 401 response', function() {
		var remove = sinon.spy($cookies, 'remove');
		var config = { method: 'GET', url: 'url', headers: { Authorization: 'Bearer invalid' } };
		var response = { status: 401, config: config };

		authService.responseError(response);

		expect(remove).to.have.been.calledWith('access_token');

		remove.restore();
	});

	it('should remove the authorization header after a 401 response', function() {
		var config = { method: 'GET', url: 'url', headers: { Authorization: 'Bearer invalid' } };
		var response = { status: 401, config: config };

		authService.responseError(response);
		
		expect(response.config.headers).to.not.have.property('Authorization');
	});

	it('should renegotiate with a refresh token if one is available', function() {
		var config = { method: 'GET', url: 'url', headers: { Authorization: 'Bearer invalid' } };
		var response = { status: 401, config: config };
		var negotiate = sinon.spy(authService, 'negotiate');
		var get = sinon.stub($cookies, 'get');
		get
			.withArgs('refresh_token')
			.returns('refresh token');

		authService.responseError(response);

		expect(negotiate).to.have.been.called;

		negotiate.restore();
		get.restore();
	})

	it('should not attempt to renegotiate with a refresh token if none is available', function() {
		var config = { method: 'GET', url: 'url', headers: { Authorization: 'Bearer invalid' } };
		var response = { status: 401, config: config };
		var negotiate = sinon.spy(authService, 'negotiate');
		var get = sinon.stub($cookies, 'get');
		get			
			.withArgs('refresh_token')
			.returns(null);

		authService.responseError(response);

		expect(negotiate).to.not.have.been.called;

		negotiate.restore();
		get.restore();
	});

	it('should queue requests for any additional 401 response errors that come in during negotiations', function() {
		var response1 = { status: 401, config: { method: 'GET', url: 'url1', headers: { Authorization: 'Bearer invalid' } } };
		var response2 = { status: 401, config: { method: 'GET', url: 'url2', headers: { Authorization: 'Bearer invalid' } } };

		var get = sinon.stub($cookies, 'get');
		get			
			.withArgs('refresh_token')
			.returns('refresh token');

		authService.responseError(response1);
		authService.responseError(response2);

		expect(authService.pending).to.exist.and.to.not.be.empty;
		expect(authService.pending[0]).to.have.property('response', response2);

		get.restore();
	});

	it('should rerun the original and any queued requests after successful negotiations', function() {
		var response1 = { status: 401, config: { method: 'GET', url: 'url1', headers: { Authorization: 'Bearer invalid' } } };
		var response2 = { status: 401, config: { method: 'GET', url: 'url2', headers: { Authorization: 'Bearer invalid' } } };

		var refresh = sinon.stub($cookies, 'get');
		refresh.withArgs('refresh_token').returns('refresh token');

		var negotiate = sinon
			.stub(authService, 'negotiate')
			.returns($q.when('access token'));

		$httpBackend.expect(response1.config.method, response1.config.url).respond(200);
		$httpBackend.expect(response2.config.method, response2.config.url).respond(200);

		authService.responseError(response1);
		authService.responseError(response2); // This one will be queued

		$rootScope.$apply();
		$httpBackend.flush();
		
		negotiate.restore();
		refresh.restore();
	});

	it('should redirect to login and fail all queued requests after failed negotiations', function() {
		var response1 = { status: 401, config: { method: 'GET', url: 'url1', headers: { Authorization: 'Bearer invalid' } } };
		var response2 = { status: 401, config: { method: 'GET', url: 'url2', headers: { Authorization: 'Bearer invalid' } } };
		var negotiate = sinon.stub(authService, 'negotiate').returns($q.reject());

		var path, result1, result2;
		authService
			.responseError(response1)
			.catch(function(response) { path = $location.path(); result1 = response; });			
		authService
			.responseError(response2)
			.catch(function(response) { result2 = response; });

		$rootScope.$apply();

		delete response1.config.headers.Authorization;
		delete response2.config.headers.Authorization;

		expect(path).to.equal('/login');
		// Check that the original failed requests are propagated:
		expect(result1).to.equal(response1);
		expect(result2).to.equal(response2);

		negotiate.restore();
	});
});