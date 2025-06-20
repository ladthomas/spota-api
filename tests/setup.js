
jest.setTimeout(10000);

beforeEach(() => {

  jest.clearAllMocks();
});
afterEach(() => {

});

// Variables globales utiles pour les tests
global.API_BASE_URL = 'http://localhost:5001';
global.TEST_DB_PATH = ':memory:'; 