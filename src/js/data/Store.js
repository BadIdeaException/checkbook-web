angular
	.module('Checkbook.Data')
	/**
	 * @ngdoc provider
	 * @module Checkbook.Data
	 * @name  StoreProvider
	 * @description
	 * This is the provider for {@link Store}. It can be used to configure properties of new stores.
	 */
	.provider('Store', function() {
		var provider = this;

		function makeArray(arg) {
			if (angular.isArray(arg)) return arg; // If it is already an array, leave it alone
			if (angular.isString(arg)) return [arg]; // If it is a string, wrap it in an array
			if (arg === null || arg === undefined) return []; // If it is null/undefined, return an empty array
		}

		/**
		 * @ngdoc property
		 * @module  Checkbook.Data
		 * @name StoreProvider#defaults
		 * @description
		 * Object containing default options when creating @{link Store} objects. The available properties are:
		 * - **changeEvent** - {String} - The name of the event that mutable-key items emit when one of their watched properties
		 * changes. The default value is `change`, but it can be reconfigured to avoid clashes with other frameworks. Note that changing
		 * this will only affect new stores.
		 * - **isCollection** - {Function} - The default `isCollection` function to use when constructing new `Store` instances. 
		 * Defaults to [`angular.isArray`](https://docs.angularjs.org/api/ng/function/angular.isArray).
		 */
		provider.defaults = {
			changeEvent: 'change',
			isCollection: angular.isArray
		};		

		provider.$get = function() {
			/**
			 * @ngdoc service
			 * @module  Checkbook.Data
			 * @name  Store
			 * @description 
			 * A data store for RESTful resources. These can be put into, retrieved from and deleted from the store under an identifying key. 
			 * 
			 * Individual resources (called _elements_) are usually part of a _collection_. For instance, in a hypothetical RESTful architecture, 
			 * individual `User` resources (elements) might be available under e.g. `/api/users/john`, while `/api/users` gives a list
			 * of all users (the associated collection). The store automatically manages this element-collection relationship. 
			 * This means that
			 * 1. when an element is added to the store, and the store contains the associated collection, the element will be included
			 * into the collection
			 * 2. when a collection is added to the store, all the elements it contains will also be added
			 * 3. when an element is removed from the store, and the store contains the associated collection, the element will also be
			 * removed from the collection.
			 * 4. when a collection is removed from the store, however, its elements will *not* be removed.
			 *
			 * # Keys
			 * Items are identified by unique keys, which must be strings. When creating a store, you need to provide a key generator function
			 * `function(item)`, which calculates and returns the key for the `item`. 
			 *
			 * # Association
			 * Elements can be part of collections, and any collection that an element should belong to is called one of that element's 
			 * _associated collections_. You must provide an association function `function associate(elem)` when creating a new store that 
			 * determines which collections are associated with a given element. If, for instance, an element is available under
			 * `/api/users/john` and `/api/moderators/john`, then `associate` should return the keys for both the collections `/api/users` and
			 * `/api/moderators` for the element `john`.
			 * 
			 * # Mutable keys
			 * Generally, keys are assumed to be unchanging in that changes to the item do not affect the key for that item. In cases where item
			 * keys need to change with modifications to the item, stores can subscribe to be notified of changes to contained items. Items must
			 * emit `change` events on property changes and be able to subscribe and unsubscribe listeners with the standard `on` and `off` methods,
			 * respectively. The event handler must have signature `function(item, property)`. Any time a `change` event is detected, the
			 * {@link Store#onItemChanged} event handler is run, which will simply remove and then re-add the item. {@link Store#put} will automatically
			 * subscribe to item changes if mutable keys are used, and {@link Store#remove} will unsubscribe. 
			 *
			 * Use mutable-key stores sparingly as they are more performance intensive than fixed-key ones.
			 *
			 * Currently, mutable keys are only supported for elements.
			 * 
			 * @param {Function} keygen Key generator function `function(item)` to use. Returned keys must be strings.
			 * @param {Function} associate Association function `function(elem)` to use. Given an element, it must return an array of keys
			 * for collections the element is associated with. It is permissible to return a string instead of an array if the element is
			 * associated with a single collection, or `null` or `undefined` if it is not associated with any.
			 * @param {Array.<string>=} watchlist An array of property names to watch for changes. If this parameter is omitted, 
			 * keys are assumed to be fixed, and no attempt will be made to subscribe to property change events. 
			 * @throw {TypeError} If `keygen` isn't an object with methods `elem` and `coll`
			 */						
			function Store(keygen, associate, watchlist) {
				var self = this;
				if (!angular.isFunction(keygen))
					throw new TypeError('No keygen function provided');
				if (!angular.isFunction(associate))
					throw new TypeError('No association function provided');

				self.items = {};

				var changeEvent = provider.defaults.changeEvent;

				/**
				 * @ngdoc property
				 * @name  Store#isCollection
				 * @description
				 * Function that will be used to determine if an item is a collection or an element. Must take an `item` as parameter
				 * and return `true` if and only if that item is a collection.
				 * @type {Function}
				 */
				self.isCollection = provider.defaults.isCollection;
				self.keygen = keygen;
				self.associate = associate;
				self.watchlist = watchlist;
				
				/**
				 * @ngdoc method
				 * @name  Store#put
				 * @description
				 * Puts an item into the store. 
				 * 
				 * If the item is an element, and the element's associated collection is
				 * present in the store (as determined by calling `associate`), the element will be appended to that
				 * collection. 
				 * 
				 * If the item is a collection, all elements in the collection are put into the store as well. 
				 * Elements that are already present are not overwritten. Elements already in the store are re-examined and,
				 * if appropriate, added to the collection. 
				 *
				 * If a `watchlist` is defined, the store will subscribe to the added item's `change` event using `item.on`.
				 * @param {string=} key  The key to store the item under. If provided, this will override the key generated by the 
				 * key generator. Note that providing a key is not recommended and may break the element-collection relationship.
				 * @param  {Object} item The item to store.
				 */
				self.put = function(key, item) {
					var self = this;

					if (!item) { // No key was passed
						item = key; 
						key = self.keygen(item);
					}

					if (typeof item !== 'object') throw new TypeError('Item was not an object: ' + typeof item + ' ' + item);

					// When adding a collection, check all elements to see if they should be included in the new collection
					if (self.isCollection(item)) 
						angular.forEach(self.items, function(other) {
							if (!self.isCollection(other)) {
								var associated = makeArray(self.associate(other)); // The element's associated collections
								// If the new collection is associated with the element, and the element isn't already contained, add it
								if (associated.indexOf(key) !== -1 && item.indexOf(other) === -1)
									item.push(other); 
							}
						});

					// When adding a collection, add all elements of that collection as well
					if (self.isCollection(item)) {
						item.forEach(function(element) { 
							var key = self.keygen(element);
							if (!self.has(key)) // Don't overwrite elements that are already there
								self.put(element); // Need to self.put here because the element might be associated with other collections as well
						});
					}

					// Watching for property changes => mutable keys.
					// Subscribe to changes on the item
					if (self.watchlist && !self.isCollection(item))
						item.on(changeEvent, self.onItemChanged);

					// When adding an element, add it to the associated collections as well
					if (!self.isCollection(item))
						makeArray(self.associate(item))
							.forEach(function(collKey) { // For all associated collections, 
								if (self.has(collKey)) { // if it is contained in the store,
									var coll = self.get(collKey); 
									if (!coll.indexOf(item) !== -1) // and the newly added item isn't contained in it
										coll.push(item); // add it
								}
						});
					self.items[key] = item;
				};

				/**
				 * @ngdoc method
				 * @name  Store#remove
				 * @description
				 * Removes an item from the store. If the item is an element, and its associated collection is
				 * also contained in the store, it is removed from the collection. If the item is a collection,
				 * **only** the collection is removed - its contained elements are kept in the store.
				 *
				 * If `watchlist` is defined, the store will unsubscribe from property change events using `item.off`.
				 * @param  {string} key The key of the item to remove.
				 */
				self.remove = function(key) {
					var self = this;
					var item = self.items[key];
					delete self.items[key];				

					// If the item had actually been contained in this store, and there is a watchlist, and 
					// the item is an element, unsubscribe from property change events
					if (item && self.watchlist && !self.isCollection(item))
						item.off(changeEvent, self.onItemChanged);

					// If the item had actually been contained in this store, and it is an element, and
					// its associated collection is also contained in this store, remove it from the collection
					makeArray(self.associate(item))
						.forEach(function(collKey) {
							if (self.has(collKey)) {
								var coll = self.get(collKey);
								if (coll.indexOf(item) > -1) // This should always be the case, unless someone is messing with the collection outside of the store
									coll.splice(coll.indexOf(item), 1);
							}
						});
				};
			}

			/**
			 * @ngdoc method
			 * @name Store#get
			 * @description
			 * Retrieves an item from the store.
			 * @param  {string} key The key for which to retrieve the item.
			 * @returns {Object} The item contained in the store for that key, or `undefined` if no such item exists.
			 */
			Store.prototype.get = function(key) {
				var self = this;
				return self.items[key];
			};

			/**
			 * @ngdoc method
			 * @name Store#has
			 * @description Checks if an item for the given key is currently contained in the store.
			 * @param  {string}  key The key for which to check
			 * @return {boolean}     Whether or not the item is contained in the store.
			 */
			Store.prototype.has = function(key) {
				var self = this;
				return self.items[key] !== undefined;
			};

			/**
			 * @ngdoc method
			 * @name  Store#onItemChanged
			 * @description 
			 * Event handler that is registered on items when they are added and a `watchlist` is defined. If the property
			 * is in the watchlist, and the item is contained in the store, it removes the item, then adds it again. This
			 * will effectively update the key and any element-collection relationships.
			 * @param  {Object} item     The item that fired the change event
			 * @param  {string} property The name of the property that was changed
			 * @param  {*} oldValue The value of the property before the change. This value is required to reconstruct the
			 * key.
			 * @param  {*=} newValue The current value of the property		 
			 */
			Store.prototype.onItemChanged = function(item, property, oldValue, newValue) {
				var self = this; 
				// Undo the change on a copy to get a valid key
				var temp = angular.copy(item);
				temp[property] = oldValue; 		
				var oldKey = self.keygen(temp);
				if (self.watchlist && self.watchlist.indexOf(property) !== -1 && self.has(oldKey)) {				
					self.remove(oldKey);
					self.put(item);
				}
			};

			return Store;			
		};
	
	});