"use strict";
var app = angular.module('Checkbook', [ 'ngRoute', 'Checkbook.Model', 'Checkbook.Data' ]);

app.config([ '$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/html/welcome.html'
		});
}]);