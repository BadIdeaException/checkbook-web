"use strict";

/**
 * Decorate angular's $resource factory to facilitate caching and the inclusion of an 'update' action (HTTP PUT as per REST specification)
 */
(function() { // IIFE to keep this variable from polluting the global scope
var resourceProviderDefaultActions;

angular
	.module('Checkbook.Data')
	.config([ '$resourceProvider' , function($resourceProvider) {
		resourceProviderDefaultActions = $resourceProvider.defaults.actions = { 
			'get': { method: 'GET' },
			'create': { method: 'POST' },
			'update': { method: 'PUT' },
			'query': { method: 'GET', isArray: true },
			'remove': { method: 'DELETE' },
			'delete': { method: 'DELETE' } 
		};
	}])
	.decorator('$resource', [ '$delegate', '$cacheFactory', '$log', function($delegate, $cacheFactory, $log) {
		/**
		 * Removes all methods (both static and instance versions) from `Resource` that conform to actions using
		 * methods other than GET or HEAD.
		 * @param  {Resource} Resource The Resource constructor to work on
		 * @param  {Object} actions  The extra actions that were given to the $resource call		 
		 */
		function removeWriteActions(Resource, actions) {
			var actions = angular.extend({}, actions, resourceProviderDefaultActions);
			Object
				.keys(actions)
				.filter(function(actionName) { return actions[actionName].method.toUpperCase() !== 'GET' && actions[actionName].method.toUpperCase() !== 'HEAD'; })
				.forEach(function(actionName) { delete Resource[actionName]; delete Resource.prototype['$' + actionName]; });
		}

		/**
		 * Decorated version of the $resource factory function.
		 * @param  {[type]} url           [description]
		 * @param  {[type]} paramDefaults [description]
		 * @param  {[type]} actions       [description]
		 * @param  {Object} options       In addition to the options understood by the delegate version, the following are available:
		 *    `readOnly`: If `true`, the resource will only have actions with method GET or HEAD
		 *    `cache`: If `true`, a cache will be created using `url` as cache name or an existing one of that name retrieved. If a `Cache` object, it will be used.
		 * @return {[type]}               [description]
		 */
		var decorated = function(url, paramDefaults, actions, options) {			
			// Make sure parameters are defined objects and make copies so we can write and delete in them
			actions = angular.extend({}, actions);
			options = angular.extend({}, options);
			// Copy over those options introduced by us over into a new object, then remove them from the
			// original options parameter (because I think it will trip up the original $resource when populating
			// underlying $http config objects)
			var newOptions = {};
			[ 'readOnly', 'cache' ].forEach(function(key) { newOptions[key] = options[key]; delete options[key]; });			
						
			

			// Call through to the delegate factory
			var Resource = $delegate.apply(this, arguments);			
			// If the resource is supposed to be read-only, remove all methods that are not GET or HEAD actions
			if (newOptions.readOnly)
				removeWriteActions(Resource, actions);

			

			if (newOptions.cache === true)
				Resource.cache = $cacheFactory.get(url) || $cacheFactory(url); // Create or retrieve cache
			else if (angular.isObject(newOptions.cache))
				Resource.cache = newOptions.cache;
			


			// This instance method will not be present if newOptions.readOnly flag is set
			Resource.prototype.$save = !newOptions.readOnly && function(params, success, error) {
				return Resource.save(params, this, success, error);
			};

			/**
			 * Convenience method that executes the update action if an `id` field is defined on the `data`,
			 * and the create action if it isn't.
			 *
			 * This method and its instance version `$save` will not be present in resources created with the `options.readOnly` flag set 
			 */
			Resource.save = !newOptions.readOnly && function(params, data, success, error) {
				// If the second parameter is not an object, then params must have been omitted,
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

			

			// Cache-aware version of the delegate method
			var _get = Resource.get;
			Resource.get = function() {
				var self = this;

				var result = _get.apply(this, arguments);
				result.$promise.then(function cacheResult(resource) {
					if (resource.id || resource.id === 0)
						self.cache.put(resource.id, resource);
					else
						$log.warn('Resource does not have an id - did not cache');

					return resource;
				});
				return result;
			};

			return Resource;
		};	

		return decorated;
	}]);
})();