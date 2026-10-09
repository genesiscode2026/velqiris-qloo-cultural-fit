# JUDGE START HERE — VELQIRIS CULTURAL FIT VIA QLOO API
**Hackathon:** Qloo Agentic AI Hackathon (Devpost #1225764)  
**Track:** Taste AI & Cross-Domain Cultural Intelligence  
**Verification Time:** < 10 seconds  

---

## 1. What Is This Project?
An agentic cultural intelligence engine that solves the blind spot of purely quantitative trading systems. By querying the **Qloo Taste Graph** (`https://hackathon.api.qloo.com`), VELQIRIS computes objective, cross-domain cultural affinity correlations between financial brands and cultural domains (music, podcasts, lifestyle) without subjective bias.

---

## 2. Quick Verification (Run in 1 Command)

```bash
# Run unit tests validating search, insights parsing, and fail-closed key management
npm test
```

### Expected Output:
```
✔ extracts entities from nested Qloo-shaped payloads (0.84175ms)
✔ fails closed when the API key is absent (0.162083ms)
✔ rejects unsupported output types before calling Qloo (0.126875ms)
✔ performs search then insights with the documented header and query parameters (1.105083ms)
✔ reports upstream failures without exposing credentials (0.13025ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
```

---

## 3. Key Deliverables & Documentation

- [Qloo Runtime Verification & Live Proof Report](./QLOO_RUNTIME_VERIFICATION.md)
- [Recorded Live Execution Proof](./qloo_verified_execution_proof.json)
- [Serverless Function Handler (`netlify/functions/cultural-fit.js`)](./netlify/functions/cultural-fit.js)
- [Pre-Existing Technology Disclosure](./PREEXISTING_TECHNOLOGY.md)
- [Verification Evidence Log](./VERIFICATION_EVIDENCE.md)
