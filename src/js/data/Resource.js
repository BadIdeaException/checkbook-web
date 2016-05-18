"use strict";

/**
 * Decorate angular's $resource factory to facilitate caching and the inclusion of an 'update' action (HTTP PUT as per REST specification)
 */
angular
	.module('Checkbook.Data')
	.config([ '$resourceProvider' , function($resourceProvider) {
		$resourceProvider.defaults.actions = { 
			'get': { method: 'GET' },
			'create': { method: 'POST' },
			'update': { method: 'PUT' },
			'query': { method: 'GET', isArray: true },
			'remove': { method: 'DELETE' },
			'delete': { method: 'DELETE' } 
		};
	}])
	.decorator('$resource', [ '$delegate', '$cacheFactory', function($delegate, $cacheFactory) {
		// var cache = $cacheFactory('resources');
		
		var decorated = function() {			
			var Resource = $delegate.apply(this, arguments);

			Resource.prototype.$save = function(params, success, error) {
				return Resource.save(params, this, success, error);
			};

			/**
			 * Convenience method that executes the update action if an `id` field is defined on the `data`,
			 * and the create action if it isn't.
			 */
			Resource.save = function(params, data, success, error) {
				// If the second parameter is not an object, then params MUST have been omitted,
				// because the two following ones, if present, are functions
				// So reassign parameters to account for this (although some of them might be undefined anyway)
				if (!angular.isObject(data)) {
					data = params; success = data; error = success, params = {};
				}
				if (data.id || data.id === 0)
					return Resource.update(arguments);
				else
					return Resource.create(arguments);
			}
			return Resource;
		};	

		return decorated;
	}]);