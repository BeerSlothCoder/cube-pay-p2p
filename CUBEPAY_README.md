# CubePay — P2P Crypto On/Off Ramp via Augmented Reality Terminals

> **Private. Trustless. Compliant by Math.**

CubePay is a peer-to-peer cryptocurrency exchange network where sellers deploy **virtual SoftPOS terminals** anchored to real-world GPS coordinates, visible only through the CubePay mobile AR camera. Buyers discover these terminals, pay with a virtual card, and receive cryptocurrency directly to their self-custody wallet — no in-person meeting required, no custodial risk.

---

## Table of Contents

- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Key Design Principles](#key-design-principles)
- [Smart Contracts](#smart-contracts)
- [The Blind Vault](#the-blind-vault)
- [Authority Key Access (Regulatory Compliance)](#authority-key-access-regulatory-compliance)
- [Supported Currencies](#supported-currencies)
- [Card Payment Processing](#card-payment-processing)
- [KYC & AML Compliance](#kyc--aml-compliance)
- [Getting Started (Development)](#getting-started-development)
- [Port Allocation](#port-allocation)
- [Regulatory Status](#regulatory-status)
- [Full Architecture Reference](#full-architecture-reference)

---

## What It Does

| Feature                   | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| **AR Terminal Discovery** | Sellers place virtual ATM/SoftPOS terminals at GPS coordinates; buyers see them through AR camera |
| **Trustless Escrow**      | Crypto is locked in a smart contract before the buyer pays; released automatically on payment     |
| **Blind Vault Storage**   | Transaction metadata is encrypted on the user's device; CubePay stores only opaque ciphertext     |
| **Regulatory Access**     | Authorities reconstruct a decryption key via Shamir's Secret Sharing (2-of-3 threshold)           |
| **Multi-Chain Support**   | BTC, ETH, SOL, ADA, HBAR, BNB, USDC, MATIC — each with chain-native escrow                        |
| **MCC 6051 Compliant**    | All card transactions coded correctly as crypto purchases — no transaction laundering             |
| **Zero-Knowledge Proofs** | Prove amounts are within legal thresholds without revealing the actual amount                     |

---

## How It Works

### Quick Example — Alice buys 1 BTC from Bob in Málaga

```
Bob (Seller):
  1. Completes KYC — name/ID encrypted with Regulatory Public Key on his device
  2. Opens AR camera at Málaga train station → taps "Deploy Terminal Here"
  3. Locks 1.0 BTC in escrow smart contract
  4. Terminal appears anchored to that GPS location in the CubePay AR layer

Alice (Buyer):
  5. Opens CubePay AR camera → sees Bob's terminal 300m away
  6. Taps terminal → views: "1.0 BTC | €52,000 rate | Escrow verified on-chain"
  7. Enters her BTC wallet address, taps "Buy"
  8. App encrypts transaction metadata with Regulatory Public Key (on device, never leaves)
  9. Pays €52,000 via virtual card (MCC 6051) through Revolut

CubePay (Blind Processor):
 10. Receives Revolut webhook: payment completed
 11. Oracle service signs escrow release transaction
 12. Escrow contract verifies oracle signature → releases 1.0 BTC to Alice's wallet
 13. Writes encrypted blob to Blind Vault DB (CubePay cannot read it)

Alice:  ✅ Receives "1.0 BTC received in your wallet"
Bob:    ✅ Receives "1.0 BTC sold, fiat incoming"
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CubePay Network                       │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  Seller App │    │  Buyer App  │    │  CubePay Server │ │
│  │  (SoftPOS)  │    │ (AR Viewer) │    │  (Blind Vault)  │ │
│  └──────┬──────┘    └──────┬──────┘    └────────┬────────┘ │
│         │                  │                     │          │
│         ▼                  ▼                     ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Escrow Smart Contracts                  │   │
│  │    (EVM / Solana Program / Hedera Smart Contract)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌────────────────┐
    │  Trustee     │ │     HSM      │ │  Regulatory    │
    │  (Law Firm)  │ │  (Court Ord) │ │  Authority     │
    │   Shard 1    │ │   Shard 2    │ │  (Decryptor)   │
    └──────────────┘ └──────────────┘ └────────────────┘
```

**CubePay is NOT a custodian.** It never holds user funds. The oracle co-signs but cannot initiate transfers unilaterally — it can only release what is already locked.

---

## Technology Stack

### Core Application

| Layer      | Technology                   | Version      |
| ---------- | ---------------------------- | ------------ |
| Frontend   | React + TypeScript           | 18.2 / 5.2   |
| Build Tool | Vite                         | 5.4.19       |
| Backend    | Express (Node.js)            | 4.21         |
| Styling    | Tailwind CSS + Framer Motion | 3.3.5 / 10.x |
| Database   | Supabase (PostgreSQL)        | ^2.58.0      |

### AR / 3D Layer

| Library     | Purpose                                      |
| ----------- | -------------------------------------------- |
| A-Frame 1.4 | WebGL/WebXR AR rendering framework (Mozilla) |
| H3 (Uber)   | Geospatial hexagonal indexing for terminals  |
| GPS Anchors | `gps-projected-entity-place` AR entity       |

### Blockchain SDKs

| Library                                | Chain                 |
| -------------------------------------- | --------------------- |
| `ethers.js ^5.7.2`                     | EVM (ETH/Polygon/BNB) |
| `@solana/web3.js ^1.98.4`              | Solana                |
| `@solana/spl-token ^0.4.14`            | Solana SPL tokens     |
| `@hashgraph/sdk ^2.77.0`               | Hedera Hashgraph      |
| `@hashgraph/stablecoin-npm-sdk ^2.1.5` | Hedera stablecoins    |
| `@thirdweb-dev/sdk ^4.0.98`            | Multi-chain SDK       |

### Cryptography & Compliance

| Library                  | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| `jose ^5.x`              | JWE encryption (RSA-OAEP-256 + A256GCM)        |
| `shamirs-secret-sharing` | 2-of-3 key sharding for Regulatory Key         |
| `@zk-kit/bulletproofs`   | Zero-Knowledge range proofs (no trusted setup) |
| `pkijs`                  | X.509 / PKCS#11 for HSM integration            |
| `zod ^3.x`               | Runtime schema validation at API boundaries    |

### Payments & KYC

| Service / SDK        | Purpose                                 |
| -------------------- | --------------------------------------- |
| Revolut Merchant API | Card processing — MCC 6051 compliant    |
| Sumsub SDK           | KYC liveness check + ID verification    |
| `qrcode ^1.5.4`      | QR code generation for wallet addresses |

### Infrastructure

| Service            | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| Redis              | Price oracle cache (10s TTL) + job queue backend  |
| BullMQ             | Reliable oracle release job queue                 |
| AWS CloudHSM       | Oracle signing key + Court-Order Shard 2          |
| Cloudflare CDN/WAF | DDoS protection + static asset delivery           |
| Hedera Mainnet     | Immutable audit log for key reconstruction events |
| Chainlink Oracle   | Verified price feeds for escrow contracts         |

---

## Key Design Principles

### 1. Trustless — Escrow Smart Contracts

Crypto is locked on-chain before any buyer payment is accepted. No human intermediary can redirect or steal funds. The escrow expires and refunds automatically if no purchase occurs within 72 hours.

### 2. Non-Custodial — CubePay Never Holds Funds

CubePay's oracle can only **co-sign a release** of an existing escrow lock. It cannot:

- Initiate transfers
- Create new escrow positions
- Move seller or buyer funds

### 3. Private by Architecture — The Blind Vault

Encryption happens **on the user's device** using the Regulatory Public Key before any data is sent to CubePay servers. CubePay stores only:

- Opaque JWE ciphertext blobs
- Public blockchain data (addresses, tx hashes, chain IDs)
- Status flags and timestamps

CubePay employees, developers, and even its CEO cannot read transaction details, names, or amounts.

### 4. Compliant by Math — Authority Key Access

Regulators with a lawful warrant can decrypt data via a 2-of-3 Shamir's Secret Sharing scheme without any CubePay employee being involved in the decryption. Every access event is anchored immutably to Hedera Hashgraph.

---

## Smart Contracts

### EVM (`CubePayARTMEscrow.sol`)

Deployed on Polygon, Base, or Ethereum. Uses OpenZeppelin `ReentrancyGuard`. Key functions:

| Function            | Called By      | Effect                                                    |
| ------------------- | -------------- | --------------------------------------------------------- |
| `createEscrow()`    | Seller (Bob)   | Locks ERC-20 or native ETH in contract                    |
| `releaseToSeller()` | CubePay Oracle | Verifies oracle signature → releases crypto to buyer      |
| `refundSeller()`    | Seller (Bob)   | Returns funds after expiry window if no purchase occurred |

Security features: reentrancy guard, oracle signature verification (ecrecover), time-lock expiry, no `selfdestruct`.

### Solana (`cubepay_artm_escrow`)

Anchor framework Rust program. Uses SPL token PDA for escrow. Oracle verification via ed25519.

### Hedera (HSCS)

Same Solidity logic as EVM contract, deployed via `@hashgraph/sdk` `ContractCreateTransaction`. Also used for the immutable audit log topic.

### Native BTC (HTLC)

For unwrapped Bitcoin: Hash Time-Lock Contract. Alice generates preimage; Bob creates HTLC output. CubePay Oracle reveals preimage to Alice after card payment confirmation.

---

## The Blind Vault

```
User's Device                    CubePay Servers
     │                                  │
     │  encryptTransactionMetadata()    │
     │  using Regulatory PUBLIC Key     │
     │  (local, on device)              │
     │                                  │
     │  → sends only:                   │
     │    { encryptedBlob: "eyJhbGci..." ◄────── opaque JWE
     │      txHash: "0xabc..."          │        ciphertext
     │      buyerWallet: "0xdef..."     │
     │      status: "COMPLETED" }       │
     │                                  │
```

**Database schema** (`blind_vault_transactions`):

```sql
CREATE TABLE blind_vault_transactions (
  id              UUID PRIMARY KEY,
  chain_id        VARCHAR(32),           -- 'ethereum', 'solana', etc.
  tx_hash         VARCHAR(128),          -- On-chain (public)
  escrow_address  VARCHAR(128),          -- Smart contract (public)
  buyer_wallet    VARCHAR(128),          -- Destination (public)
  seller_wallet   VARCHAR(128),          -- Source (public)
  encrypted_blob  TEXT NOT NULL,         -- JWE ciphertext — CubePay cannot read
  status          VARCHAR(32),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Authority Key Access (Regulatory Compliance)

### Key Ceremony

A one-time ceremony generates an RSA-4096 keypair in an air-gapped environment. The private key is split using **Shamir's Secret Sharing (2-of-3)**:

| Shard   | Held By                     | Release Condition            |
| ------- | --------------------------- | ---------------------------- |
| Shard 1 | Licensed Law Firm (Trustee) | Valid court order            |
| Shard 2 | Air-gapped AWS CloudHSM     | Digitally signed court order |
| Shard 3 | Board Escrow Notary         | Company dissolution only     |

The **Public Key** is published openly in CubePay's CASP documentation and anchored in a smart contract.

### Access Flow (Regulator)

```
Authority presents court order
       ↓
Trustee verifies → releases Shard 1
       +
HSM validates court order signature → releases Shard 2
       ↓
Authority combines Shard 1 + Shard 2
       ↓
Reconstructed key decrypts encrypted blobs
       ↓
Plaintext data — names, amounts, KYC refs
       ↓
Access event anchored on Hedera Hashgraph (immutable)
```

CubePay is **not involved in the decryption step**. It only exports the ciphertext blobs to the authority.

---

## Supported Currencies

| Currency  | Chain                     | Escrow Mechanism      | Settlement Time  |
| --------- | ------------------------- | --------------------- | ---------------- |
| BTC       | Bitcoin / wBTC on EVM     | HTLC or wBTC ERC-20   | 10 min / ~15 sec |
| ETH       | Ethereum / Base / Polygon | ERC-20 Escrow         | ~15 seconds      |
| SOL       | Solana                    | Anchor Program (Rust) | ~400ms           |
| ADA       | Cardano                   | Plutus Script         | ~20 seconds      |
| HBAR      | Hedera                    | HSCS + HTS            | ~3 seconds       |
| BNB       | BSC                       | ERC-20 Escrow         | ~3 seconds       |
| USDC      | Multi-chain               | ERC-20 / SPL Escrow   | Chain dependent  |
| MATIC/POL | Polygon                   | ERC-20 Escrow         | ~2 seconds       |

---

## Card Payment Processing

All fiat payments use **MCC 6051** (Non-Financial Institutions — Cryptocurrency). Using any other MCC for a crypto purchase constitutes transaction laundering under EU AMLD6.

**Phase 1:** Revolut Business API (sandbox integration already present in `server.js`, port 3001)  
**Phase 2:** White-label acquirer (Adyen / Worldpay)  
**Phase 3:** Own EMI license (€350k capital requirement, ~18 months approval)

Payment flow: Card → Revolut API → Webhook to CubePay → Oracle signs escrow release → Crypto delivered to buyer.

---

## KYC & AML Compliance

| User Type | Threshold           | KYC Level                                   |
| --------- | ------------------- | ------------------------------------------- |
| Seller    | Always              | Full: government ID + liveness + tax number |
| Buyer     | < €500/year         | Simplified: phone + email OTP               |
| Buyer     | €500 – €15,000/year | Standard: government ID + liveness          |
| Buyer     | > €15,000/year      | Enhanced Due Diligence                      |

KYC provider: **Sumsub** (EU-compliant, Spanish language support) or Veriff.

All collected PII is **encrypted on-device before upload**. CubePay stores only `kycStatus`, `kycProvider`, and a timestamp — not the actual identity data.

---

## Getting Started (Development)

### Prerequisites

- Node.js 20+
- Redis (local or Docker)
- ngrok (for mobile/device testing)

### Install

```bash
npm install
```

### Run

```bash
# Frontend (port 5175)
npm run dev

# Backend (port 3001)
node server.js

# ngrok tunnel (port 4040 API)
ngrok http 5175
```

### Environment Variables

See `AR_VIEWER_ENV_CONFIG.env` for the full list. Key variables:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
REVOLUT_SECRET_KEY=sand_...
REVOLUT_WEBHOOK_SECRET=...
CUBEPAY_ORACLE_PRIVATE_KEY=...     # Never commit this
REGULATORY_PUBLIC_KEY_PEM=...      # Published — safe to commit
REDIS_URL=redis://localhost:6379
```

### New Dependencies (install before building ARTM features)

```bash
npm install jose shamirs-secret-sharing @zk-kit/bulletproofs h3-js
npm install bullmq ioredis zod
npm install @veriff/sdk   # or @sumsub/websdk-react
```

---

## Port Allocation

| Service                        | Port        | Notes                   |
| ------------------------------ | ----------- | ----------------------- |
| Vite Dev Frontend              | **5175**    | Main AgentSphere app    |
| Express Backend                | **3001**    | Payment + oracle API    |
| ngrok API                      | **4040**    | Local ngrok dashboard   |
| **AR Viewer Vite (RESERVED)**  | **⛔ 5176** | **DO NOT USE**          |
| **AR Viewer ngrok (RESERVED)** | **⛔ 4041** | **DO NOT USE**          |
| Redis                          | 6379        | Price cache + job queue |
| Oracle Service                 | 3002        | New — escrow signing    |
| HSM Mock (local dev)           | 3003        | New — court-order mock  |

---

## Regulatory Status

| Regulation              | Requirement                       | Status                                 |
| ----------------------- | --------------------------------- | -------------------------------------- |
| MiCA (EU 2023/1114)     | CASP license                      | 2026 Q4 — application target           |
| Bank of Spain VASP/CASP | Spanish registration              | 2026 Q2 — registration target          |
| AMLD6                   | AML Officer + KYC + TM            | Architecture compliant; license needed |
| TFR (Travel Rule)       | Encrypted sender/receiver packets | Implemented in Blind Vault             |
| GDPR Art. 25            | Privacy by Design                 | Architecturally enforced               |
| PSD2                    | Payment institution compliance    | Via Revolut/Stripe umbrella (Phase 1)  |

**CubePay must obtain CASP registration before launching with real fiat payments.**

---

## Full Architecture Reference

For complete technical details — smart contract code, Shamir's SSS implementation, ZKP range proofs, HSM court-order service, database schema, threat model, and deployment diagrams:

→ [P2P_CRYPTO_ARTM_ARCHITECTURE.md](./P2P_CRYPTO_ARTM_ARCHITECTURE.md)

---

## License

Proprietary — Internal Use Only. All rights reserved, CubePay 2026.
