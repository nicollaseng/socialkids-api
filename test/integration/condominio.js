const { expect } = require('chai');

const { withUser } = require('./helper/user');

const {
  createCondominio,
  assertCreateCondominioSuccessful
} = require('./helper/condominio');

describe('Condominio', () => {
  let sindico;

  beforeEach(async () => {
    sindico = await withUser();
  });

  describe('#createCondominio()', () => {
    it('should create condominio', async () => {
      const request = {
        name: 'Condominio Teste',
        cnpj: '28955279000186',
        quantidadeBlocos: 2,
        quantidadeUnidades: 100,
        vencimentoCota: 1,
        enderecoCep: '59628617',
        enderecoLogradouro: 'Rua Vivaldi',
        enderecoNumero: '379',
        enderecoBairro: 'Dom Jaime Câmara',
        enderecoLocalidade: 'Mossoró',
        enderecoEstado: 'RN',
        blocos: [
          {
            name: 'A',
            quantidadeUnidades: 50
          },
          {
            name: 'B',
            quantidadeUnidades: 50
          }
        ]
      };

      // Act
      const response = await createCondominio(request, sindico.auth.accessToken);

      // Assert
      const condominio = assertCreateCondominioSuccessful(response);
      expect(condominio).to.have.property('id').to.be.a('string');
      expect(condominio).to.have.property('codigo').to.equal(1);
    });
  });
});
