angular.module('Checkbook.Model').factory('Entry', [ '$resource', 'eventEmitter', 'expandUrl', 'Store', function($resource, eventEmitter, expandUrl, Store) {
	const PRIMARY_URL = '/entries/:id';
	const PRIMARY_URL_PARAMS = { id: '@id' };
	const SECONDARY_URL = '/months/:monthid/categories/:category/entries/:id';
	const SECONDARY_URL_PARAMS = { monthid: '@monthid', category: '@category', id: '@id' };

	/**
	 * Special Store to deal with the complication that the `Entry` resource is accessible through two different
	 * URL spaces: `/entries/:id` and `/months/:monthid/categories/:category/entry/:id`.
	 * It stores collections under their actual URLs, but always stores elements under the primary URL 
	 * (i.e. /entries/:id). Thus, even entries adding from adding a collection gotten through the secondary URL
	 * will be found by the store on subsequent requests to the primary URL.
	 *
	 * Entries are associated with both collections. 
	 */
	var entryStore = new Store(
		function keygen(item) {			
			// If this is a collection that has the monthid property and the category property set, it must be 
			// one gotten from the secondary URL (/months/:monthid/categories/:category/entries). Therefore,
			// store it under the secondary URL.
			if (this.isCollection(item) && (item.monthid || item.monthid === 0) && (item.category || item.category === 0))
					return expandUrl(SECONDARY_URL, SECONDARY_URL_PARAMS, item);

			// Store everything else under the primary URL (both individual entry elements and the collection 
			// gotten from /entries)
			return expandUrl(PRIMARY_URL, PRIMARY_URL_PARAMS, item);
		},
		function associate(entry) {
			var primary = expandUrl(PRIMARY_URL, PRIMARY_URL_PARAMS, entry); // Slightly overkill because after chopping off the id, 
																			 // this will always come out to /entries/. But this way 
																			 // we'll be futureproof if the primary URL ever changes.
			var secondary = expandUrl(SECONDARY_URL, SECONDARY_URL_PARAMS, entry);
			
			return [ primary, secondary ].map(function(key) { // Chop off :id segment from URLs
				return key.substring(0, key.lastIndexOf('/') + 1); // +1: second substring parameter is offset of first character not included in result
			})			
		}, 
		[ 'datetime', 'category' ]);

	var Entry = $resource(
		PRIMARY_URL,
		PRIMARY_URL_PARAMS,
		{ 
			// Query to the /months/:monthid/categories/:category/entries endpoint to get all entries
			// for a specific month and category.
			querySpecific: {
				method: 'GET',
				url: SECONDARY_URL,
				isArray: true,
				transformResponse: [ angular.fromJson, function(data, headers) {
					var matches = /months\/(\d+)\/categories\/(\d+)\/entries/i.exec(headers('location'));
					data.monthid = Number(matches[1]); 
					data.category = Number(matches[2]); 									
					return data; 
					// TODO: This doesn't actually work - the monthid and category properties set by this function
					// are not present in the result returned by querySpecific. 
					// Filed bug report at https://github.com/angular/angular.js/issues/14797	
					// 
					// Currently, we have changed the angular-resource installed through bower to carry over at
					// least the monthid and category properties
				} ]
			}
		},
		{ store: entryStore });

	eventEmitter.inject(Entry);

	// Create properties datetime and category to allow for event emission	
	Object.defineProperty(Entry.prototype, 'datetime', {
		enumerable: true,
		get: function() { return this._datetime; },
		set: function(datetime) { 
			var self = this;					
			var old = self._datetime; // Remember old value for event emission
			self._datetime = datetime;
			if (old && datetime && old.getTime() !== datetime.getTime() || !old && datetime || !datetime && old) // Was there actually a change?
				self.emit('change', self, 'datetime', old, datetime);
		}		
	});
	Object.defineProperty(Entry.prototype, 'category', {
		enumerable: true,
		get: function() { return this._category; },
		set: function(category) {
			var self = this;
			var old = self._category; // Remember old value for event emission
			self._category = category;
			if (old !== category) // Was there actually a change?
				self.emit('change', self, 'category', old, category);
		}
	});
	// Create read-only property monthid
	// (Needs to be a property so we can use it in url expansion)
	Object.defineProperty(Entry.prototype, 'monthid', {
		enumerable: true,
		get: function() { 
			var self = this;

			var month = self.datetime.getMonth();
			var year = self.datetime.getFullYear();
			return (year - 1970) * 12 + month;
		}
	});

	/**
	 * Will return true if other is an Entry with identical
	 * caption, value, category, details and datetime.
	 */
	Entry.prototype.equals = function(other) {
		var self = this;
		return (other instanceof Entry) &&
			self.caption === other.caption &&
			self.value === other.value &&
			self.category === other.category &&
			self.datetime.getTime() === other.datetime.getTime() &&
			self.details === other.details;
	}

	return Entry;
}]);