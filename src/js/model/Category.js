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
				for (key in data) 
					self[key] = data[key];
				return self;
			})
			// .finally(function(x) {
			// 	self.$resolved = true;
			// 	return x;
			// })

		return self;
	}

	return Category;
}]);