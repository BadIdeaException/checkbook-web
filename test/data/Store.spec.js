describe('Store', function() {
	beforeEach(angular.mock.module('Checkbook'));

	const DEFAULT_KEYGEN = {
		elem: function(x) { return this.coll(x) + x.id; },
		coll: function(x) { return '/'; }
	};

	var Store;
	beforeEach(inject(function(_Store_) {
		Store = _Store_;
	}));

	it('should throw on missing or invalid keygen', function() {
		function constructor(keygen) { return new Store(keygen); } // Needed because we can't use new keyword inside expect
		expect(constructor).to.throw(TypeError);		
		expect(constructor.bind(null, {})).to.throw(TypeError);
	});

	describe('.put', function() {
		var store;
		beforeEach(function() {
			store = new Store(DEFAULT_KEYGEN);
		});

		it('should fail if item is not an object', function() {
			expect(store.put.bind(store,'item')).to.throw(TypeError, /was not an object/);
		});

		it('should contain the added item', function() {
			const KEY = 'key';
			var item = {};

			store.put(KEY, item);

			expect(store.items[KEY]).to.equal(item);
		});		

		it('should autogenerate a key using the key function', function() {
			const ELEM_KEY = 'elem';
			const COLL_KEY = 'coll';
			var keygen = {
				elem: sinon.stub().returns(ELEM_KEY), 
				coll: sinon.stub().returns(COLL_KEY)
			}
			store = new Store(keygen);
			var x = {};

			store.put(x);
			expect(keygen.elem).to.have.been.called;
			expect(store.items[ELEM_KEY]).to.equal(x);

			x = [];
			store.put(x);
			expect(keygen.coll).to.have.been.called;
			expect(store.items[COLL_KEY]).to.equal(x);
		});

		it('should add all elements of a collection', function() {
			var coll = [ { id: 1 }, { id: 2} ];

			store.put(coll);
			expect(store.items[DEFAULT_KEYGEN.coll(coll)]).to.equal(coll); // Collection itself should have been added
			for (var i = 0; i < coll.length; i++) 
				expect(store.items[DEFAULT_KEYGEN.elem(coll[i])]).to.equal(coll[i]); // All items should have been added		
		});

		it('should add elements into already present collections', function() {
			var coll = [];
			var item = { id: 1 };
			store.put(coll);
			store.put(item);
			expect(store.get(DEFAULT_KEYGEN.coll(coll))).to.contain(item);
		});

		it('should subscribe to item changes when created with a watchlist', function() {
			var item = {};
			item.on = sinon.spy();
			store = new Store(DEFAULT_KEYGEN, ['prop']);
			store.put(item);
			// TODO: Go off of a provider property
			expect(item.on).to.have.been.calledWith('change', store.onItemChanged);
		});
	});

	describe('.remove', function() {
		it('should not contain an item after it has been removed', function() {
			const KEY = 'key';
			var store = new Store(DEFAULT_KEYGEN);
			var item = {};

			store.items[KEY] = item;
			store.remove(KEY);

			expect(store.get(KEY)).to.not.exist;
		});

		it('should also remove an item from its collection', function() {
			var store = new Store(DEFAULT_KEYGEN);
			var item = { id: 1 };
			var coll = [ item ];

			store.put(coll);
			store.remove(DEFAULT_KEYGEN.elem(item));

			expect(store.get(DEFAULT_KEYGEN.coll(coll))).to.be.empty;
		});

		it('should unsubscribe from item changes when created with a watchlist', function() {
			const KEY = 'key';
			var item = {};
			item.off = sinon.spy();
			store = new Store(DEFAULT_KEYGEN, ['prop']);
			
			store.items[KEY] = item;
			store.remove(KEY);
			expect(item.off).to.have.been.calledWith('change', store.onItemChanged);
		});
	});

	it('should remove and re-add when the change event handler is called', function() {
		const PROPERTY_NAME = 'prop';
		var store = new Store(DEFAULT_KEYGEN, [ PROPERTY_NAME ]);
		var put = sinon.stub(store, 'put');
		var remove = sinon.stub(store, 'remove');

		var item = {};
		store.items[DEFAULT_KEYGEN.elem(item)] = item; 
		
		store.onItemChanged(item, PROPERTY_NAME, 'val');
		expect(remove).to.have.been.calledWith(DEFAULT_KEYGEN.elem(item));
		expect(put).to.have.been.calledWith(item);
	});
});