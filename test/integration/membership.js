const _ = require('lodash');
const { expect } = require('chai');

const {
  createMembership,
  approveMembership,
  assertCreateMembershipSuccessful,
  assertApproveMembershipSuccessful
} = require('./helper/membership');

const { currentUser, assertCurrentUserSuccessful, withUser } = require('./helper/user');
const { findCondominioByCodigo, assertFindCondominioByCodigoSuccessful, withCondominio } = require('./helper/condominio');

describe('Membership', () => {
  let sindico;
  let morador;
  let condominio;

  beforeEach(async () => {
    sindico = await withUser();
    morador = await withUser();
    condominio = await withCondominio(sindico.auth.accessToken);
  });

  describe('#createMembership()', () => {
    it('should create sindico membership', async () => {
      const request = {
        condominioId: condominio.id,
        userId: sindico.user.id,
        role: 'sindico',
        status: 'active'
      };

      // Act
      const response = await createMembership(request, sindico.auth.accessToken);

      // Assert
      const membership = assertCreateMembershipSuccessful(response);
      expect(membership).to.have.property('id').to.be.a('string');

      const currentUserResponse = await currentUser(sindico.auth.accessToken);
      const loggedUser = assertCurrentUserSuccessful(currentUserResponse);

      const { memberships } = loggedUser;
      expect(memberships).to.be.an('array').with.length(1);

      expect(_.first(memberships)).to.have.property('role').to.equal('sindico');
      expect(_.first(memberships)).to.have.property('status').to.equal('active');
    });

    it('should find a condominio and create morador membership', async () => {
      const condominioResponse = await findCondominioByCodigo(1, morador.auth.accessToken);
      const foundCondominio = assertFindCondominioByCodigoSuccessful(condominioResponse);

      const request = {
        condominioId: foundCondominio.id,
        userId: morador.user.id,
        role: 'morador'
      };

      // Act
      const response = await createMembership(request, morador.auth.accessToken);

      // Assert
      const membership = assertCreateMembershipSuccessful(response);
      expect(membership).to.have.property('id').to.be.a('string');

      const currentUserResponse = await currentUser(morador.auth.accessToken);
      const loggedUser = assertCurrentUserSuccessful(currentUserResponse);

      const { memberships } = loggedUser;
      expect(memberships).to.be.an('array').with.length(1);

      expect(_.first(memberships)).to.have.property('role').to.equal('morador');
      expect(_.first(memberships)).to.have.property('status').to.equal('pending');
    });

    it('should approve a membership', async () => {
      const createSindicoMembershipRequest = {
        condominioId: condominio.id,
        userId: sindico.user.id,
        role: 'sindico',
        status: 'active'
      };

      const createSindicoMembershipResponse =
        await createMembership(createSindicoMembershipRequest, sindico.auth.accessToken);

      assertCreateMembershipSuccessful(createSindicoMembershipResponse);

      const createMoradorMembershipRequest = {
        condominioId: condominio.id,
        userId: morador.user.id,
        role: 'morador'
      };

      const createMoradorMembershipResponse =
        await createMembership(createMoradorMembershipRequest, morador.auth.accessToken);

      const moradorMembership = assertCreateMembershipSuccessful(createMoradorMembershipResponse);

      // Act
      const response = await approveMembership(moradorMembership.id, sindico.auth.accessToken);

      // Assert
      assertApproveMembershipSuccessful(response);
    });
  });
});
