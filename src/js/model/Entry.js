var module = angular.module('Checkbook.Model');

module.factory('Entry', [ '$http', function($http) {
	const URI_TEMPLATE = new URITemplate('/months/{monthid}/categories/{category}/entries/{id}');

	var Entry = function(values) {
		var self = this;

		self.$resolved = false;

		// Define a setter for the category property to remember the last saved value for this property
		// This will be required to construct the proper resource URI when hitting the server for this entry
		var _category;
		Object.defineProperty(self, 'category', {
			enumerable: true,
			get: function() { return _category; },
			set: function(category) { 
				if (this._lastSavedCategory === undefined || this._lastSavedCategory === null)
					this._lastSavedCategory = this.category;
				_category = category;
			}
		});

		// Define a setter for the datetime property to remember the last saved value for this property
		// This will be required to construct the proper resource URI when hitting the server for this entry
		var _datetime;
		Object.defineProperty(self, 'datetime', {
			enumerable: true,
			get: function() { return _datetime; },
			set: function(datetime) {
				if (this.datetime && (this._lastSavedMonthId === undefined || this._lastSavedMonthId === null))
					this._lastSavedMonthId = this.getMonthId();
				_datetime = datetime;
			}
		});

		Object.keys(values).forEach(function(key) {
			if (key === 'datetime' && !(values[key] instanceof Date))
				self.datetime = new Date(values[key])
			else
				self[key] = values[key];

		});
	}

	Entry.prototype.getMonthId = function() {
		var self = this;

		var month = self.datetime.getMonth();
		var year = self.datetime.getFullYear();
		return (year - 1970) * 12 + month;
	}

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

	// Can be called either as query(monthid, category) or 
	// as query({ monthid: monthid, category: category })
	Entry.query = function(arg1, arg2) {
		if (arg2 === undefined || arg2 === null) {
			arg2 = arg1.category;
			arg1 = arg1.monthid;
		}

		var uri = URI_TEMPLATE.expand({ monthid: arg1, category: arg2, id: '' }); // Remove id from URI
		if (uri[uri.length-1] === '/') uri = uri.substr(0, uri.length-1); // Remove trailing slash

		function transformResponse(data) {
			// Transform data into Entry objects
			return data.map(function createEntry(item) {
				var entry = new Entry(item);
				entry.$resolved = true; // The new entry has been loaded from the server
				return entry;
			});
		}

		var entries = [];
		entries.$promise = $http
			.get(uri, { transformResponse: transformResponse })
			.then(function(response) {
				// Fill result array with loaded values
				response.data.forEach(function(entry) { entries.push(entry); });
			});

		return entries;
	}

	Entry.prototype.$get = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand({ 
			monthid: (self._lastSavedMonthId !== undefined && self._lastSavedMonthId !== null ? self._lastSavedMonthId : self.getMonthId()), // Try last saved month id, if that doesn't exist, use the current one
			category: (self._lastSavedCategory !== undefined && self._lastSavedCategory !== null ? self._lastSavedCategory : self.category), // Try last saved category, if that doesn't exist, use the current one
			id: self.id 
		});

		self.$promise = $http
			.get(uri)
			.then(function success(response) {
				var data = response.data;
				// Copy new values into self
				for (key in data) 
					self[key] = data[key];
				return self;
			})
			.finally(function(x) {
				// Set resolved to true because server interaction has happened
				self.$resolved = true;
				return x;
			});

		return self;
	};

	Entry.prototype.$create = function() {
		var self = this;

		// No need to try any last saved values when creating a new entry
		var uri = URI_TEMPLATE.expand({ monthid: self.getMonthId(), category: self.category });

		if (uri[uri.length - 1] === '/') uri = uri.substr(0, uri.length - 1) // Strip trailing slash from URI

		// Prepare a data object that won't include the $ properties like $resolved
		var data = {};
		Object.keys(self).forEach(function(key) {
			if (key[0] !== '$') data[key] = self[key];
		});

		self.$promise = $http
			.post(uri, data) // POST the data - this will not include the $ properties like $resolved
			.then(function success(response) {
				// Set id property from location header in the server response
				var location = response.headers('location');
				self.id = Number(new URI(location).segment(-1));
			})
			.finally(function(x) {
				self.$resolved = true;
				delete self._lastSavedCategory; delete self._lastSavedMonthId;
				return x;
			});

		return self;
	};

	Entry.prototype.$update = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand({ 
			monthid: (self._lastSavedMonthId !== undefined && self._lastSavedMonthId !== null ? self._lastSavedMonthId : self.getMonthId()), // Try last saved month id, if that doesn't exist, use the current one
			category: (self._lastSavedCategory !== undefined && self._lastSavedCategory !== null ? self._lastSavedCategory : self.category), // Try last saved category, if that doesn't exist, use the current one
			id: self.id 
		});

		// Prepare a data object that won't include the $ properties like $resolved
		var data = {};
		Object.keys(self).forEach(function(key) {
			if (key[0] !== '$') data[key] = self[key];
		});

		self.$promise = $http
			.put(uri, data)
			.finally(function(x) { 
				self.$resolved = true;
				delete self._lastSavedCategory; delete self._lastSavedMonthId;
				return x;
			});

		return self;	
	};

	// Note: will be wrapped in DataService to keep data service's 
	// data structure in sync with the server
	Entry.prototype.$save = function() {
		var self = this;

		if (self.id === undefined || self.id === null) 
			return self.$create();
		else
			return self.$update();
	};

	// Note: will be wrapped in DataService to keep data service's 
	// data structure in sync with the server
	Entry.prototype.$delete = function() {
		var self = this;

		var uri = URI_TEMPLATE.expand({ 
			monthid: (self._lastSavedMonthId !== undefined && self._lastSavedMonthId !== null ? self._lastSavedMonthId : self.getMonthId()), // Try last saved month id, if that doesn't exist, use the current one
			category: (self._lastSavedCategory !== undefined && self._lastSavedCategory !== null ? self._lastSavedCategory : self.category), // Try last saved category, if that doesn't exist, use the current one
			id: self.id 
		});

		self.$promise = $http
			.delete(uri);

		return self;
	};

	return Entry;
}]);