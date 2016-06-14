// Steps:
// 1. Inserting a collection also inserts the elements in that collection
// 2. Inserting an element also inserts it into its collection, if it is present
// 3. Updating an element moves it from one collection to the other
// 4. Deleting an element deletes it from its collection

angular
	.module('Checkbook.Data')
	/**
	 * A cache that preserves the element/collection relationship. 
	 *
	 * ## Terminology
	 * An _element_ is a basic thing that can be contained in the cache. A _collection_ consists
	 * of elements and can also be contained in the cache. An _item_ is an element or a collection.
	 *
	 * ## Invariant
	 * For any element in the cache, if the cache contains a collection that the element belongs with, it will be 
	 * contained in the collection. For any collection contained in the cache, its elements are also contained in the cache.
	 * Note however that it is possible for elements to be contained in the cache for which there is no collection in the
	 * cache.
	 *
	 * ## Element-collection relationship
	 * Elements may be contained in one collection. This collection can be referenced by calling the key generator's (see below)  
	 * `coll` method with the element.
	 */
	.factory('Cache', function() {
		// Terminology:
		// An element is a basic thing that can be contained in the cache (for example an object)
		// A collection can be contained in the cache. It consists of elements (for example an array of objects)
		// An item can be either an element or a collection
		var isCollection = angular.isArray;

		/**
		 * Creates a new Cache. The `keygen` must be an object containing two methods:
		 * - `elem` must return a key for an element when passed an element
		 * - `coll` must return a key for a collection when passed a collection, and a key for the collection that should
		 * contain the element when passed an element
		 * @param {[type]} keygen Key generator to use. It must have methods `elem` and `coll`.
		 * @throws {TypeError} If `keygen` isn't an object with methods `elem` and `coll`
		 */
		function Cache(keygen) {
			var self = this;
			if (!keygen)
				throw new TypeError('No keygen provided');
			else if (typeof keygen.elem !== 'function' || typeof keygen.coll !== 'function')
				throw new TypeError('keygen must have methods elem and coll');

			self.items = {};

			self.keygen = keygen;
		}

		/**
		 * Puts an item into the cache. If the item is an element, and the element's associated collection is
		 * present in the cache (as determined by calling `keygen.coll`), the element will be appended to that
		 * collection. If the item is a collection, all elements in the collection are put into the cache as well.
		 * @param  {[type]} key  [description]
		 * @param  {[type]} item [description]
		 * @return {[type]}      [description]
		 */
		Cache.prototype.put = function(key, item) {
			var self = this;

			if (!item) { // No key was passed
				item = key; 
				key = isCollection(item) ? self.keygen.coll(item) : self.keygen.elem(item);
			}

			self.items[key] = item;
			
			// If adding a collection, add all elements of that collection as well
			if (isCollection(item)) {
				item.forEach(function(item) { self.items[self.keygen.elem(item)] = item; });
			}

			// If we add an element, and there is a collection that this element
			// should be contained in, add it to the collection as well
			if (!isCollection(item) && self.has(self.keygen.coll(item))) {
				var coll = self.get(self.keygen.coll(item));
				if (coll.indexOf(item) === -1) // THIS WILL ONLY WORK IF ITEMS ARE OBJECTS
					coll.push(item);
			}
		}

		/**
		 * Retrieves an item from the cache.
		 * @param  key The key for which to retrieve the item.
		 * @return The item contained in the cache for that key, or `undefined` if no such item exists.
		 */
		Cache.prototype.get = function(key) {
			var self = this;
			return self.items[key];
		};

		/**
		 * Removes an item from the cache. If the item is an element, and its associated collection is
		 * also contained in the cache, it is removed from the collection. If the item is a collection,
		 * *only* the collection is removed - its contained elements are kept in the cache.
		 * @param  key The key of the item to remove.
		 */
		Cache.prototype.remove = function(key) {
			var self = this;
			var item = self.items[key];
			delete self.items[key];

			if (!isCollection(item) && self.has(self.keygen.coll(item))) {
				var coll = self.get(self.keygen.coll(item));
				if (coll.indexOf(item) > -1) // This should always be the case
					coll.splice(coll.indexOf(item), 1);
			}
		};

		Cache.prototype.has = function(key) {
			var self = this;
			return self.items[key] !== undefined;
		};

		return Cache;
	});