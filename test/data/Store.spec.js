describe('Store', function() {
	beforeEach(angular.mock.module('Checkbook'));

	const DEFAULT_KEYGEN = function(item) {
		return '/' + (angular.isDefined(item.id) ? item.id : '');
	};

	const DEFAULT_ASSOCIATE = function(item) {
		return '/'; // All items belong to only one collection
	}

	var Store,
		store,
		elem;

	beforeEach(inject(function(_Store_) {
		Store = _Store_;
		store = new Store(DEFAULT_KEYGEN, DEFAULT_ASSOCIATE);
		elem = { id: 1 };
	}));

	it('should throw on missing or invalid keygen function', function() {
		function constructor(keygen) { return new Store(keygen, DEFAULT_ASSOCIATE); } // Needed because we can't use new keyword inside expect
		expect(constructor).to.throw(TypeError);		
		expect(constructor.bind(null, {})).to.throw(TypeError);
	});

	it('should throw on missing or invalid associate function', function() {
		function constructor(associate) { return new Store(DEFAULT_KEYGEN, associate); } // Needed because we can't use new keyword inside expect
		expect(constructor).to.throw(TypeError);		
		expect(constructor.bind(null, {})).to.throw(TypeError);
	});

	describe('.put', function() {
		it('should fail if item is not an object', function() {
			expect(store.put.bind(store,'item')).to.throw(TypeError, /was not an object/);
		});

		it('should contain the added item', function() {
			const KEY = 'key';

			store.put(KEY, elem);

			expect(store.items[KEY]).to.equal(elem);
		});		

		it('should autogenerate a key using the key function', function() {
			var keygen = sinon.spy(DEFAULT_KEYGEN);

			store = new Store(keygen, DEFAULT_ASSOCIATE);

			store.put(elem);
			expect(keygen).to.have.been.called;
			expect(store.items[keygen(elem)]).to.equal(elem);

			sinon.restore(keygen);
		});

		it('should add all collection elements as well when adding a collection', function() {
			var coll = [ { id: 1 }, { id: 2} ];

			store.put(coll);
			expect(store.items[DEFAULT_KEYGEN(coll)]).to.equal(coll); // Collection itself should have been added
			for (var i = 0; i < coll.length; i++) 
				expect(store.items[DEFAULT_KEYGEN(coll[i])]).to.equal(coll[i]); // All items should have been added		
		});

		it('should not overwrite elements that are already there when adding collection elements', function() {
			var coll = [ { id: 1 } ]; // NOT identical with elem (two distinct objects)			

			store.put(elem);
			store.put(coll);
			expect(store.get(store.keygen(elem))).to.equal(elem);
		});

		it('should add elements into already present associated collections', function() {
			var coll1 = [];
			var coll2 = [];

			var keygen = function(item) {
				if (item === coll1) return 'coll1';
				if (item === coll2) return 'coll2';
				return item.id;
			};
			var associate = function(elem) {
				return [ keygen(coll1), keygen(coll2) ];
			};

			store = new Store(keygen, associate);
			store.put(coll1);
			store.put(coll2);

			store.put(elem);
			expect(coll1).to.contain(elem);
			expect(coll2).to.contain(elem);
		});

		it('should subscribe to item changes when created with a watchlist', function() {
			elem.on = sinon.spy();
			store = new Store(DEFAULT_KEYGEN, DEFAULT_ASSOCIATE, ['prop']);
			store.put(elem);
			expect(elem.on).to.have.been.calledWith('change', store.onItemChanged);
		});

		it('should add already present elements when an associated collection is added', function() {
			var coll = [];			

			store.put(elem);
			store.put(coll);

			expect(coll).to.include(elem);
		});
	});

	describe('.remove', function() {
		it('should not contain an item after it has been removed', function() {
			var key = DEFAULT_KEYGEN(elem);

			store.items[key] = elem;
			store.remove(key);

			expect(store.get(key)).to.not.exist;
		});

		it('should also remove an item from its collection', function() {
			var coll = [ elem ];

			store.put(coll);
			store.remove(DEFAULT_KEYGEN(elem));

			expect(store.get(DEFAULT_KEYGEN(coll))).to.be.empty;
		});

		it('should unsubscribe from item changes when created with a watchlist', function() {			
			const KEY = DEFAULT_KEYGEN(elem);
			elem.off = sinon.spy();
			store = new Store(DEFAULT_KEYGEN, DEFAULT_ASSOCIATE, ['prop']);
			
			store.items[KEY] = elem;
			store.remove(KEY);
			expect(elem.off).to.have.been.calledWith('change', store.onItemChanged);
		});
	});

	it('should remove and re-add when the change event handler is called', function() {
		const PROPERTY_NAME = 'prop';
		var store = new Store(DEFAULT_KEYGEN, DEFAULT_ASSOCIATE, [ PROPERTY_NAME ]);
		var put = sinon.stub(store, 'put');
		var remove = sinon.stub(store, 'remove');

		store.items[DEFAULT_KEYGEN(elem)] = elem; 

		store.onItemChanged(elem, PROPERTY_NAME);
		expect(remove).to.have.been.calledWith(DEFAULT_KEYGEN(elem));
		expect(put).to.have.been.calledWith(elem);
	});
});