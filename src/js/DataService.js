var module = angular.module('Checkbook.Data', []);

module.factory('dataService', [ 'Month', 'CategoryForMonth', 'Entry', function(Month, CategoryForMonth, Entry) {
	var DataService = function() {
		var self = this;

		self.getMonths = function() {
			if (self.months === undefined || self.months === null)
				self.months = Month.query();

			return self.months;
		};
	};

	var dataService = new DataService();

	return dataService;
}]);