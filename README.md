# VELQIRIS Cultural Fit Briefing Agent

An evidence-first cultural-intelligence agent for the Qloo Agentic Hackathon. A user supplies a cultural seed and an output domain. The server resolves the seed through Qloo `/search`, passes the resulting entity ID to `/v2/insights`, and returns compact recommendations with request provenance.

## Live demo

https://velqiris-qloo-cultural-fit.netlify.app

The public UI and serverless route are live. Until Qloo issues the requested hackathon key, the route deliberately returns `QLOO_KEY_NOT_CONFIGURED` rather than simulated recommendations.

## Why Qloo is essential

The application does not ask a language model to guess cultural affinities. Recommendation entities come from Qloo's taste graph. If the API key, seed entity, or insight entities are unavailable, the application fails closed and explicitly returns no recommendation.

## Run locally

1. Obtain a hackathon API key through the official Qloo form.
2. Copy `.env.example` to `.env` and set `QLOO_API_KEY`.
3. Run `netlify dev` and open the printed local URL.

The code deliberately uses the hackathon base URL `https://hackathon.api.qloo.com`, the `X-Api-Key` header, and only the documented `GET /search` and `GET /v2/insights` endpoints.

## Test

```bash
node --test test/cultural-fit.test.js
```

The test suite verifies the two-step API flow, allow-listed output types, credential non-disclosure, and fail-closed behavior.

## Deployment truth

The UI and serverless integration are publicly deployed and locally tested. A live Qloo-backed result cannot be claimed until Qloo issues the requested key and it is configured only in the hosting environment. No Qloo response data is committed to this public repository.

## License

MIT. See `LICENSE`.
