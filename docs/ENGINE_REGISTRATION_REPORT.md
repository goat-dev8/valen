# Engine Registration Report

**Date:** 2026-06-09  
**Environment:** WSL2 — live testnet registration (no mocks)

---

## Summary

All four Stylus engines were deployed, initialized with `authorized_caller = ValenSettlement`, registered in `ValenRegistry`, and verified through live E2E settlement flows on **Arbitrum Sepolia** and **Robinhood Testnet**.

| Network | Registry | Registration script | E2E verified |
|---------|----------|---------------------|--------------|
| Arbitrum Sepolia (421614) | `0x53EeC68c869E06B659A87b9e049a379ba3a5FA0F` | `pnpm run register-engines:sepolia` | ✅ |
| Robinhood Testnet (46630) | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` | `pnpm run register-engines:robinhood-testnet` | ✅ |

---

## Arbitrum Sepolia Engine Addresses

| Engine | Stylus address | Registry name hash | Version |
|--------|----------------|-------------------|---------|
| ComplianceEngine | `0xf6d515f09b1e14adb891c72605e1df12c7f5db6b` | `keccak256("ComplianceEngine")` | 1.0.0 |
| RiskEngine | `0x8eb252ff6f05b1ee767bb816e5786ad72e5b4073` | `keccak256("RiskEngine")` | 1.0.0 |
| EligibilityEngine | `0x03e00644c2bbb45ab4566e34c30929dd017ee5bd` | `keccak256("EligibilityEngine")` | 1.0.0 |
| PolicyEngine | `0x3eb88dde893288faea417b413a55a5b4d3256108` | `keccak256("PolicyEngine")` | 1.0.0 |

**Settlement proxy (authorized caller):** `0x993622D55Ea095aB71165Caf191B21E6e3A71D4A`

**Artifacts:**
- `stylus/deployments/arbitrum-sepolia/engines.json`
- `contracts/deployments/arbitrum-sepolia/deployment.json`

**Registration command output:**
```
Registered ComplianceEngine: 0xf6d515f09b1e14adb891c72605e1df12c7f5db6b (1.0.0)
Registered RiskEngine: 0x8eb252ff6f05b1ee767bb816e5786ad72e5b4073 (1.0.0)
Registered EligibilityEngine: 0x03e00644c2bbb45ab4566e34c30929dd017ee5bd (1.0.0)
Registered PolicyEngine: 0x3eb88dde893288faea417b413a55a5b4d3256108 (1.0.0)
```

---

## Robinhood Testnet Engine Addresses

| Engine | Stylus address | Version |
|--------|----------------|---------|
| ComplianceEngine | `0x2c1db0c436b72d94a4112f321dfbd13a976d8831` | 1.0.0 |
| RiskEngine | `0xae57003e42e3548a9d39cd55bcdfac04363b1d63` | 1.0.0 |
| EligibilityEngine | `0x1f3fb438824140b7e1125502f80b686d95072939` | 1.0.0 |
| PolicyEngine | `0xe1ae5ec5b4416e7d725981946e11af0a44bf4ecd` | 1.0.0 |

**Settlement proxy (authorized caller):** `0x91CdD9a481C732bEB09Ce039da23DC11e83547a4`

**Artifacts:**
- `stylus/deployments/robinhood-testnet/engines.json`
- `contracts/deployments/robinhood-testnet/deployment.json`

---

## Initialization Parameters

All engines initialized via `contracts/script/e2e-validation.ts` / `init-engines.ts` with:

| Parameter | Value |
|-----------|-------|
| `engine_version` | `keccak256("1.0.0")` |
| `authorized_caller` | Network settlement proxy address |
| Compliance rule hash | `keccak256("valen-compliance-rule-v1")` |
| Risk model hash | `keccak256("valen-risk-model-v1")` |
| Eligibility root hash | `keccak256("valen-eligibility-root-v1")` |
| Policy registry hash | `keccak256("valen-policy-v1")` |

---

## Verification

| Check | Method | Result |
|-------|--------|--------|
| Registry `getEngine()` | E2E script + `register-engines.ts` | ✅ Addresses match `engines.json` |
| Engine `initialize()` | On-chain txs during E2E | ✅ Settlement authorized |
| Live engine probe | `eth_call` from settlement address | ✅ All four engines return pass verdicts |
| Full settlement path | `submitSettlement` → `approveSettlement` → `executeSettlement` | ✅ Both networks |

---

## Scripts Used

| Script | Purpose |
|--------|---------|
| `stylus/script/activate-stylus.sh` | Deploy + activate all engines |
| `contracts/script/init-engines.ts` | Initialize engines (standalone) |
| `contracts/script/register-engines.ts` | Register engines in ValenRegistry |
| `contracts/script/e2e-validation.ts` | Full registration + init + E2E flow |

---

*Engines registered and verified without mocks or placeholder addresses.*
