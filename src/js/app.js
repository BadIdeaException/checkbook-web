"use strict";
var app = angular.module('Checkbook', [ 'ngRoute', 'ngResource', 'restmod', 'Checkbook.Model' ]);

app.config([ '$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/html/welcome.html'
		});
}]);