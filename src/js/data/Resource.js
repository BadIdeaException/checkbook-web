"use strict";

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
	.decorator('$resource', [ '$delegate', 'Store', '$q', 'expandUrl', function($delegate, Store, $q, expandUrl) {
		/*
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
		 * @ngdoc service
		 * @module  Checkbook.Data
		 * @name  $resource
		 * @description
		 * Decorated version of the $resource factory function. On top of the functionality provided by the Angular `$resource` implementation, it
		 * can make resources read-only, has an `update` action (HTTP PUT) by default and has built-in support for using a {@link Store}.
		 * 
		 * See the [Angular documentation on $resource](https://docs.angularjs.org/api/ngResource/service/$resource/) for specifics on the params and return value.
		 * @param {string} url
		 * @param {Object=} paramDefaults &nbsp;
		 * @param {Object=} actions &nbsp;
		 * @param  {Object=} options In addition to the options understood by the delegate version, the following are available:
		 * - **`readOnly`** - {boolean=} - If `true`, the resource will only have actions with method GET or HEAD
		 * - **`store`** - {boolean|{@link Store}} - If `true`, a `Store` object will be created and used to store resource instances. The created
		 * store will use URLs as keys. If a `Store` object, it will be used. Even though this closely
		 * resembles a cache, the term is avoided because it implies the result of querying a cache will always be either the same as
		 * that obtained from the server, or the server will have newer data. Here, on the contrary, the newer data may be the version in
		 * the store.
		 * @return {Object} The resource constructor created by Angular's $resource factory and decorated
		 */
		var decorated = function(url, paramDefaults, actions, options) {			
			var URL_KEYGEN = {
				elem: expandUrl.bind(null, url, paramDefaults),
				coll: function(item) { 
					item = angular.copy(item);
					delete item.id;
					return expandUrl(url, paramDefaults, item);					
				}
			}
			// Make sure actions param is defined and make a copy so we can safely modify
			actions = angular.extend({}, resourceProviderDefaultActions, actions);
			options = options || {};


			
			// Call through to the delegate factory
			var Resource = $delegate(url, paramDefaults, actions, options);			
			// If the resource is supposed to be read-only, remove all methods that are not GET or HEAD actions
			if (options.readOnly)
				removeWriteActions(Resource, actions);

			
			// Create/set a store, if necessary
			if (options.store === true) // If options.store is true...
				Resource.store = new Store(
						expandUrl.bind(null, url, paramDefaults), // Use URL as key
						function chopOffId(resource) { // Chop off the last segment of the URL, i.e. if a resource has /path/to/resource/:id as its URL, chop off the id
							var key = expandUrl(url, paramDefaults, resource);
							key = key.substring(0, key.lastIndexOf('/') + 1); // +1: second parameter to substring is the 'the offset into the string of the first character not to include in the returned substring' (MDN)
							return key;
						}) // create a store using URLs as keys
			else if (angular.isObject(options.store)) // otherwise if a Store object was provided...				
				Resource.store = options.store; // ...use it
			


			// This instance method will not be present if options.readOnly flag is set
			Resource.prototype.$save = !options.readOnly && function(params, success, error) {
				return Resource.save.call(this, params, this, success, error);
			}
			
			Resource.save = 
					!options.readOnly && 
					/**
					 * @ngdoc method
					 * @name $resource#save
					 * @description
					 * Convenience method that executes the update action if an `id` field is defined on the `data`,
					 * and the create action if it isn't. It follows the same conventions as the standard Angular `$resource` actions.
					 *
					 * This method and its instance version `$save` will not be present in resources created with the `options.readOnly` flag set 
					**/
					function(params, data, success, error) {
						// If the second parameter is not an object, then params must have been omitted,
						// because the two following ones, if present, are functions
						// So reassign parameters to account for this (although some of them might be undefined anyway)
						if (!angular.isObject(data)) {
							data = params; success = data; error = success, params = {};
						}
						if (data.id || data.id === 0)
							return Resource.update.apply(this, arguments);
						else
							return Resource.create.apply(this, arguments);
					}



			function storifyRead(delegateFn, actionUrl, actionParams) {
				return function(params, success, error) {
					// Calculate effective parameters
					params = angular.extend({}, paramDefaults, actionParams, params);
					// Attempt to read from store, if store is available
					// TODO: Is there any way to make this more general using the store's keygen? Currently this only works if the store uses URLs as keys...
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
						if (Resource.store) Resource.store.put(resource);
						return resource;
					});
					return result;
				};
			}	

			function storifyWrite(delegateFn, actionUrl, actionParams) {
				return function(params, data, success, error) {			
					// Calculate effective parameters
					params = angular.extend({}, paramDefaults, actionParams, params);
					// Always call through to delegate function					
					var result = delegateFn.apply(this, arguments);
					var promise = result.$promise || result; // Instance calls return the promise directly
					promise.then(function(resource) {
						// Store result if store is available
						if (Resource.store) Resource.store.put(resource);
						return resource;
					});
					return result;
				};
			}

			function storifyDelete(delegateFn, actionUrl, actionParams) {
				return function(params, data, success, error) {
					// Calculate effective parameters
					params = angular.extend({}, paramDefaults, actionParams, params);
					// Always call through to delegate function
					var result = delegateFn.apply(this, arguments);
					var promise = result.$promise || result; // Instance calls return the promise directly
					promise.then(function(resource) { 
						// Remove from store if store is available
						if (Resource.store) Resource.store.remove(expandUrl(actionUrl, params, resource));
					});
					return result;
				};
			}

			if (options.store) angular.forEach(actions, function(action, name) {
				var delegateFn = Resource[name];
				var storifiedFn;
				switch (action.method.toUpperCase()) {
					case 'GET': storifiedFn = storifyRead(delegateFn, action.url || url, action.params); break;
					case 'POST':
					case 'PUT': storifiedFn = storifyWrite(delegateFn, action.url || url, action.params); break;
					case 'DELETE': storifiedFn = storifyDelete(delegateFn, action.url || url, action.params); break;
				}				
				Resource[name] = storifiedFn;
			});

		 	return Resource;
		};	

		return decorated;
	}]);
})();