var module = angular.module('Checkbook.Data', []);

module.factory('dataService', [ 'Month', 'CategoryForMonth', 'Entry', function(Month, CategoryForMonth, Entry) {
	function getById(id) {
		for (var i = 0; i < this.length; i++) {
			if (this[i].id === id) return this[i];
		}
		return null;		
	}

	var DataService = function() {
		var self = this;

		self.getMonths = function() {
			if (self.months === undefined || self.months === null)
				self.months = Month.query();

			return self.months;
		};

		var _months;
		Object.defineProperty(self, 'months', {
			enumerable: true,
			get: function() { return _months; },
			set: function(months) {
				_months = months;
				// Attach convenience function to get month by id
				if (_months !== undefined && _months !== null)
					_months.getById = getById;
			}
		})
	};

	var dataService = new DataService();

	function findCategoryForEntry(entry) {
		if (!dataService.months) return null;

		for (var i = 0; i < dataService.months.length; i++) {
			var month = dataService.months[i];
			if (month.categories) for (var j = 0; j < month.categories.length; j++) { 
				var category = month.categories[j];
				if (category.entries) for (var k = 0; k < category.entries.length; k++) 
					if (category.entries[k].id === entry.id) return category;
			}
		}
	}

	// Wrap Entry.prototype.$save to move an entry from its old category/month to the new
	// when it is saved
	// Currently this happens regardless of whether the category/date actually changed
	var $save = Entry.prototype.$save;
	Entry.prototype.$save = function() {
		var entry = this;
		var result = $save.apply(entry, arguments);
		result.$promise.then(function(x) {
			// Delete from old category
			var category = findCategoryForEntry(entry);
			if (category && category.entries) 
				category.entries.splice(category.entries.indexOf(entry), 1);

			// Add to new category
			if (dataService.months) { // months may not have been loaded yet
				var month = dataService.months.getById(entry.getMonthId());
				if (month && month.categories) { // target month or its categories may not be loaded yet
					var category = month.categories.getById(entry.category);
					if (category && category.entries) // target category or its entries may not be loaded yet
						category.entries.push(entry);
				}
			}

			return x;
		});
		return result;
	};

	// Wrap Entry.prototype.$delete to remove an entry from its category/month
	// when it is deleted
	var $delete = Entry.prototype.$delete;
	Entry.prototype.$delete = function() {
		var entry = this;
		var result = $delete.apply(entry, arguments);
		result.$promise.then(function(x) {
			// Delete from old category
			var category = findCategoryForEntry(entry);
			if (category && category.entries)
				category.entries.splice(category.entries.indexOf(entry), 1);

			return x;
		});
	};

	return dataService;
}]);