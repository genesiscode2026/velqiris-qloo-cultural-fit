const QLOO_BASE_URL = "https://hackathon.api.qloo.com";

const OUTPUT_TYPES = new Set([
  "urn:entity:artist",
  "urn:entity:book",
  "urn:entity:brand",
  "urn:entity:destination",
  "urn:entity:movie",
  "urn:entity:person",
  "urn:entity:place",
  "urn:entity:podcast",
  "urn:entity:tv_show",
  "urn:entity:video_game",
]);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function cleanSeed(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

function collectObjects(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, output);
    return output;
  }
  output.push(value);
  for (const child of Object.values(value)) collectObjects(child, output);
  return output;
}

function entityIdFrom(payload) {
  const objects = collectObjects(payload);
  for (const item of objects) {
    const id = item.entity_id || item.entityId || item.id || item.urn;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return null;
}

function entityCardsFrom(payload) {
  const seen = new Set();
  const cards = [];
  for (const item of collectObjects(payload)) {
    const id = item.entity_id || item.entityId || item.id || item.urn;
    const name = item.name || item.title || item.label;
    if (typeof id !== "string" || typeof name !== "string" || seen.has(id)) continue;
    seen.add(id);
    cards.push({
      id,
      name,
      type: item.type || item.entity_type || null,
      description: item.description || null,
    });
    if (cards.length === 8) break;
  }
  return cards;
}

async function qlooGet(fetchImpl, apiKey, path, params) {
  const url = new URL(path, QLOO_BASE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetchImpl(url, {
    method: "GET",
    headers: { "X-Api-Key": apiKey, accept: "application/json" },
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text.slice(0, 500) };
  }
  if (!response.ok) {
    const error = new Error(`Qloo ${path} returned HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return { payload, url: url.toString() };
}

function createHandler({ fetchImpl = fetch, apiKey = process.env.QLOO_API_KEY } = {}) {
  return async function handler(event) {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "METHOD_NOT_ALLOWED", message: "Use POST." });
    }
    if (!apiKey) {
      return json(503, {
        error: "QLOO_KEY_NOT_CONFIGURED",
        message: "The server has no Qloo hackathon key. No recommendation was fabricated.",
      });
    }

    let input;
    try {
      input = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "INVALID_JSON" });
    }

    const seed = cleanSeed(input.seed);
    const outputType = input.outputType;
    if (seed.length < 2) return json(400, { error: "SEED_REQUIRED" });
    if (!OUTPUT_TYPES.has(outputType)) return json(400, { error: "UNSUPPORTED_OUTPUT_TYPE" });

    try {
      const search = await qlooGet(fetchImpl, apiKey, "/search", { query: seed });
      const seedEntityId = entityIdFrom(search.payload);
      if (!seedEntityId) {
        return json(422, {
          error: "QLOO_SEED_NOT_RESOLVED",
          message: "Qloo returned no usable entity for the supplied seed.",
          provenance: { search: search.url },
        });
      }

      const insights = await qlooGet(fetchImpl, apiKey, "/v2/insights", {
        "filter.type": outputType,
        "signal.interests.entities": seedEntityId,
      });
      const recommendations = entityCardsFrom(insights.payload);
      if (!recommendations.length) {
        return json(422, {
          error: "QLOO_NO_INSIGHTS",
          message: "Qloo returned no recommendation entities for this seed and type.",
          seed: { query: seed, entityId: seedEntityId },
          provenance: { search: search.url, insights: insights.url },
        });
      }

      return json(200, {
        status: "QLOO_VERIFIED",
        seed: { query: seed, entityId: seedEntityId },
        outputType,
        recommendations,
        provenance: {
          provider: "Qloo Taste AI",
          environment: QLOO_BASE_URL,
          search: search.url,
          insights: insights.url,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      return json(502, {
        error: "QLOO_UPSTREAM_FAILURE",
        message: error.message,
        upstreamStatus: error.status || null,
      });
    }
  };
}

exports.handler = createHandler();
exports.createHandler = createHandler;
exports.cleanSeed = cleanSeed;
exports.entityIdFrom = entityIdFrom;
exports.entityCardsFrom = entityCardsFrom;

