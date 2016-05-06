describe.only('Entry', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const ENTRY = { id: 1, caption: '1', category: 1, datetime: new Date(0), value: 100, details: '1' };

	var Entry;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	describe('.querySpecific', function() {
		it('should exist', function() {
			expect(Entry).itself.to.respondTo('querySpecific');
		});

		it('should GET the correct route when calling querySpecific', function() {
			var monthid = 0;
			var category = 1;

			$httpBackend
				.expectGET('/months/' + monthid + '/categories/' + category + '/entries')
				.respond(200, [ ENTRY ]);

			Entry.querySpecific({ monthid: monthid, category: category });
			expect($httpBackend.flush).to.not.throw();
		});
	})

	
	// it('should remember the previous value when assigning a new category', function() {
	// 	var entry = new Entry(ENTRY);
	// 	expect(entry._lastSavedCategory).to.not.exist;
	// 	entry.category++;
	// 	expect(entry._lastSavedCategory).to.exist.and.equal(ENTRY.category);
	// });

	// it('should remember the previous month id when assigning a new date', function() {
	// 	var entry = new Entry(ENTRY);
	// 	expect(entry._lastSavedMonthId).to.not.exist;
	// 	entry.datetime = new Date();
	// 	expect(entry._lastSavedMonthId).to.exist.and.equal(0);
	// });

	// it('should write to the correct url when saving', function() {
	// 	var entry = new Entry(ENTRY);
	// 	$httpBackend
	// 		.expectPOST('/months/0/categories/1/entries')
	// 		.respond(201);

	// 	entry.category++;
	// 	entry.datetime = new Date();
	// 	entry.$save();
	// 	$httpBackend.flush();
	// });

	// it('should update last saved fields only after a successful save', function() {
	// 	var entry = new Entry(ENTRY);
	// 	entry.category++; entry.datetime = new Date();
		
	// 	// Execute an unsuccessful save 
	// 	$httpBackend
	// 		.expectPOST('/months/0/categories/1/entries')
	// 		.respond(500); // force failure

	// 	entry.$save();
	// 	$httpBackend.flush();

	// 	expect(entry._lastSavedCategory).to.equal(ENTRY.category);
	// 	expect(entry._lastSavedMonthId).to.equal(0);

	// 	// Execute a successful save 
	// 	$httpBackend
	// 		.expectPOST('/months/0/categories/1/entries')
	// 		.respond(201); 

	// 	entry.$save();
	// 	$httpBackend.flush();
		
	// 	expect(entry._lastSavedCategory).to.equal(entry.category);
	// 	expect(entry._lastSavedMonthId).to.equal(entry.getMonthId());
	// });

	it('.equals should be true for identical entries', function() {
		var entry = new Entry(ENTRY);
		var same = new Entry(ENTRY);

		expect(entry.equals(entry)).to.be.true;
		expect(entry.equals(same)).to.be.true;

		var different = new Entry(ENTRY);
		different.value = 2 * entry.value;
		expect(entry.equals(different)).to.be.false;
	});

});