describe('DataService', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	var dataService;
	var Month;
	var Entry;

	beforeEach(inject(function($injector) {
		dataService = $injector.get('dataService');
		Month = $injector.get('Month');
		Entry = $injector.get('Entry');
	}));

	it('should load months on the first call to getMonths', function() {
		var query = sinon.spy(Month, 'query');

		dataService.getMonths();
		expect(query).to.have.been.called;
		query.restore();
	});

	it('should return cached months subsequently', function() {
		const MONTHS = [ { id: 0, value: 100 }, { id: 1, value: 200 }];
		var query = sinon.spy(Month, 'query');

		dataService.months = MONTHS.map(function(month) { return new Month(month)});
		dataService.months.$resolved = true;

		expect(dataService.getMonths()).to.equal(dataService.months);
		expect(query).to.not.have.been.called;
		query.restore();
	});
});