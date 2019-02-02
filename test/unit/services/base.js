const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const BaseService = require('../../../src/services/base');
const { InternalError } = require('../../../src/errors/internal');

chai.use(chaiAsPromised);
chai.should();

const mockModel = { name: 'mock' };

describe('BaseService', () => {
  describe('#findById()', () => {
    it('should call model findById', () => {
      const context = {};
      const id = '7ae9c14a-e05e-403a-b2c3-bb663218abf1';
      const model = {
        findById() { }
      };

      const mock = sinon.mock(model);
      mock.expects('findById')
        .once()
        .withExactArgs(id);

      const service = new BaseService({ model });

      service.findById(context, id);

      mock.verify();
    });
  });

  describe('#assertReadPermission()', () => {
    it('should require user in context', async () => {
      const context = {};
      const entity = {};

      const service = new BaseService({ model: mockModel });

      await service.assertReadPermission(context, entity)
        .should.be.rejectedWith(InternalError);
    });
  });

  describe('#assertReadListPermission()', () => {
    it('should require user in context', async () => {
      const context = {};
      const entity = {};

      const service = new BaseService({ model: mockModel });

      await service.assertReadListPermission(context, entity)
        .should.be.rejectedWith(InternalError);
    });
  });

  describe('#assertCreatePermission()', () => {
    it('should require user in context', async () => {
      const context = {};
      const entity = {};

      const service = new BaseService({ model: mockModel });

      await service.assertCreatePermission(context, entity)
        .should.be.rejectedWith(InternalError);
    });
  });

  describe('#assertUpdatePermission()', () => {
    it('should require user in context', async () => {
      const context = {};
      const entity = {};

      const service = new BaseService({ model: mockModel });

      await service.assertUpdatePermission(context, entity)
        .should.be.rejectedWith(InternalError);
    });
  });

  describe('#assertDestroyPermission()', () => {
    it('should require user in context', async () => {
      const context = {};
      const entity = {};

      const service = new BaseService({ model: mockModel });

      await service.assertDestroyPermission(context, entity)
        .should.be.rejectedWith(InternalError);
    });
  });
});

