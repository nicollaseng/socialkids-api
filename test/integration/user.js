const { expect } = require('chai');
const {
  createUser,
  authenticateUser,
  assertCreateUserSuccessful,
  assertAuthenticateUserSuccessful,
  currentUser,
  assertCurrentUserSuccessful,
  withUser
} = require('./helper/user');

describe('User', () => {
  describe('#createUser()', () => {
    it('should create user', async () => {
      const userRequest = {
        name: 'Test User',
        email: 'test@gmail.com',
        phone: '+5511995555555'
      };

      const request = Object.assign({}, userRequest, {
        password: '123123'
      });

      // Act
      const response = await createUser(request);

      // Assert
      const user = assertCreateUserSuccessful(response);
      expect(user).to.have.property('id').to.be.a('string');
      expect(user).to.include(userRequest);
    });
  });

  describe('#authenticateUser()', () => {
    const password = '123123';
    const email = 'test@gmail.com';
    const phone = '+5511995555555';

    beforeEach(async () => {
      const response = await createUser({
        name: 'Test User',
        email,
        phone,
        password
      });
      assertCreateUserSuccessful(response);
    });

    it('should authenticate user with e-mail', async () => {
      const request = {
        user: email,
        password,
        type: 'password'
      };

      // Act
      const response = await authenticateUser(request);

      // Assert
      const auth = assertAuthenticateUserSuccessful(response);
      expect(auth).to.have.property('accessToken').to.be.a('string');
      expect(auth).to.have.property('refreshToken').to.be.a('string');
    });

    it('should authenticate user with phone', async () => {
      const request = {
        user: phone,
        password,
        type: 'password'
      };

      // Act
      const response = await authenticateUser(request);

      // Assert
      const auth = assertAuthenticateUserSuccessful(response);
      expect(auth).to.have.property('accessToken').to.be.a('string');
      expect(auth).to.have.property('refreshToken').to.be.a('string');
    });
  });

  describe('#currentUser()', () => {
    let user;

    beforeEach(async () => {
      user = await withUser();
    });

    it('should get current logged in user', async () => {
      // Act
      const response = await currentUser(user.auth.accessToken);

      // Assert
      const loggedUser = assertCurrentUserSuccessful(response);
      expect(loggedUser).to.have.property('id').to.be.a('string');
      expect(loggedUser).to.have.property('name').to.be.a('string');
      expect(loggedUser).to.have.property('memberships').to.be.an('array');
    });
  });
});
