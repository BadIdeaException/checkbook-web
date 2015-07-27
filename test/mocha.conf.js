if (process && process.env.NODE_ENV !== 'test') { process.env.NODE_ENV = 'test'; }

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.sinon = require('sinon');
global.chai = chai;