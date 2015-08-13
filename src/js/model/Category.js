var module = angular.module('Checkbook.Model', []);

module.factory('Category', [ '$http', function($http) {
	const URI_TEMPLATE = new UriTemplate('/categories/{id}');

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
	
	Category.prototype.$get = function() {
		var self = this;

		var uri = URI_TEMPLATE.fillFromObject(self);
		self.$promise = $http
			.get(uri)
			.success(function(data) {
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

	Category.query = function() {
		var uri = URI_TEMPLATE.fill(function empty(name) { if (name === 'id') return ''; }); // Strip id param from URI
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

	return Category;
}]);