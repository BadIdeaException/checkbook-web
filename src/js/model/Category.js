var module = angular.module('Checkbook.Model', []);

module.factory('Category', function() {
	var Category = $resource('/categories/:id');

	return Category;
});