# CubePay P2P Crypto ARTM — Full System Architecture

## Private Crypto On/Off Ramp via Virtual SoftPOS Terminals

**Version:** 1.0  
**Date:** April 18, 2026  
**Classification:** Internal Architecture Reference  
**Branch:** `revolut-pay-sim-solana-hedera-ai`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Actor Model and User Flows](#2-actor-model-and-user-flows)
3. [ARTM / SoftPOS Terminal Architecture](#3-artm--softpos-terminal-architecture)
4. [Geolocation Discovery Engine](#4-geolocation-discovery-engine)
5. [Multi-Currency Support Layer](#5-multi-currency-support-layer)
6. [Wallet Architecture](#6-wallet-architecture)
7. [Escrow Smart Contract System](#7-escrow-smart-contract-system)
8. [Card Payment Processing Pipeline](#8-card-payment-processing-pipeline)
9. [KYC / AML Compliance Layer](#9-kyc--aml-compliance-layer)
10. [The Blind Vault — Encrypted Data Architecture](#10-the-blind-vault--encrypted-data-architecture)
11. [Authority Key Access Protocol](#11-authority-key-access-protocol)
12. [Zero-Knowledge Proof Compliance Engine](#12-zero-knowledge-proof-compliance-engine)
13. [Full Transaction Data Flow Diagrams](#13-full-transaction-data-flow-diagrams)
14. [Regulatory Framework](#14-regulatory-framework)
15. [Security Threat Model and Mitigations](#15-security-threat-model-and-mitigations)
16. [Technical Stack Requirements](#16-technical-stack-requirements)
17. [Deployment Architecture](#17-deployment-architecture)

---

## 1. System Overview

CubePay P2P ARTM (Augmented Reality Terminal Machine) is a decentralized, peer-to-peer cryptocurrency on/off ramp network. Sellers deploy **virtual SoftPOS terminals** anchored to real-world geographic coordinates, visible only through the CubePay mobile app's AR camera. Buyers discover these terminals using geolocation filters, pay with a virtual card, and receive cryptocurrency directly to their self-custody wallet — all without any in-person meeting.

### Core Value Proposition

| Property                    | Description                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Trustless**               | Escrow smart contracts release funds automatically; no human intermediary controls the swap                        |
| **Private**                 | Transaction data is encrypted at the edge before it reaches CubePay servers; CubePay stores only opaque ciphertext |
| **Compliant by Math**       | Regulatory authorities can access data via cryptographic key shards; CubePay employees cannot                      |
| **Decentralized Discovery** | Sellers anchor virtual terminals to GPS coordinates; buyers find them through the AR camera layer                  |
| **Multi-Chain**             | Supports BTC (via Wrapped BTC on EVM, or native via HTLC), ETH, SOL, HBAR, ADA, BNB, and any ERC-20                |

### System Boundaries

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

---

## 2. Actor Model and User Flows

### 2.1 Actors

| Actor                    | Role                                                     | Key Properties                                                 |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------- |
| **Seller (Bob, Mark)**   | Deploys virtual SoftPOS terminal; locks crypto in escrow | Has self-custody wallet; sets price, currency, and AR location |
| **Buyer (Alice)**        | Discovers terminals in AR; pays fiat; receives crypto    | Has self-custody wallet; uses virtual/credit card              |
| **CubePay Platform**     | Hosts Blind Vault; routes card payments; cannot see data | Acts as blind secure processor; never custodies crypto         |
| **Card Processor**       | Authorizes fiat payment (Revolut/Stripe/own acquirer)    | Sees fiat payment only, coded MCC 6051                         |
| **Trustee**              | Holds Shard 1 of the Regulatory Private Key              | Licensed law firm or digital custodian                         |
| **HSM Service**          | Holds Shard 2; only releases on verified court order     | Air-gapped hardware; cryptographically triggered               |
| **Regulatory Authority** | Reconstructs key and decrypts data upon lawful request   | Bank of Spain, law enforcement, tax authority                  |

### 2.2 Complete Alice–Bob–Mark Transaction Flow

```
TIME ──────────────────────────────────────────────────────────────────────────►

SETUP PHASE (Bob):
  1. Bob installs CubePay Seller App
  2. Bob completes KYC (name, ID, tax number — encrypted to Regulatory Key)
  3. Bob creates terminal: selects currency=BTC, amount=1.0, price=EUR/BTC rate
  4. Bob opens AR Camera at Malaga train station → taps "Deploy Here"
  5. App geocodes coordinates (lat/lon) and sends to CubePay ARTM Registry
  6. Bob locks 1.0 BTC in multi-sig escrow contract
     → Contract address recorded in ARTM Registry, linked to terminal ID

SETUP PHASE (Mark):
  Same flow, deploys terminal in city centre, locks 1.0 BTC

DISCOVERY PHASE (Alice):
  7. Alice opens CubePay Buyer App → AR Camera activates
  8. App fetches terminals within 10km radius via ARTM Discovery API
     → Filters applied: currency=BTC, radius=10km, min_amount=1.0
  9. AR overlay renders Bob's terminal at train station GPS anchor
     → Terminal shows: "1.0 BTC | €X rate | 0.3km away"
 10. Alice taps terminal → Terminal Info Sheet expands
     → Shows: seller rating, escrow address, verification status

PURCHASE PHASE (Alice → Bob's Terminal):
 11. Alice enters her BTC destination address (or scans QR)
 12. Alice taps "Buy 1.0 BTC" → Card input form appears
 13. App encrypts transaction metadata to Regulatory Public Key (ON DEVICE)
 14. App submits card payment request to CubePay Payment Gateway
 15. Payment Gateway calls Card Processor API → Authorization pending
 16. Card Processor sends "AUTH APPROVED" callback to CubePay
 17. CubePay calls Escrow Contract: confirmPayment(terminalId, buyerAddress)
 18. Escrow Contract verifies CubePay oracle signature → releases 1.0 BTC
     → BTC transferred on-chain to Alice's wallet address
 19. CubePay writes encrypted transaction blob to Blind Vault DB
     → CubePay cannot read this blob
 20. Alice receives push notification: "1.0 BTC received in your wallet"
 21. Bob receives push notification: "1.0 BTC sold, €X fiat incoming"

REPEAT (Alice → Mark's Terminal):
 22. Steps 9–21 repeated at Mark's terminal for second 1.0 BTC
```

---

## 3. ARTM / SoftPOS Terminal Architecture

### 3.1 Terminal Data Model

```typescript
interface ARTerminal {
  // Identity
  terminalId: string; // UUID, globally unique
  sellerId: string; // KYC-verified seller reference (hashed)

  // Location
  coordinates: {
    latitude: number; // GPS latitude (WGS84)
    longitude: number; // GPS longitude (WGS84)
    altitude?: number; // Optional: for indoor/multi-level
    anchorPrecision: number; // Accuracy in meters
  };
  arAnchorTransform: {
    position: [number, number, number]; // x, y, z offset from GPS
    rotation: [number, number, number]; // Euler angles (deg)
    scale: [number, number, number]; // 1,1,1 = standard
  };

  // Inventory
  listings: ARTerminalListing[];

  // State
  status: "active" | "paused" | "sold_out" | "suspended";
  escrowContractAddress: string;
  escrowChain: SupportedChain;
  createdAt: number; // Unix timestamp
  expiresAt: number; // Terminal auto-deactivates

  // Compliance
  kycVerified: boolean;
  encryptedSellerMetaBlob: string; // Blind Vault ciphertext
}

interface ARTerminalListing {
  currency: SupportedCurrency; // 'BTC' | 'ETH' | 'SOL' | 'ADA' | ...
  availableAmount: number; // How much is locked in escrow
  priceSourceFeed: string; // Oracle URL for live rate
  premiumPercent: number; // Seller's markup (-5% to +10%)
  minPurchase: number;
  maxPurchase: number;
}
```

### 3.2 AR Rendering Pipeline

The terminal is rendered via **A-Frame 1.4** using WebXR anchors:

```
GPS Coordinates
     │
     ▼
GeolocationToWorldPosition()  ← converts GPS to A-Frame world coords
     │
     ▼
<a-entity
  gps-projected-entity-place
  latitude={lat}
  longitude={lon}
  geometry="primitive:box"   ← 3D ATM model (GLTF)
  class="artm-terminal"
/>
     │
     ▼
Click/Tap Event
     │
     ▼
ARTerminalSheet component  ← React overlay with terminal details
```

**Distance culling:** Terminals >500m are shown as map pins only; <500m render as full 3D ARTM; <50m render with full UI overlay accessible.

### 3.3 Terminal Lifecycle

```
[DRAFT] → [PENDING_ESCROW] → [ACTIVE] → [SOLD_OUT] or [EXPIRED]
             ↑                    ↑
          Seller locks         Escrow
          crypto funds       topped up
```

---

## 4. Geolocation Discovery Engine

### 4.1 Spatial Index

Terminals are indexed using **H3 geospatial indexing** (Uber H3 library, resolution 9 ≈ 100m hexagons):

```
POST /api/v1/terminals/discover
Body: {
  lat: 36.7213,
  lon: -4.4213,
  radiusKm: 10,
  filters: {
    currencies: ['BTC'],
    minAmount: 0.5,
    maxPremium: 5,
    kycVerifiedOnly: true
  }
}

Response: {
  terminals: ARTerminal[],
  clusterCount: number,
  h3Cells: string[]
}
```

### 4.2 Privacy-Preserving Location

Sellers do NOT need to reveal exact coordinates to CubePay's servers. They use **fuzzy anchoring**:

- Exact GPS anchor stored only in the encrypted Blind Vault blob
- CubePay ARTM Registry receives only the **H3 hex cell** (≈100m square area)
- Buyers get exact AR anchor coordinates only when within 200m of the cell
- This prevents CubePay from building a movement/behavior profile on sellers

---

## 5. Multi-Currency Support Layer

### 5.1 Supported Currencies

| Currency  | Chain                     | Escrow Mechanism            | Settlement Time                  |
| --------- | ------------------------- | --------------------------- | -------------------------------- |
| BTC       | Bitcoin / Wrapped on EVM  | HTLC or wBTC ERC-20         | 10 min (native) / ~15s (wrapped) |
| ETH       | Ethereum / Base / Polygon | ERC-20 Escrow Contract      | ~15 seconds                      |
| SOL       | Solana                    | Solana Program (Rust)       | ~400ms                           |
| ADA       | Cardano                   | Plutus Script               | ~20 seconds                      |
| HBAR      | Hedera                    | HTS + Hedera Smart Contract | ~3 seconds                       |
| BNB       | BSC                       | ERC-20 Escrow               | ~3 seconds                       |
| USDC      | Multi-chain               | ERC-20 / SPL Escrow         | Chain dependent                  |
| MATIC/POL | Polygon                   | ERC-20 Escrow               | ~2 seconds                       |

### 5.2 Price Oracle Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Price Oracle Service                 │
│                                                     │
│  Sources:  Chainlink → CoinGecko → Binance API      │
│                     ↓                               │
│         Median Aggregation (3-of-3)                 │
│                     ↓                               │
│         Signed Price Feed (ed25519)                 │
│                     ↓                               │
│         Cached in Redis (TTL: 10s)                  │
└──────────────────────┬──────────────────────────────┘
                       │  Signed price feed
                       ▼
              Escrow Contract
         verifies signature before
         releasing funds at agreed rate
```

The escrow contract uses the **signed price at the time of card authorization** — not at the time of blockchain settlement — to prevent front-running.

---

## 6. Wallet Architecture

### 6.1 Seller Wallet Model

```
Bob's Wallets
├── Self-Custody Hot Wallet (Bob's own MetaMask/Phantom)
│   └── Source of funds for escrow deposit
│
├── Escrow Contract Address (per terminal, per currency)
│   ├── Multi-sig: requires Bob's sig + CubePay Oracle sig
│   ├── Time-lock: funds return to Bob after 72h if no sale
│   └── Cannot be touched by CubePay unilaterally
│
└── Payout Wallet (Bob's own address for fiat settlement)
    └── Fiat credited via ACH/SEPA after card payment clears
```

### 6.2 Buyer Wallet Model

```
Alice's Wallets
├── Self-Custody Destination Wallet (Alice's own)
│   └── Receives crypto directly from escrow contract
│   └── CubePay never holds or has access to this wallet
│
└── Virtual Card (Revolut/CubePay Issued)
    └── Used for fiat payment leg only
    └── Tokenized PAN, never raw card data on CubePay servers
```

### 6.3 CubePay Wallet Model

```
CubePay Platform Wallets
├── Oracle Signing Key (Hot)
│   └── Used ONLY to co-sign escrow release after payment confirmation
│   └── Cannot initiate transfers unilaterally (requires buyer action first)
│
├── Fee Collection Wallet
│   └── Platform fee (e.g., 0.5%) collected per completed swap
│   └── Multi-sig: requires 2-of-3 internal signers to withdraw
│
└── NO CUSTODIAL WALLET
    └── CubePay never holds user funds at any point
```

### 6.4 Key Management

| Key                        | Storage                              | Access                      | Rotation       |
| -------------------------- | ------------------------------------ | --------------------------- | -------------- |
| Oracle Signing Key         | AWS HSM (CloudHSM)                   | CubePay Oracle Service only | 30 days        |
| Seller Escrow Key (Bob)    | User's device (Secure Enclave / TEE) | Bob only                    | User-initiated |
| Buyer Destination Key      | User's self-custody wallet           | Alice only                  | User-initiated |
| Regulatory Public Key      | Public (published on CubePay docs)   | Everyone can encrypt        | Annual         |
| Regulatory Private Shard 1 | Trustee Vault (law firm)             | Trustee + Authority         | On court order |
| Regulatory Private Shard 2 | Air-gapped HSM                       | HSM + Authority             | On court order |

---

## 7. Escrow Smart Contract System

### 7.1 EVM Escrow Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CubePayARTMEscrow is ReentrancyGuard {

    struct Escrow {
        address seller;
        address token;          // address(0) = native ETH
        uint256 amount;
        bytes32 terminalId;
        address cubePayOracle;
        uint256 expiryTimestamp;
        EscrowState state;
    }

    enum EscrowState { LOCKED, RELEASED, REFUNDED }

    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => address) public buyerAddress;

    event EscrowCreated(bytes32 indexed escrowId, address seller, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, address buyer, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address seller, uint256 amount);

    // Called by Bob when deploying his ARTM terminal
    function createEscrow(
        bytes32 escrowId,
        bytes32 terminalId,
        address token,
        uint256 amount,
        address cubePayOracle,
        uint256 durationHours
    ) external payable nonReentrant {
        require(escrows[escrowId].seller == address(0), "Escrow exists");

        if (token == address(0)) {
            require(msg.value == amount, "ETH mismatch");
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        escrows[escrowId] = Escrow({
            seller: msg.sender,
            token: token,
            amount: amount,
            terminalId: terminalId,
            cubePayOracle: cubePayOracle,
            expiryTimestamp: block.timestamp + (durationHours * 1 hours),
            state: EscrowState.LOCKED
        });

        emit EscrowCreated(escrowId, msg.sender, amount);
    }

    // Called by CubePay Oracle after card payment confirmed
    // Oracle signs (escrowId, buyerWallet, nonce) off-chain
    function releaseToSeller(
        bytes32 escrowId,
        address buyerWallet,
        uint256 nonce,
        bytes calldata oracleSignature
    ) external nonReentrant {
        Escrow storage esc = escrows[escrowId];
        require(esc.state == EscrowState.LOCKED, "Not locked");
        require(block.timestamp < esc.expiryTimestamp, "Expired");

        // Verify CubePay Oracle's signature
        bytes32 msgHash = keccak256(abi.encodePacked(escrowId, buyerWallet, nonce));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        address signer = recoverSigner(ethHash, oracleSignature);
        require(signer == esc.cubePayOracle, "Invalid oracle sig");

        esc.state = EscrowState.RELEASED;
        buyerAddress[escrowId] = buyerWallet;

        if (esc.token == address(0)) {
            payable(buyerWallet).transfer(esc.amount);
        } else {
            IERC20(esc.token).transfer(buyerWallet, esc.amount);
        }

        emit EscrowReleased(escrowId, buyerWallet, esc.amount);
    }

    // Bob can reclaim if no purchase within expiry window
    function refundSeller(bytes32 escrowId) external nonReentrant {
        Escrow storage esc = escrows[escrowId];
        require(msg.sender == esc.seller, "Not seller");
        require(esc.state == EscrowState.LOCKED, "Not locked");
        require(block.timestamp >= esc.expiryTimestamp, "Not expired");

        esc.state = EscrowState.REFUNDED;

        if (esc.token == address(0)) {
            payable(esc.seller).transfer(esc.amount);
        } else {
            IERC20(esc.token).transfer(esc.seller, esc.amount);
        }

        emit EscrowRefunded(escrowId, esc.seller, esc.amount);
    }

    function recoverSigner(bytes32 hash, bytes calldata sig) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(sig);
        return ecrecover(hash, v, r, s);
    }

    function splitSignature(bytes calldata sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Bad sig length");
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
    }
}
```

### 7.2 Solana Program (Rust) — Outline

```rust
// lib.rs (Anchor framework)
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[program]
pub mod cubepay_artm_escrow {
    pub fn create_escrow(ctx: Context<CreateEscrow>, amount: u64, expiry: i64) -> Result<()> {
        // Transfer SPL tokens from seller to escrow PDA
        // Store escrow state: seller, amount, expiry, terminal_id, oracle_pubkey
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>, buyer: Pubkey, nonce: u64, oracle_sig: [u8; 64]) -> Result<()> {
        // Verify ed25519 signature from CubePay Oracle
        // Transfer tokens from escrow PDA to buyer's token account
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        // Verify expiry passed, return tokens to seller
    }
}
```

### 7.3 Hedera Smart Contract (Solidity on HSCS)

Hedera Smart Contract Service uses the same Solidity logic as the EVM contract, deployed via `@hashgraph/sdk`:

```typescript
import {
  ContractCreateTransaction,
  FileCreateTransaction,
} from "@hashgraph/sdk";

// Deploy bytecode using Hedera File Service (for large contracts)
const fileCreateTx = await new FileCreateTransaction()
  .setContents(CONTRACT_BYTECODE)
  .execute(hederaClient);

const contractCreateTx = await new ContractCreateTransaction()
  .setBytecodeFileId(fileId)
  .setGas(1_000_000)
  .execute(hederaClient);
```

### 7.4 BTC HTLC (Hash Time-Lock Contract)

For native BTC (non-wrapped), a **Hash Time-Lock Contract** is used:

```
Alice generates: secret S, hashlock H = SHA256(S)
Bob creates HTLC output:
  IF (hash(preimage) == H AND sig(Alice)) → Alice can claim
  ELSE IF (timeout > 48h AND sig(Bob)) → Bob reclaims

Flow:
  1. Bob publishes HTLC on Bitcoin
  2. Alice pays fiat via card
  3. CubePay Oracle reveals preimage S to Alice via secure channel
  4. Alice broadcasts claim tx with preimage S
  5. Bob's escrow releases to Alice
```

---

## 8. Card Payment Processing Pipeline

### 8.1 Regulatory Context

All card payments for crypto must use **MCC 6051** (Non-Financial Institutions — Foreign Currency, Money Orders, Travelers Checks, Cryptocurrency). Any other MCC is transaction laundering, which is:

- A federal crime under EU AMLD6
- Grounds for permanent MATCH-list blacklisting by Visa/Mastercard
- Subject to €50,000+ per-transaction fines

**There is no legal way to disguise a crypto purchase as a grocery payment.** CubePay must accurately code all transactions.

### 8.2 Card Processing Options

| Option                   | Description                                            | Requirements                           | Recommended                 |
| ------------------------ | ------------------------------------------------------ | -------------------------------------- | --------------------------- |
| **Revolut Business API** | Use Revolut as acquiring bank                          | Revolut Business account, CASP license | ✅ Phase 1 (sandbox exists) |
| **Stripe Connect**       | Stripe as Payment Facilitator                          | Stripe account, CASP registration      | ✅ Phase 1 alternative      |
| **Own EMI License**      | CubePay becomes own Electronic Money Institution       | €350k capital, ~18 month approval      | 🔄 Phase 3                  |
| **White-label Acquirer** | Partner with licensed acquirer (e.g., Adyen, Worldpay) | Revenue share agreement, faster        | ✅ Phase 2                  |

**You do NOT need to register directly with Visa/Mastercard** if you use a licensed Payment Facilitator. Revolut, Stripe, and Adyen are already registered card scheme members and sponsor your transactions under their umbrella.

### 8.3 Payment Flow Architecture

```
Alice's Card (Virtual/Physical)
        │
        ▼  HTTPS + TLS 1.3
CubePay Frontend (React)
        │  tokenize card (never raw PAN)
        ▼
CubePay Payment API (Express.js, port 3001)
        │  /api/v1/payment/initiate
        ▼
┌────────────────────────────────────────────┐
│          Card Processor (Revolut API)       │
│                                            │
│  POST /merchant/v1/orders                  │
│  {                                         │
│    amount: 52000,        ← EUR cents        │
│    currency: "EUR",                        │
│    merchant_order_ext_ref: escrowId,       │
│    description: "CubePay MCC6051 exchange",│
│    metadata: {                             │
│      mcc: "6051",                          │
│      escrow_id: "0xABC...",               │
│    }                                       │
│  }                                         │
└───────────────┬────────────────────────────┘
                │  Payment URL / 3DS redirect
                ▼
        Alice completes 3DS auth
                │
                ▼
        Revolut Webhook → CubePay
        POST /webhooks/payment
        { status: "COMPLETED", order_id: "..." }
                │
                ▼
        CubePay Oracle signs release
                │
                ▼
        Escrow Contract releases crypto → Alice's wallet
```

### 8.4 Revolut API Integration (Current Stack)

```typescript
// server.js — Revolut webhook handler (existing integration)
app.post("/webhooks/payment", async (req, res) => {
  const signature = req.headers["revolut-signature"];

  // Verify webhook authenticity using HMAC
  const isValid = verifyRevolutWebhook(
    req.body,
    signature,
    REVOLUT_WEBHOOK_SECRET,
  );
  if (!isValid) return res.status(401).json({ error: "Invalid signature" });

  const { event, order_id, state } = req.body;

  if (event === "ORDER_COMPLETED" && state === "COMPLETED") {
    const escrowId = await getEscrowIdForOrder(order_id);
    const { buyerWallet } = await getPendingTransaction(escrowId);

    // Oracle signs and triggers escrow release
    await oracleService.releaseEscrow(escrowId, buyerWallet);
  }

  res.json({ received: true });
});
```

---

## 9. KYC / AML Compliance Layer

### 9.1 Who Needs KYC

Under MiCA TFR (Transfer of Funds Regulation) and AMLD6:

| User               | KYC Required                                    | Level                                                                 |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------- |
| Seller (Bob, Mark) | Yes — mandatory                                 | Full KYC: government ID + liveness check + tax number                 |
| Buyer (Alice)      | Yes — for transactions > €1,000/year cumulative | Simplified: phone + email for small amounts; full KYC above threshold |
| CubePay Platform   | Yes — CASP license + AML Officer                | Corporate KYC, Bank of Spain registration                             |

### 9.2 KYC Flow

```
Seller Registration
        │
        ▼
1. Email + Phone verification (OTP)
2. Liveness check (selfie + ID photo)
        │ → Sent to KYC provider (Jumio / Sumsub / Persona)
        ▼
3. KYC provider returns: APPROVED | REJECTED | REVIEW
4. If APPROVED:
   - User's PII data encrypted with Regulatory Public Key (on device)
   - Encrypted blob stored in Blind Vault DB
   - CubePay stores only: userId, kycStatus=VERIFIED, kycProvider=Jumio, timestamp
   - CubePay NEVER stores name, ID number, DOB in plaintext
5. ARTM creation unlocked for verified sellers
```

### 9.3 Travel Rule Compliance (TFR)

When a crypto transfer exceeds **€1,000** (or €0 for unhosted wallets under stricter interpretations):

```typescript
interface TravelRulePacket {
  originatorName: string; // Encrypted with Regulatory Key
  originatorVasp: string; // CubePay VASP identifier
  originatorAddress: string; // Blockchain address (public)
  beneficiaryName: string; // Encrypted with Regulatory Key
  beneficiaryVasp: string; // If hosted wallet, their VASP ID
  beneficiaryAddress: string; // Blockchain address (public)
  transactionAmount: string; // ZKP-proven range only (see Section 12)
  transactionTimestamp: number;
}

// This packet is encrypted with Regulatory Public Key before storage
// Only plaintext stored: originatorAddress, beneficiaryAddress, timestamp
// Everything else: opaque to CubePay
```

---

## 10. The Blind Vault — Encrypted Data Architecture

### 10.1 Core Principle

**Encryption happens at the edge (user's device) before data ever reaches CubePay servers.**

CubePay stores only:

- Encrypted binary blobs
- Non-sensitive metadata (timestamps, status flags, chain IDs)
- Blockchain addresses (these are already public on-chain)

CubePay never stores:

- Real names
- Card numbers
- Transaction amounts in plaintext
- IP addresses in plaintext

### 10.2 Regulatory Key Generation and Distribution

```
KEY CEREMONY (performed once, with notary and multiple witnesses)
        │
        ▼
1. Generate RSA-4096 or secp521r1 keypair in air-gapped environment
2. Private Key split using Shamir's Secret Sharing (2-of-3 threshold):
        │
        ├─── Shard 1 → Trustee (licensed law firm)
        │            → Stored in tamper-evident HSM at Trustee's vault
        │
        ├─── Shard 2 → CubePay's Court-Order HSM
        │            → Air-gapped AWS CloudHSM
        │            → Requires digitally signed court order to activate
        │
        └─── Shard 3 → CubePay Board Escrow (optional 3rd shard)
                     → Only used in bankruptcy/dissolution scenario
                     → Stored with company's registered notary

3. Public Key published openly:
   → In CubePay's CASP documentation
   → On a transparency webpage
   → Anchored in a smart contract for immutable record
```

### 10.3 Edge Encryption Implementation

```typescript
// Running on Alice's device — in the React Native / PWA client
// NEVER runs on CubePay servers

import { importSPKI, encrypt } from "jose"; // JOSE library for JWE

const REGULATORY_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

interface TransactionMetadata {
  transactionId: string;
  escrowId: string;
  sellerPseudonymHash: string; // Not real name, just hash
  buyerPseudonymHash: string;
  cryptoCurrency: string;
  cryptoAmount: string; // e.g., "1.000000"
  fiatCurrency: string;
  fiatAmount: string; // e.g., "52000.00"
  buyerKycRef: string; // Reference to KYC provider record
  sellerKycRef: string;
  buyerIpHash: string; // SHA-256 of IP, not raw IP
  timestamp: number;
  geoRegion: string; // e.g., "ES-MA" (Andalucia), NOT exact GPS
}

async function encryptTransactionMetadata(
  metadata: TransactionMetadata,
): Promise<string> {
  const publicKey = await importSPKI(REGULATORY_PUBLIC_KEY_PEM, "RSA-OAEP-256");

  const jwe = await new CompactEncrypt(
    new TextEncoder().encode(JSON.stringify(metadata)),
  )
    .setProtectedHeader({ alg: "RSA-OAEP-256", enc: "A256GCM" })
    .encrypt(publicKey);

  return jwe; // This is the opaque ciphertext stored by CubePay
}

// After purchase, only this ciphertext is sent to server:
const encryptedBlob = await encryptTransactionMetadata(txMetadata);
await cubepayApi.storeEncryptedTransaction({
  escrowId,
  encryptedBlob, // ← Only this. CubePay sees random characters.
  chainId,
  txHash, // On-chain tx hash (public)
  status: "COMPLETED",
  createdAt: Date.now(),
});
```

### 10.4 Database Schema (Blind Vault)

```sql
-- What CubePay actually stores in Supabase / PostgreSQL

CREATE TABLE blind_vault_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Non-sensitive identifiers (public blockchain data)
  chain_id        VARCHAR(32) NOT NULL,         -- 'ethereum', 'solana', etc.
  tx_hash         VARCHAR(128),                 -- On-chain transaction hash
  escrow_address  VARCHAR(128) NOT NULL,        -- Smart contract address
  buyer_wallet    VARCHAR(128) NOT NULL,        -- Destination wallet (public)
  seller_wallet   VARCHAR(128) NOT NULL,        -- Source wallet (public)

  -- Blind Vault: opaque ciphertext
  encrypted_blob  TEXT NOT NULL,               -- JWE ciphertext, ~2-4KB

  -- Minimal operational metadata (no PII)
  status          VARCHAR(32) DEFAULT 'PENDING', -- PENDING/COMPLETED/FAILED/REFUNDED
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,

  -- For Travel Rule audit (encrypted separately, same mechanism)
  encrypted_travel_rule_blob TEXT,

  -- CubePay cannot read these blobs
  -- Only reconstructed Regulatory Key can decrypt
  CONSTRAINT no_plaintext_pii CHECK (
    encrypted_blob NOT LIKE '%"name":%'  -- Enforce no accidental plaintext
  )
);

-- Index for regulatory queries by blockchain address (public data)
CREATE INDEX idx_buyer_wallet ON blind_vault_transactions(buyer_wallet);
CREATE INDEX idx_seller_wallet ON blind_vault_transactions(seller_wallet);
CREATE INDEX idx_created_at ON blind_vault_transactions(created_at);
```

### 10.5 What Each Party Sees

| Party                                             | Can See                                             | Cannot See                             |
| ------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| CubePay DB Admin                                  | wallet addresses, tx hashes, timestamps, ciphertext | names, amounts, IP addresses, KYC data |
| CubePay Developer                                 | same as above                                       | same as above                          |
| CubePay CEO/CTO                                   | same as above                                       | same as above                          |
| Hacker (DB breach)                                | ciphertext (useless without private key shards)     | everything sensitive                   |
| Regulatory Authority (with warrant + both shards) | everything                                          | nothing                                |

---

## 11. Authority Key Access Protocol

### 11.1 Key Reconstruction Flow

```
TRIGGER: Regulatory Authority (e.g., Bank of Spain Investigative Unit)
         has grounds to investigate specific transactions

STEP 1 — FORMAL REQUEST
  Authority prepares:
  a. Court order / judicial warrant (digitally signed by judge)
  b. Specific transaction IDs or date range and wallet addresses
  c. Formal request addressed to CubePay + Trustee

STEP 2 — CUBEPAY'S ROLE (Transparent & Limited)
  CubePay receives request.
  CubePay can ONLY do:
  a. Export the encrypted blobs matching the requested wallet addresses
  b. Forward blobs to Authority
  c. Forward court order to Trustee and HSM Service
  CubePay CANNOT decrypt the blobs (no key shards).

STEP 3 — TRUSTEE VERIFICATION
  Law Firm Trustee receives:
  a. Court order (verify authenticity with public key of signing judge)
  b. Formal request from Authority

  If valid → Trustee releases Shard 1 to Authority's secure channel

STEP 4 — HSM ACTIVATION
  Authority sends digitally signed court order to CubePay's Court-Order HSM.

  HSM verification logic:
  - Validates judge's signature against published judicial PKI
  - Validates court order format (jurisdiction-specific)
  - Validates requester is a registered law enforcement body

  If all checks pass → HSM releases Shard 2 to Authority's secure channel

STEP 5 — KEY RECONSTRUCTION
  Authority (in their own secure environment):
  a. Combines Shard 1 + Shard 2 using Shamir reconstruction algorithm
  b. Reconstructs Regulatory Private Key
  c. Decrypts all provided ciphertext blobs
  d. Authority now has plaintext transaction data

STEP 6 — AUDIT TRAIL
  Every key reconstruction event is:
  a. Logged immutably to Hedera Hashgraph (tamper-proof audit log)
  b. Timestamped and linked to the court order hash
  c. Visible to CubePay, Trustee, and Authority (transparency)
  d. Published in CubePay's quarterly transparency report
```

### 11.2 HSM Implementation

```typescript
// Court-Order HSM Service — runs on AWS CloudHSM
// This is the Shard 2 custodian

interface CourtOrderRequest {
  courtOrderDocument: string; // Base64 PDF
  courtOrderSignature: string; // Judge's digital signature
  requestingAgency: string; // e.g., "UDEF_SPAIN" (Spanish Economic Crime Unit)
  agencyPublicKey: string; // Verified against government PKI
  walletAddresses: string[]; // Scope of decryption request
  requestedAt: number;
}

interface HSMReleaseResponse {
  shard2: string; // Encrypted with requesting authority's pubkey
  releaseId: string; // UUID for audit log
  encryptedFor: string; // Authority's public key fingerprint
  timestamp: number;
  auditLogTxHash: string; // Hedera transaction hash
}

async function processCourtOrder(
  req: CourtOrderRequest,
): Promise<HSMReleaseResponse> {
  // 1. Validate court order signature against judicial PKI
  await validateJudicialSignature(
    req.courtOrderDocument,
    req.courtOrderSignature,
  );

  // 2. Validate requesting agency against law enforcement registry
  await validateLawEnforcementAgency(req.requestingAgency, req.agencyPublicKey);

  // 3. Log the access request to Hedera (immutable)
  const auditTx = await logToHedera({
    event: "COURT_ORDER_RECEIVED",
    orderHash: sha256(req.courtOrderDocument),
    agency: req.requestingAgency,
    scope: req.walletAddresses,
    timestamp: req.requestedAt,
  });

  // 4. Retrieve Shard 2 from HSM (using PKCS#11 interface)
  const shard2 = await hsmClient.getKeyMaterial("regulatory-shard-2");

  // 5. Encrypt Shard 2 with Authority's public key (only they can use it)
  const encryptedShard2 = await encryptForAuthority(
    shard2,
    req.agencyPublicKey,
  );

  return {
    shard2: encryptedShard2,
    releaseId: generateUUID(),
    encryptedFor: req.requestingAgency,
    timestamp: Date.now(),
    auditLogTxHash: auditTx.transactionId.toString(),
  };
}
```

### 11.3 Shamir's Secret Sharing — Implementation Reference

```typescript
import { split, combine } from "shamirs-secret-sharing";

// KEY CEREMONY (performed once)
async function performKeyCeremony(regulatoryPrivateKey: Buffer) {
  const shares = split(regulatoryPrivateKey, {
    shares: 3, // Total shards
    threshold: 2, // Minimum shards needed to reconstruct
  });

  // shares[0] → Trustee (law firm)
  // shares[1] → CubePay HSM (court-order triggered)
  // shares[2] → Board Escrow Notary (dissolution only)

  // Each shard is written to its respective physical hardware
  // and then the in-memory key is zeroed out
  regulatoryPrivateKey.fill(0);

  return {
    shard1: shares[0], // → Trustee physical delivery
    shard2: shares[1], // → HSM programming
    shard3: shares[2], // → Notary sealed envelope
  };
}

// RECONSTRUCTION (by Authority, in their environment, never on CubePay servers)
function reconstructKey(shard1: Buffer, shard2: Buffer): Buffer {
  return combine([shard1, shard2]);
}
```

---

## 12. Zero-Knowledge Proof Compliance Engine

### 12.1 Purpose

ZKPs allow CubePay to prove to regulators that **transactions comply with thresholds** without revealing exact amounts.

### 12.2 Range Proof Implementation

Using **Bulletproofs** (efficient ZKP for range proofs, no trusted setup):

```typescript
// On Alice's device — proves her transaction is within legal limits
// without revealing the exact EUR amount

import { bulletproof } from "bulletproofs-js"; // or use snarkjs

interface ZKPRangeProof {
  proof: string; // The ZKP itself (binary, ~700 bytes for Bulletproof)
  commitment: string; // Pedersen commitment to the amount
  publicInputs: {
    rangeMin: number; // 0
    rangeMax: number; // 999999 (≤ €9,999.99 per transaction)
    currency: string; // EUR
  };
}

async function generateTransactionRangeProof(
  fiatAmountCents: number, // The real amount (NEVER leaves the device)
): Promise<ZKPRangeProof> {
  // Prove: 0 ≤ fiatAmountCents ≤ 999999
  // Without revealing fiatAmountCents itself

  const { proof, commitment } = await bulletproof.prove(
    fiatAmountCents,
    0, // min
    999999, // max
  );

  return {
    proof: proof.toString("base64"),
    commitment: commitment.toString("base64"),
    publicInputs: {
      rangeMin: 0,
      rangeMax: 999999,
      currency: "EUR",
    },
  };
}

// CubePay verifies the proof (DOES NOT see the amount)
async function verifyRangeProof(zkp: ZKPRangeProof): Promise<boolean> {
  return bulletproof.verify(
    Buffer.from(zkp.proof, "base64"),
    Buffer.from(zkp.commitment, "base64"),
    zkp.publicInputs.rangeMin,
    zkp.publicInputs.rangeMax,
  );
}
```

### 12.3 KYC ZKP (Proof of Verified Identity Without Revealing Identity)

```
Using Verifiable Credentials (W3C VC standard):

1. KYC provider (Jumio) issues a Verifiable Credential to Alice:
   "Alice_hash_xyz is a verified adult EU resident" (signed by Jumio)

2. Alice's app presents a ZKP derived from this VC to CubePay:
   PROOF: "The holder of this credential is KYC-verified for EU crypto trading"
   WITHOUT revealing: Alice's name, DOB, ID number, or address

3. CubePay verifies the ZKP against Jumio's public signing key.
   CubePay learns: Alice is KYC-verified.
   CubePay does NOT learn: who Alice actually is.

4. The full VC is stored encrypted in the Blind Vault.
   Only accessible to authorities with reconstructed Regulatory Key.
```

---

## 13. Full Transaction Data Flow Diagrams

### 13.1 Happy Path — Complete Data Flow

```
ALICE'S DEVICE                    CUBEPAY SERVERS              BLOCKCHAIN
     │                                  │                           │
     │── [1] Fetch terminals nearby ───►│                           │
     │◄── [2] Terminal list ────────────│                           │
     │                                  │                           │
     │── [3] Generate ZKP range proof   │                           │
     │    (local, no server)            │                           │
     │                                  │                           │
     │── [4] Encrypt tx metadata ───────┼──(Regulatory PubKey)     │
     │    (local, using pub key)        │                           │
     │                                  │                           │
     │── [5] POST /payment/initiate ───►│                           │
     │    { escrowId, encryptedBlob,    │                           │
     │      zkpProof, buyerWallet }     │                           │
     │                                  │                           │
     │                                  │── [6] Create Revolut ────►│
     │                                  │    Order (MCC 6051)       │
     │◄── [7] 3DS URL ──────────────────│                           │
     │                                  │                           │
     │── [8] Complete 3DS auth ─────────┼────────────────────────► Revolut
     │                                  │◄──── [9] Webhook ─────── Revolut
     │                                  │   ORDER_COMPLETED         │
     │                                  │                           │
     │                                  │── [10] Oracle signs ─────►│ EVM/SOL
     │                                  │    releaseEscrow()        │ Contract
     │                                  │                           │
     │                                  │                    [11] Contract
     │                                  │                    releases crypto
     │                                  │                    → Alice's wallet
     │                                  │                           │
     │◄── [12] "1.0 BTC received" ──────│                           │
     │                                  │                           │
     │                         [13] Store in Blind Vault:           │
     │                              - encrypted_blob (opaque)       │
     │                              - tx_hash (public)              │
     │                              - buyer_wallet (public)         │
     │                              - status=COMPLETED              │
```

### 13.2 Authority Decryption Flow

```
REGULATOR                    TRUSTEE              CUBEPAY HSM        CUBEPAY DB
    │                           │                     │                  │
    │── [1] Present warrant ───►│                     │                  │
    │── [1] Present warrant ────┼────────────────────►│                  │
    │                           │                     │                  │
    │                      [2] Validate             [2] Validate         │
    │                       court order             court order          │
    │                           │                     │                  │
    │◄── [3] Shard 1 ───────────│                     │                  │
    │◄── [3] Shard 2 ───────────┼─────────────────────│                  │
    │                           │                     │                  │
    │── [4] Request blobs ──────┼─────────────────────┼─────────────────►│
    │◄── [5] Encrypted blobs ───┼─────────────────────┼──────────────────│
    │                           │                     │                  │
    │── [6] Reconstruct key     │                     │                  │
    │    (Shard1 + Shard2)      │                     │                  │
    │                           │                     │                  │
    │── [7] Decrypt blobs       │                     │                  │
    │    → Plaintext data       │                     │                  │
    │                           │                     │                  │
    │── [8] Hedera audit log entry (all parties see this happened)       │
```

---

## 14. Regulatory Framework

### 14.1 EU Regulatory Requirements for CubePay ARTM

| Regulation                       | Requirement                                                             | CubePay's Approach                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **MiCA (EU 2023/1114)**          | CASP license required to operate crypto exchange                        | Apply for CASP license in Spain (or Ireland/Lithuania for passporting)              |
| **AMLD6**                        | AML Officer, KYC, transaction monitoring, suspicious activity reporting | KYC at onboarding; encrypted TM with blind vault; SAR filing capability             |
| **TFR (Transfer of Funds Reg.)** | Travel Rule for crypto transfers                                        | Encrypted Travel Rule packets in Blind Vault                                        |
| **PSD2**                         | Payment institution compliance for fiat leg                             | Operating under licensed acquirer (Revolut/Stripe) umbrella initially               |
| **GDPR**                         | Privacy by Design                                                       | Encryption at edge = Data Minimization; CubePay is Processor not Controller         |
| **Bank of Spain**                | Registration as VASP (pre-MiCA) and CASP (post-MiCA)                    | Register with Banco de España Registro de Proveedores de Servicios de Criptoactivos |

### 14.2 Compliance Timeline

```
2026 Q2 → Apply for Bank of Spain VASP/CASP registration
2026 Q3 → Launch in Spain under Revolut as Payment Facilitator
2026 Q4 → MiCA CASP application (full EU passporting)
2027 Q1 → Own Electronic Money Institution (EMI) license application
2027 Q3 → Launch across EU with own card processing
```

### 14.3 GDPR Privacy by Design — CubePay's Position

Because encryption happens at the edge and CubePay holds no decryption keys:

- **Data Minimization:** CubePay only stores what is strictly necessary (public blockchain data + ciphertext)
- **Purpose Limitation:** Ciphertext cannot be processed for any purpose other than authority access
- **Storage Limitation:** Encrypted blobs can be automatically deleted after regulatory retention period (5 years for AML in EU) with provable deletion
- **GDPR Article 25 Compliance:** Privacy by Design is architecturally enforced, not just policy-based

---

## 15. Security Threat Model and Mitigations

### 15.1 Threat Matrix

| Threat                                   | Attack Vector                                                | Mitigation                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Database breach**                      | SQL injection / insider threat                               | Only ciphertext stored; useless without key shards                                           |
| **Metadata analysis**                    | Traffic analysis: Alice connects to Bob's terminal at 2pm    | Encrypted IP addresses; Tor-compatible routing for sensitive requests                        |
| **Oracle key compromise**                | Attacker gets CubePay's oracle signing key                   | Oracle can only release, not create/steal escrow; time-locked contracts; multi-sig oracle    |
| **Escrow contract exploit**              | Reentrancy, integer overflow                                 | OpenZeppelin ReentrancyGuard; audited contracts; bug bounty program                          |
| **Front-running**                        | Attacker sees pending release and front-runs with higher gas | Price locked at payment authorization time; commit-reveal for buyer address                  |
| **Key ceremony compromise**              | Someone records the private key before sharding              | Air-gapped hardware; notarized ceremony; multiple independent witnesses                      |
| **Shard reconstruction without warrant** | Trustee and HSM collude                                      | Audit log on Hedera is immutable; transparency report; Trustee contractually bound           |
| **GPS spoofing**                         | Seller places terminal with fake coordinates                 | Terminal coordinates verified at first use by at least 3 independent buyer GPS readings      |
| **Fake terminals**                       | Attacker deploys empty escrow terminals                      | Escrow lock verified on-chain before terminal is listed; buyer sees lock proof before paying |
| **Regulatory key loss**                  | All shards lost (fire, firm dissolution)                     | Shard 3 held by notary for recovery; geographic distribution required                        |

### 15.2 Network Privacy Layer

```typescript
// Metadata privacy for connection patterns
// Using onion-routing or at minimum encrypted metadata headers

interface PrivacyRoutingConfig {
  // For high-privacy mode (user opt-in)
  torEndpoint: string; // Route through Tor exit node

  // For standard mode
  clientIpHashed: boolean; // Store SHA-256(IP) not raw IP
  userAgentStripped: boolean; // No UA string stored
  timingJitter: number; // Add 0-500ms random delay to requests
  // to prevent timing correlation attacks

  // Terminal discovery
  locationFuzzing: number; // Add ±50m to buyer's discovery request
  // to prevent exact tracking of buyer location
}
```

### 15.3 Smart Contract Security Checklist

- [x] Reentrancy guard on all state-changing functions
- [x] Integer overflow protection (Solidity 0.8+ native)
- [x] Oracle signature verification before any release
- [x] Escrow expiry time-lock for seller refund path
- [x] Events emitted for all state changes (audit trail)
- [x] No `selfdestruct` in contract (immutable escrow)
- [x] Third-party audit required before mainnet deployment
- [x] Bug bounty program for contract vulnerabilities
- [x] Emergency pause capability (only pauses new creations, never existing escrows)

---

## 16. Technical Stack Requirements

### 16.1 Additions to Existing Stack

The following components are needed **in addition** to the current CubePay stack (React 18, TypeScript 5.2, Vite 5, Express 4.21, Supabase, ethers.js 5.7, @solana/web3.js, @hashgraph/sdk, A-Frame 1.4):

#### Frontend Additions

```json
{
  "jose": "^5.x", // JWE encryption (Regulatory Public Key)
  "shamirs-secret-sharing": "^2.x", // SSS for key ceremony UI
  "@zk-kit/bulletproofs": "^1.x", // ZKP range proofs
  "h3-js": "^4.x", // H3 geospatial indexing
  "@veriff/sdk": "^3.x", // KYC liveness check
  "@sumsub/websdk-react": "^2.x" // Alternative KYC SDK
}
```

#### Backend Additions

```json
{
  "pkijs": "^3.x", // X.509 and PKCS#11 for HSM integration
  "node-hsmlib": "latest", // AWS CloudHSM PKCS#11 Node.js bindings
  "@hashgraph/sdk": "^2.77.x", // Already present — extend for audit logging
  "bullmq": "^5.x", // Reliable job queue for oracle release flow
  "ioredis": "^5.x", // Redis for price cache and job queue
  "zod": "^3.x", // Runtime schema validation at API boundaries
  "jose": "^5.x" // JWE on server for transport encryption
}
```

#### Infrastructure Additions

```yaml
# New services required
services:
  - PostgreSQL (Supabase): EXTEND existing schema with blind_vault_transactions
  - Redis: Price oracle cache (TTL 10s), job queue backend
  - AWS CloudHSM: Shard 2 custody (Court-Order HSM)
  - Chainlink Oracle Node: Verified price feeds for escrow contracts
  - Hedera Topic: Immutable audit log for key reconstruction events

# Smart Contracts
contracts:
  - CubePayARTMEscrow.sol: EVM escrow (Polygon/Base/Ethereum)
  - cubepay_artm_escrow: Solana Anchor program
  - CubePayEscrow_HSCS: Hedera Smart Contract Service

# KYC Provider
kyc:
  provider: Sumsub (EU-compliant, Spanish language support)
  alternative: Veriff
  tier1: phone+email (< €500 annual)
  tier2: government_id + liveness (€500–€15,000 annual)
  tier3: enhanced due diligence (> €15,000 annual)
```

### 16.2 Port and Service Allocation

| Service                    | Port           | Notes                           |
| -------------------------- | -------------- | ------------------------------- |
| Vite Dev Frontend          | 5175           | Current allocation              |
| Express Backend            | 3001           | Current allocation              |
| ngrok API                  | 4040           | Current allocation              |
| **AR Viewer (RESERVED)**   | **4041, 5176** | **DO NOT TOUCH**                |
| Redis (local dev)          | 6379           | New                             |
| Oracle Service (local dev) | 3002           | New backend service             |
| HSM Mock (local dev)       | 3003           | New backend service (mock only) |

---

## 17. Deployment Architecture

### 17.1 Production Architecture

```
Internet
    │
    ▼
Cloudflare CDN + WAF
    │
    ├── Static Assets → Cloudflare Pages (React build)
    │
    └── API Requests → Load Balancer
            │
            ├── CubePay API (Express) → Auto-scaling EC2 / ECS
            │         │
            │         ├── Supabase PostgreSQL (Blind Vault)
            │         ├── Redis Cluster (Price cache + Queues)
            │         └── AWS CloudHSM (Court-Order Shard 2)
            │
            └── Oracle Service → Dedicated EC2 (signing key isolated)
                      │
                      └── AWS CloudHSM (Oracle Signing Key)

Blockchain Nodes (RPC):
    ├── Ethereum: Infura / Alchemy (Mainnet + Polygon)
    ├── Solana: Helius / QuickNode
    └── Hedera: Hedera mainnet (audit log)
```

### 17.2 Smart Contract Deployment Targets

| Phase       | Network                | Purpose                     |
| ----------- | ---------------------- | --------------------------- |
| Development | Polygon Amoy Testnet   | EVM escrow testing          |
| Development | Solana Devnet          | Solana program testing      |
| Development | Hedera Testnet         | HBAR + audit log testing    |
| Staging     | Polygon Mumbai         | Pre-production validation   |
| Production  | Polygon Mainnet + Base | Primary EVM chain (low gas) |
| Production  | Solana Mainnet         | SOL/SPL tokens              |
| Production  | Hedera Mainnet         | HBAR + immutable audit log  |
| Future      | Ethereum Mainnet       | High-value ETH transactions |

---

## Appendix A — Glossary

| Term                        | Definition                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| **ARTM**                    | Augmented Reality Terminal Machine — virtual SoftPOS terminal visible through AR camera     |
| **Blind Vault**             | CubePay's encrypted data storage where CubePay holds ciphertext but no decryption keys      |
| **CASP**                    | Crypto-Asset Service Provider — MiCA license category for crypto exchanges                  |
| **HTLC**                    | Hash Time-Lock Contract — used for native BTC escrow without wrapping                       |
| **HSM**                     | Hardware Security Module — tamper-resistant hardware for key storage                        |
| **MCC 6051**                | Merchant Category Code for cryptocurrency and foreign exchange purchases                    |
| **Oracle**                  | CubePay's signing service that co-authorizes escrow releases after payment confirmation     |
| **Shamir's Secret Sharing** | Cryptographic technique to split a secret into N shards requiring K to reconstruct          |
| **SSS**                     | Shamir's Secret Sharing (abbreviation)                                                      |
| **SoftPOS**                 | Software-based Point of Sale — uses a mobile device as a payment terminal                   |
| **Travel Rule**             | FATF/TFR requirement to transmit sender/receiver identity information with crypto transfers |
| **TFR**                     | EU Transfer of Funds Regulation — implements Travel Rule in European law                    |
| **ZKP**                     | Zero-Knowledge Proof — prove a statement is true without revealing the underlying data      |
| **JWE**                     | JSON Web Encryption — standard for encrypted JSON payloads                                  |
| **VASP**                    | Virtual Asset Service Provider — pre-MiCA regulatory category                               |

---

## Appendix B — Key References

- [MiCA Regulation (EU) 2023/1114](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023R1114)
- [EU Transfer of Funds Regulation (TFR)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023R1113)
- [Bank of Spain VASP Registry](https://www.bde.es/bde/en/)
- [Coinme — Licensed US Cash-to-Crypto](https://coinme.com)
- [Shamir's Secret Sharing — IETF RFC](https://www.ietf.org/rfc/rfc2628.txt)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [Bulletproofs Paper (Range Proofs)](https://eprint.iacr.org/2017/1066.pdf)
- [OpenZeppelin Smart Contract Security](https://docs.openzeppelin.com/contracts)
- [H3 Geospatial Indexing](https://h3geo.org/)
- [JOSE (JWE) Spec](https://www.rfc-editor.org/rfc/rfc7516)

---

_Document maintained by CubePay Architecture Team. Update on each major feature change._  
_Classification: Internal — Do not distribute outside authorized personnel._
