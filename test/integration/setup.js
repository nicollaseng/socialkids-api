const { server } = require('../../src/app');
const domain = require('../../src/domain');

after(() => {
  server.close(() => {
    process.exit();
  });
});

beforeEach(async () => {
  await domain.sync();
});
