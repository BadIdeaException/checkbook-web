"use strict";

/**
 * Decorate angular's $resource factory to facilitate use of a data store and the inclusion of an 'update' action (HTTP PUT as per REST specification)
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
	.decorator('$resource', [ '$delegate', '$cacheFactory', '$q', 'expandUrl', function($delegate, $cacheFactory, $q, expandUrl) {
		/**
		 * Removes all action methods (both static and instance versions) from `Resource` that are using
		 * methods other than GET or HEAD.
		 * @param  {Resource} Resource The Resource constructor to work on
		 * @param  {Object} actions  The object describing the actions that were created on `Resource`
		 */
		function removeWriteActions(Resource, actions) {
			Object
				.keys(actions)
				.filter(function(actionName) { return actions[actionName].method.toUpperCase() !== 'GET' && actions[actionName].method.toUpperCase() !== 'HEAD'; })
				.forEach(function(actionName) { delete Resource[actionName]; delete Resource.prototype['$' + actionName]; });
		}

		/**
		 * Decorated version of the $resource factory function.
		 * @param  url
		 * @param  [paramDefaults]
		 * @param  [actions]
		 * @param  {Object} [options] - In addition to the options understood by the delegate version, the following are available:
		 * @param  {Boolean} [options.readonly] - If `true`, the resource will only have actions with method GET or HEAD
		 * @param  {Store} [options.store] - If a `Store` object, it will be used to store resource instances (sort of like a cache)
		 * @return {Resource}
		 * @see {@link https://docs.angularjs.org/api/ngResource/service/$resource|the Angular documentation on $resource} for specifics on the params and return value.
		 */
		var decorated = function(url, paramDefaults, actions, options) {			
			// Make sure parameters are defined objects and make copies so we can modify them
			actions = angular.extend({}, resourceProviderDefaultActions, actions);
			options = angular.extend({}, options);
			// Copy over those options introduced by us over into a new object, then remove them from the
			// original options parameter (because I think it will trip up the original $resource when populating
			// underlying $http config objects)
			var newOptions = {};
			[ 'readOnly', 'store' ].forEach(function(key) { newOptions[key] = options[key]; delete options[key]; });			


			
			// Call through to the delegate factory
			var Resource = $delegate(url, paramDefaults, actions, options);			
			// If the resource is supposed to be read-only, remove all methods that are not GET or HEAD actions
			if (newOptions.readOnly)
				removeWriteActions(Resource, actions);

			

			if (newOptions.store === true) // If newOptions.store is used as a flag...
				Resource.store = $cacheFactory.get(url) || $cacheFactory(url); // ...retrieve or create store...
			else if (angular.isObject(newOptions.store)) // ...otherwise, if it is a Store object...
				Resource.store = newOptions.store; // ...use that
			


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



			function storifyRead(delegateFn, actionUrl, actionParams) {
				return function(params, success, error) {
					// Calculate effective parameters
					params = angular.extend({}, params, actionParams, paramDefaults);
					// Attempt to read from store, if store is available
					var result = Resource.store && Resource.store.get(expandUrl(actionUrl, params));
					if (result) {
						$q.when(result, success); // Call success callback asynchronously
						return result;
					}

					// Otherwise call through to delegate function
					result = delegateFn.apply(this, arguments);
					var promise = result.$promise || result; // Instance calls return the promise directly
					promise.then(function(resource) {
						// Store result if store is available
						Resource.store && Resource.store.put(expandUrl(actionUrl, params), resource);
						return resource;
					});
					return result;
				};
			}	

			function storifyCollection(delegateFn, actionUrl, actionParams) {
				return function(params, success, error) {
					// Calculate effective parameters
					params = angular.extend({}, params, actionParams, paramDefaults);
					// Attempt to read from store, if store is available
					var result = Resource.store && Resource.store.get(expandUrl(actionUrl, params));
					if (result) {
						$q.resolve(result, success); // Call success callback asynchronously
						return result;
					}

					// Otherwise call through to delegate function
					result = delegateFn.apply(this, arguments);
					var promise = result.$promise || result; // Instance calls return the promise directly
					promise.then(function(collection) {
						if (Resource.store) {
							// Store result if store is available
							Resource.store.put(expandUrl(actionUrl, params), collection);
							// Store collection elements individually
							var elementGetAction = actions.get || {};
							var elementParams = angular.extend({}, params, elementGetAction.params, paramDefaults);
							collection.forEach(function(element) {
								Resource.store.put(expandUrl(
									elementGetAction.url || url, 
									elementParams, 
									element), element);
							});
						}
						return collection;
					});
					return result;

				};
			}

			function storifyWrite(delegateFn, actionUrl, actionParams) {
				return function(params, data, success, error) {			
					// Calculate effective parameters
					params = angular.extend({}, params, actionParams, paramDefaults);
					// Always call through to delegate function					
					var result = delegateFn.apply(this, arguments);
					var promise = result.$promise || result; // Instance calls return the promise directly
					promise.then(function(resource) {
						// Store result if store is available
						Resource.store && Resource.store.put(expandUrl(actionUrl, params, resource), resource);
						return resource;
					});
					return result;
				};
			}

			function storifyDelete(delegateFn, actionUrl, actionParams) {
				return function(params, data, success, error) {
					// Calculate effective parameters
					params = angular.extend({}, params, actionParams, paramDefaults);
					// Always call through to delegate function
					var result = delegateFn.apply(this, arguments);
					var promise = result.$promise || result; // Instance calls return the promise directly
					promise.then(function(resource) { 
						// Remove from store if store is available
						Resource.store && Resource.store.remove(expandUrl(actionUrl, params, resource));
					});
					return result;
				};
			}

			if (newOptions.store) angular.forEach(actions, function(action, name) {
				var delegateFn = Resource[name];
				var cachifiedFn;
				switch (action.method.toUpperCase()) {
					case 'GET': 
						if (action.isArray) cachifiedFn = storifyCollection(delegateFn, action.url || url, action.params)
						else cachifiedFn = storifyRead(delegateFn, action.url || url, action.params);
						break;
					case 'POST':
					case 'PUT': cachifiedFn = storifyWrite(delegateFn, action.url || url, action.params); break;
					case 'DELETE': cachifiedFn = storifyDelete(delegateFn, action.url || url, action.params); break;
				}				
				Resource[name] = cachifiedFn;
			});

		 	return Resource;
		};	

		return decorated;
	}]);
})();