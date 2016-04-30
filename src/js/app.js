"use strict";
var app = angular.module('Checkbook', [ 'ngResource', 'ngRoute', 'Checkbook.Model', 'Checkbook.Data' ]);

app.config([ '$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/html/welcome.html'
		});
}]);