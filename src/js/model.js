"use strict";

var module = angular.module('Checkbook.Model', []);

module.factory('Entry', [ '$resource', function($resource) {
	var Entry = $resource('/months/:monthid/categories/:category/entries/:entry', 
		{ 
			monthid: function() {
				var month = this.datetime.getMonth();
				var year = this.datetime.getFullYear();
				return (year - 1970) * 12 + month;
			},
			category: '@category', 
			entry: '@id' 
		});
	return Entry;
}]);

module.factory('Category', [ '$resource', function($resource) {
	var Category = $resource('/categories/:category', 
		{ category: '@id' });

	return Category;
}]);

module.factory('Month', [ '$resource', 'Category', 'Entry', function($resource, Category, Entry) {
	var Month = $resource('/months/:monthid',
		{ monthid: '@id' });

	// Set up a special object for categories that are returned from the
	// months/xy/categories route, i.e. that have a value associated with them.
	// Need to do some magic here because the url needs to be overridden.
	var CategoryForMonth = $resource('/months/:monthid/categories/:category',
			{ category: '@id', monthid: '@monthid' });
	// Immediately invoked function expression to avoid cluttering the context with _query and _get
	(function() {
		// Temporarily save current query and get method because the call to 
		// extend will overwrite them with those of Category
		var _query = CategoryForMonth.query;
		var _get = CategoryForMonth.get;
		// Extend CategoryForMonth with Category, this will copy all methods
		// and properties
		CategoryForMonth = angular.extend(CategoryForMonth, Category);
		// Restore original query and get methods
		CategoryForMonth.query = _query;
		CategoryForMonth.get = _get;
		// Set prototype to Category
		CategoryForMonth.prototype = Object.create(Category.prototype);	
		// Remove unwanted save, delete and remove functionalities because
		// Categories for a given month are virtual and can't be written to
		delete CategoryForMonth.prototype.$save;
		delete CategoryForMonth.prototype.$delete;
		delete CategoryForMonth.prototype.$remove;
		
		CategoryForMonth.prototype.getEntries = function() {
			var self = this;
			if (self.entries) return self.entries;

			self.entries = Entry.query({ monthid: self.monthid, category: self.id });
			return self.entries;
		};
	}());

	Month.prototype.getCategories = function() {		
		var self = this;

		// Return cached categories if present
		if (self.categories) return self.categories;

		// Otherwise get them from the server and cache for future calls
		self.categories = CategoryForMonth.query({ monthid: self.id });
		self.categories
			.$promise.then(function(categories) {
				categories.forEach(function (category) { category.monthid = self.id; });
			});
		return self.categories;
	};

	delete Month.prototype.$save;
	delete Month.prototype.$delete;
	delete Month.prototype.$remove;

	return Month;
}]);