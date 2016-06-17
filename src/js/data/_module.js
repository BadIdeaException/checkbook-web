"use strict";

/**
 * @ngdoc module
 * @name  Checkbook.Data
 * @module  Checkbook.Data
 * @description 
 * This module is home to infrastructure required by the model layer. The two main players are
 * {@link $resource}, a decorated version of the service provided by [`ngResource`](https://docs.angularjs.org/api/ngResource/service/$resource),
 * and {@link Store}, a data store that can be used as a high-level cache on resources to both avoid unnecessary trips to the server and
 * make sure that resources shared across controllers work on the same data (instead of two distinct copies).
 *
 * Using a `Store` with `$resource` enables some powerful behind-the-scenes functionality that ensures data in the application is always consistent.
 * Say, for instance, a user resource was gotten from the server, as well as a collection of all users. Now, using a `Store` will make sure that
 * deleting this user will also remove it from the collection.
 * ```
 * var User = $resource('/users/:name', { name: '@name', null, { store: true }});
 *
 * var users = User.query(); // [ { name: 'John' }, { name: 'Mary' }]
 * var john = users[0];
 * john.$delete();
 *
 * expect(users[0].name).to.equal('Mary');
 * ```
 */
angular.module('Checkbook.Data', [ 'ngResource', 'Checkbook.Util' ]);