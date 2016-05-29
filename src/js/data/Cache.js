// Steps:
// 1. Inserting a collection also inserts the elements in that collection
// 2. Inserting an element also inserts it into its collection, if it is present
// 3. Updating an element moves it from one collection to the other
// 4. Deleting an element deletes it from its collection

angular
	.module('Checkbook.Data')
	.factory('Cache', function() {
		// Terminology:
		// An element is a basic thing that can be contained in the cache (for example an object)
		// A collection can be contained in the cache. It consists of elements (for example an array of objects)
		// An item can be either an element or a collection
		var isCollection = angular.isArray;

		function Cache(keygen) {
			var self = this;
			self.items = {};

			self.keygen = keygen;
		}

		Cache.prototype.put = function(key, item) {
			var self = this;

			if (!item) {
				item = key; 
				key = isCollection(item) ? self.keygen.coll(item) : self.keygen.elem(item);
			}

			self.items[key] = item;
			
			// If adding a collection, add all elements of that collection
			if (isCollection(item)) {
				item.forEach(function(item) { self.put(item) });
			}

			// If we add an element, and there is a collection that this element
			// should be contained in, add it to the collection as well
			if (!isCollection(item) && self.has(self.keygen.coll(item))) {
				var coll = self.get(self.keygen.coll(item));
				if (coll.indexOf(item) === -1) // THIS WILL ONLY WORK IF ITEMS ARE OBJECTS
					coll.push(item);
			}
		}

		Cache.prototype.get = function(key) {
			var self = this;
			return self.items[key];
		};

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