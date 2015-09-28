var module = angular.module('Checkbook.Model');

module.factory('CategoryForMonth', [ '$http', 'Entry', function($http, Entry) {
	const URI_TEMPLATE = new URITemplate('/months/{monthid}/categories/{id}');

	// FOLLOWING HAS BEEN COPIED AND PASTED FROM CATEGORY OBJECT
	var CategoryForMonth = function(values) {
		var self = this;

		// No server interaction has happened yet
		// See https://docs.angularjs.org/api/ngResource/service/$resource
		self.$resolved = false;

		// Copy provided data values into self
		Object.keys(values).forEach(function(key) {
			self[key] = values[key];
		});
	};
	
	CategoryForMonth.query = function(monthid) {
		var uri = URI_TEMPLATE.expand({ monthid: monthid }); // Strip id param from URI
		if (uri[uri.length - 1] === '/') uri = uri.substr(0, uri.length - 1) // Strip trailing slash

		var categories = [];

		function transformResponse(data) {
				return data.map(function createCategoryForMonth(item) {
					// Turn data items into CategoryForMonth objects
					var category = new CategoryForMonth(item);
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

	CategoryForMonth.prototype.$get = function() {
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

	// END OF COPIED CONTENT

	CategoryForMonth.prototype.getEntries = function() {
		var self = this;
		if (self.entries === undefined || self.entries === null) 
			self.entries = Entry.query(self);

		return self.entries;
	};

	CategoryForMonth.prototype.getTotal = function() {
		var self = this;
		// Return computed value if entries are present and have finished loading
		if (self.entries && self.entries.$resolved)
			return self.entries.reduce(function(total, entry) {
				return total + entry.value;
			}, 0);
		// Otherwise, return own value
		else
			return self.value;
	};

	return CategoryForMonth;
}]);
