var module = angular.module('Checkbook.Model', []);

module.factory('Category', [ '$http', function($http) {
	const URI_TEMPLATE = new URITemplate('/categories/{id}');

	var Category = function(values) {
		var self = this;

		// No server interaction has happened yet
		// See https://docs.angularjs.org/api/ngResource/service/$resource
		self.$resolved = false;

		// Copy provided data values into self
		Object.keys(values).forEach(function(key) {
			self[key] = values[key];
		});
	};
	
	Category.query = function() {
		var uri = URI_TEMPLATE.expand({ id: '' }); // Strip id param from URI
		if (uri[uri.length - 1] === '/') uri = uri.substr(0, uri.length - 1) // Strip trailing slash

		var categories = [];

		function transformResponse(data) {
				return data.map(function createCategory(item) {
					// Turn data items into Category objects
					var category = new Category(item);
					category.$resolved = true; // The new categories have all been loaded from the server
					return category;
				});			
		};

		categories.$promise = $http
			.get(uri, { transformResponse: transformResponse })
			.success(function(data) {
				// Fill result array with loaded values
				data.forEach(function(item) { categories.push(item); });
			});

		return categories;
	};

	Category.prototype.$get = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand(self);
		self.$promise = $http
			.get(uri)
			.then(function success(response) {
				var data = response.data;
				// Copy new values into self
				for (key in data) 
					self[key] = data[key];
				return self;
			})
			.finally(function(x) {
				// Set resolved to true because server interaction has happened
				self.$resolved = true;
				return x;
			});

		return self;
	};

	Category.prototype.$create = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand({ id: '' }) // Strip id param from URI template
		if (uri[uri.length - 1] === '/') uri = uri.substr(0, uri.length - 1) // Strip trailing slash from URI

		// Prepare a data object that won't include the $ properties like $resolved
		var data = {};
		Object.keys(self).forEach(function(key) {
			if (key[0] !== '$') data[key] = self[key];
		});

		self.$promise = $http
			.post(uri, data) // POST the data - this will not include the $ properties like $resolved
			.then(function success(response) {
				// Set id property from location header in the server response
				var location = response.headers('location');
				self.id = Number(new URI(location).segment(-1));
			})
			.finally(function(x) {
				self.$resolved = true;
				return x;
			});

		return self;
	};

	Category.prototype.$update = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand(self);

		// Prepare a data object that won't include the $ properties like $resolved
		var data = {};
		Object.keys(self).forEach(function(key) {
			if (key[0] !== '$') data[key] = self[key];
		});

		self.$promise = $http
			.put(uri, data)
			.finally(function(x) { 
				self.$resolved = true;
				return x;
			});

		return self;	
	};

	Category.prototype.$save = function() {
		var self = this;

		if (self.id === undefined || self.id === null) 
			return self.$create();
		else
			return self.$update();
	};

	Category.prototype.$delete = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand(self);

		self.$promise = $http
			.delete(uri);
	};

	return Category;
}]);