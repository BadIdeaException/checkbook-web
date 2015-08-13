var module = angular.module('Checkbook.Model', []);

module.factory('Category', [ '$http', function($http) {
	const URI_TEMPLATE = new UriTemplate('/categories/{id}');

	var Category = function(values) {
		var self = this;

		// Copy provided data values into self
		Object.keys(values).forEach(function(key) {
			self[key] = values[key];
		});
	};
	
	Category.prototype.$get = function() {
		var self = this;

		var uri = URI_TEMPLATE.fill(self);
		self.$promise = $http
			.get(uri)
			.success(function(data) {
				for (key in data) 
					self[key] = data[key];
			})

		return self;
	}

	return Category;
}]);