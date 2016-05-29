describe.only('Cache', function() {
	beforeEach(angular.mock.module('Checkbook'));

	const DEFAULT_KEYGEN = {
		elem: function(x) { return this.coll(x) + x.id; },
		coll: function(x) { return '/'; }
	};

	var Cache;
	beforeEach(inject(function(_Cache_) {
		Cache = _Cache_;
	}));

	describe('.put', function() {
		var cache;
		beforeEach(function() {
			cache = new Cache(DEFAULT_KEYGEN);
		});

		it('should contain the added item', function() {
			const KEY = 'key';
			var item = {};

			cache.put(KEY, item);

			expect(cache.items[KEY]).to.equal(item);
		});

		it('should autogenerate a key using the key function', function() {
			const ELEM_KEY = 'elem';
			const COLL_KEY = 'coll';
			var keygen = {
				elem: sinon.stub().returns(ELEM_KEY), 
				coll: sinon.stub().returns(COLL_KEY)
			}
			cache = new Cache(keygen);
			var x = {};

			cache.put(x);
			expect(keygen.elem).to.have.been.called;
			expect(cache.items[ELEM_KEY]).to.equal(x);

			x = [];
			cache.put(x);
			expect(keygen.coll).to.have.been.called;
			expect(cache.items[COLL_KEY]).to.equal(x);
		});

		it('should add all elements of a collection', function() {
			var coll = [ { id: 1 }, { id: 2} ];

			cache.put(coll);
			expect(cache.items[DEFAULT_KEYGEN.coll(coll)]).to.equal(coll); // Collection should have been added
			for (var i = 0; i < coll.length; i++) 
				expect(cache.items[DEFAULT_KEYGEN.elem(coll[i])]).to.equal(coll[i]); // All items should have been added		
		});

		it('should add elements into already present collections', function() {
			var coll = [];
			var item = { id: 1 };
			cache.put(coll);
			cache.put(item);
			expect(cache.get(DEFAULT_KEYGEN.coll(coll))).to.contain(item);
		});
	});

	describe('.remove', function() {
		it('should not contain an item after it has been removed', function() {
			const KEY = 'key';
			var cache = new Cache(DEFAULT_KEYGEN);
			var item = {};

			cache.items[KEY] = item;
			cache.remove(KEY);

			expect(cache.items[KEY]).to.not.exist;
		});

		it('should also remove an item from its collection', function() {
			var cache = new Cache(DEFAULT_KEYGEN);
			var item = { id: 1 };
			var coll = [ item ];

			cache.put(coll);
			cache.remove(DEFAULT_KEYGEN.elem(item));

			expect(cache.get(DEFAULT_KEYGEN.coll(coll))).to.be.empty;
		})
	});
});