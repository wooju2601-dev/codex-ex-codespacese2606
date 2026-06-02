const app = require('../src/app');

const server = app.listen(0, async () => {
  const { port } = server.address();
  const baseUrl = 'http://localhost:' + port;

  try {
    // 핵심 REST API가 실제 HTTP 요청으로 동작하는지 확인합니다.
    await expectJson(baseUrl + '/health', { status: 'ok' });

    const cars = await getJson(baseUrl + '/cars');
    assert(Array.isArray(cars), 'GET /cars should return an array');
    assert(cars.length >= 3, 'GET /cars should return initial cars');

    const created = await requestJson(baseUrl + '/cars', 'POST', {
      _id: 9999,
      name: 'SmokeCar',
      company: 'TEST',
      price: 2400,
      year: 2026,
    });
    assert(created._id === 9999, 'POST /cars should create a car');

    const updated = await requestJson(baseUrl + '/cars/9999', 'PUT', { price: 2600 });
    assert(updated.price === 2600, 'PUT /cars/:id should update a car');

    const searched = await getJson(baseUrl + '/cars/search?company=TEST');
    assert(searched.length === 1, 'GET /cars/search should filter by company');

    const filtered = await getJson(baseUrl + '/cars/filter?minPrice=2500&maxPrice=2700');
    assert(filtered.every((car) => car.price >= 2500 && car.price <= 2700), 'GET /cars/filter should filter by price');

    const deleted = await requestJson(baseUrl + '/cars/9999', 'DELETE');
    assert(deleted._id === 9999, 'DELETE /cars/:id should delete a car');

    console.log('Smoke test passed');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

async function getJson(url) {
  const response = await fetch(url);
  assert(response.ok, url + ' should return 2xx');
  return response.json();
}

async function expectJson(url, expected) {
  const data = await getJson(url);
  assert(JSON.stringify(data) === JSON.stringify(expected), url + ' should return expected JSON');
}

async function requestJson(url, method, body) {
  const options = { method };

  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  assert(response.ok, method + ' ' + url + ' should return 2xx');
  return response.json();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
