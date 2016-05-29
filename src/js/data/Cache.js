// Steps:
// 1. Inserting a collection also inserts the elements in that collection
// 2. Inserting an element also inserts it into its collection, if it is present
// 3. Updating an element moves it from one collection to the other
// 4. Deleting an element deletes it from its collection

angular
	.module('Checkbook.Data')
	.factory('Cache', function() {
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
		}

		Cache.prototype.get = function(key) {
			var self = this;
			return self.items[key];
		};

		Cache.prototype.remove = function(key) {
			var self = this;
			delete self.items[key];
		}

		return Cache;
	});