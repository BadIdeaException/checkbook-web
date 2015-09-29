var module = angular.module('Checkbook.Model');

module.factory('Month', [ '$http', 'CategoryForMonth', function($http, CategoryForMonth) {
	const URI_TEMPLATE = new URITemplate('/months/{id}');

	var Month = function(values) {
		var self = this;

		// No server interaction has happened yet
		// See https://docs.angularjs.org/api/ngResource/service/$resource
		self.$resolved = false;

		// Copy provided data values into self
		Object.keys(values).forEach(function(key) {
			self[key] = values[key];
		});
	};
	
	Month.query = function() {
		var uri = URI_TEMPLATE.expand({ id: '' }); // Strip id param from URI
		if (uri[uri.length - 1] === '/') uri = uri.substr(0, uri.length - 1) // Strip trailing slash

		var months = [];

		function transformResponse(data) {
				return data.map(function createMonth(item) {
					// Turn data items into Month objects
					var month = new Month(item);
					month.$resolved = true; // The new months have all been loaded from the server
					return month;
				});			
		};

		months.$promise = $http
			.get(uri, { transformResponse: transformResponse })
			.success(function(data) {
				// Fill result array with loaded values
				data.forEach(function(item) { months.push(item); });
			});

		// Attach convenience function to retrieve a month with given id from the array
		months.getById = function(id) {
			for (var i = 0; i < this.length; i++) {
				if (this[i].id === id) return this[i];
			}
			return null;
		};

		return months;
	};

	Month.prototype.$get = function() {
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

	Month.prototype.getCategories = function() {
		var self = this;

		if (self.categories === undefined || self.categories === null) 
			self.categories = CategoryForMonth.query(self.id);

		return self.categories;
	};

	Month.prototype.getTotal = function() {
		// Possible scenarios:
		// - The month itself is not yet loaded (this should not be possible, actually)
		// - The month is loaded, but its categories aren't => use the loaded value
		// - The categories are being loaded for the first time => use the loaded value
		// - The categories have been loaded => sum up the categories' values and preclude use of month.value
		// - One or more category is being reloaded => use the already loaded value
		var self = this;
		if (self.categories && self.categories.$resolved)
			return self.categories.reduce(function(total, category) {
				return total + category.getTotal();
			}, 0);
		else
			return self.value;
	};

	return Month;
}]);