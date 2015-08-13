var module = angular.module('Checkbook.Model', []);

module.factory('Category', [ '$http', function($http) {
	var Category = function() {

	};

	
	Category.prototype.get = function() {
		$http.get()
	}
}])