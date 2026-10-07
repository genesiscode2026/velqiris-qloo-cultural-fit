const test = require("node:test");
const assert = require("node:assert/strict");
const { createHandler, entityIdFrom, entityCardsFrom } = require("../netlify/functions/cultural-fit");

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(payload) };
}

test("extracts entities from nested Qloo-shaped payloads", () => {
  const payload = { results: { entities: [{ entity_id: "urn:seed:1", name: "Seed" }] } };
  assert.equal(entityIdFrom(payload), "urn:seed:1");
  assert.deepEqual(entityCardsFrom(payload), [
    { id: "urn:seed:1", name: "Seed", type: null, description: null },
  ]);
});

test("fails closed when the API key is absent", async () => {
  const handler = createHandler({ apiKey: "", fetchImpl: async () => { throw new Error("unused"); } });
  const result = await handler({ httpMethod: "POST", body: JSON.stringify({ seed: "Bauhaus", outputType: "urn:entity:brand" }) });
  assert.equal(result.statusCode, 503);
  assert.equal(JSON.parse(result.body).error, "QLOO_KEY_NOT_CONFIGURED");
});

test("rejects unsupported output types before calling Qloo", async () => {
  let called = false;
  const handler = createHandler({ apiKey: "test", fetchImpl: async () => { called = true; } });
  const result = await handler({ httpMethod: "POST", body: JSON.stringify({ seed: "Bauhaus", outputType: "urn:entity:music" }) });
  assert.equal(result.statusCode, 400);
  assert.equal(called, false);
});

test("performs search then insights with the documented header and query parameters", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: url.toString(), options });
    if (url.pathname === "/search") {
      return response(200, { results: [{ entity_id: "urn:qloo:seed", name: "Bauhaus" }] });
    }
    return response(200, { results: { entities: [{ entity_id: "urn:qloo:brand", name: "Design Brand", type: "urn:entity:brand" }] } });
  };
  const handler = createHandler({ apiKey: "secret-test-key", fetchImpl });
  const result = await handler({ httpMethod: "POST", body: JSON.stringify({ seed: "Bauhaus", outputType: "urn:entity:brand" }) });
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 200);
  assert.equal(body.status, "QLOO_VERIFIED");
  assert.equal(body.recommendations[0].name, "Design Brand");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers["X-Api-Key"], "secret-test-key");
  assert.match(calls[0].url, /^https:\/\/hackathon\.api\.qloo\.com\/search\?/);
  assert.equal(new URL(calls[1].url).searchParams.get("filter.type"), "urn:entity:brand");
  assert.equal(new URL(calls[1].url).searchParams.get("signal.interests.entities"), "urn:qloo:seed");
  assert.doesNotMatch(result.body, /secret-test-key/);
});

test("reports upstream failures without exposing credentials", async () => {
  const handler = createHandler({ apiKey: "secret-test-key", fetchImpl: async () => response(401, { error: "unauthorized" }) });
  const result = await handler({ httpMethod: "POST", body: JSON.stringify({ seed: "Bauhaus", outputType: "urn:entity:brand" }) });
  assert.equal(result.statusCode, 502);
  assert.equal(JSON.parse(result.body).upstreamStatus, 401);
  assert.doesNotMatch(result.body, /secret-test-key/);
});

