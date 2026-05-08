# P2P CubePay — Product Specification, Architecture & Tech Stack

**Version:** 1.0  
**Date:** May 2026  
**Status:** Concept / Pre-Development

---

## Table of Contents

1. [Product Concept](#1-product-concept)
2. [Core Use Cases](#2-core-use-cases)
3. [Full User Flow](#3-full-user-flow)
4. [Key Design Decisions & Recommendations](#4-key-design-decisions--recommendations)
5. [Smart Contract Architecture](#5-smart-contract-architecture)
6. [System Architecture](#6-system-architecture)
7. [Complete Tech Stack](#7-complete-tech-stack)
8. [Privacy Architecture](#8-privacy-architecture)
9. [Agent Lifecycle](#9-agent-lifecycle)
10. [Order Matching & Marketplace](#10-order-matching--marketplace)
11. [Escrow Logic & Release Conditions](#11-escrow-logic--release-conditions)
12. [Agent Movement System](#12-agent-movement-system)
13. [Price Volatility Handling](#13-price-volatility-handling)
14. [Crypto-for-Crypto Flow](#14-crypto-for-crypto-flow)
15. [Regulatory Considerations](#15-regulatory-considerations)
16. [Security Threat Model](#16-security-threat-model)
17. [Development Phases](#17-development-phases)
18. [Open Questions](#18-open-questions)

---

## 1. Product Concept

**P2P CubePay** is a 100% private, KYC-free peer-to-peer cryptocurrency exchange built on top of the AgentSphere + AR Viewer platform. It enables users to buy and sell cryptocurrencies for cash (via Revolut) or for other crypto, without a central intermediary, using augmented reality agents as the physical medium of transaction.

### Elevator Pitch

> Two strangers meet through an anonymous marketplace, match their buy/sell orders, and complete a crypto trade by physically interacting with an AR agent deployed at a GPS location — without ever revealing their identities, wallet addresses, or personal details to each other.

### Key Differentiators

| Feature                                    | P2P CubePay | Bisq    | Vexl     | LocalBitcoins |
| ------------------------------------------ | ----------- | ------- | -------- | ------------- |
| No KYC                                     | ✅          | ✅      | ✅       | ❌            |
| AR-based interaction                       | ✅          | ❌      | ❌       | ❌            |
| Physical location privacy (agent movement) | ✅          | ❌      | ❌       | ❌            |
| Agent-as-escrow                            | ✅          | ❌      | ❌       | ❌            |
| Multi-asset (ETH, USDC, stablecoins)       | ✅          | partial | BTC only | ✅            |
| On-chain privacy (Railgun)                 | ✅          | ❌      | ❌       | ❌            |
| Fiat via Revolut                           | ✅          | manual  | manual   | manual        |

---

## 2. Core Use Cases

### Use Case A — Crypto for Cash (Fiat Off-Ramp)

- **Bob** wants to sell ETH worth $10,000 for cash/Revolut
- **Alice** wants to buy $10,000 worth of ETH using her Revolut balance
- They meet anonymously via marketplace, complete trade via AR agent interaction

### Use Case B — Crypto for Crypto

- **Bob** wants to sell ETH, receive USDC
- **Alice** wants to sell USDC, receive ETH
- Fully on-chain, atomic swap via escrow contract — no fiat, no trust required

### Use Case C — Partial Order Matching

- **Alice** wants to buy $15,000 of ETH
- **Bob** can only supply $10,000
- System matches Alice with Bob ($10k) + another seller ($5k) — two separate agents, two separate trades running in parallel

---

## 3. Full User Flow

### 3.1 Bob (Seller) Flow

```
1. Bob opens P2P CubePay app (Deployment side)
2. Bob connects anonymously:
   - Option A: Generates ephemeral wallet (no email)
   - Option B: Anonymous email + wallet signature
3. Bob creates a sell order:
   - Asset: ETH
   - Amount: 10,000 USD equivalent
   - Payment method: Revolut (or USDC for crypto-for-crypto)
   - Price: market rate ± tolerance %
   - Agent name: (display name only, no PII)
   - Duration: how long the agent stays alive (e.g. 48 hours)
   - Radius: how far Alice can move the agent (e.g. 5km from deploy point)
   - Interaction types: Text chat, Voice (no video)
   - Revolut payment details: encrypted, only revealed to matched buyer
4. Bob's order goes into anonymous marketplace (encrypted)
5. Order matching happens — Alice is found
6. Bob receives notification: "Buyer found. Deploy your agent."
7. Bob physically goes to a location he chooses
8. App reads Bob's GPS location
9. App deploys:
   - EscrowContract on-chain (per trade)
   - AR Agent on Supabase with:
     - orderHash (keccak256 of trade params)
     - GPS coordinates
     - radius
     - expiry timestamp
     - allowed interaction types
     - encrypted Revolut details (only Alice can decrypt)
10. Bob transfers ETH to EscrowContract address
11. Contract confirms deposit → Agent becomes "active"
12. Alice is notified: agent is live, funds in escrow
```

### 3.2 Alice (Buyer) Flow

```
1. Alice opens P2P CubePay (Interaction side)
2. Alice connects anonymously (ephemeral wallet)
3. Alice browses marketplace:
   - Sees: asset, amount, price range, payment method, agent radius, duration
   - Does NOT see: Bob's identity, exact location, wallet address
4. Alice accepts Bob's offer → creates one-time receiving address (via Railgun)
5. Alice receives: orderHash + rough location area (not exact)
6. Alice decides to move the agent for safety:
   a. Alice opens map view, chooses new location within Bob's radius
   b. App constructs move message: {tradeId, newLat, newLng, timestamp}
   c. Alice signs message with her ephemeral wallet
   d. Server verifies signature + checks distance ≤ radius
   e. Agent position updates in Supabase → AR layer reflects new location
7. Alice physically goes to the new location
8. Alice opens AR camera view
9. App filters all visible agents → shows ONLY the agent matching orderHash
10. Alice sees Bob's agent in AR, walks up to it
11. Alice taps the agent → CubePay interface appears
12. Alice sees:
    - ETH balance in escrow (no wallet address shown)
    - Current ETH/USD price (with price lock timer: 10 minutes)
    - Payment method: Revolut
    - Amount due in USD
    - Bob's Revolut payment details (decrypted)
13. Alice makes Revolut payment
14. Alice taps "I've paid" in the app → sends signed payment confirmation
15. Bob receives notification: "Buyer says payment sent. Check Revolut."
16. Bob verifies Revolut receipt → taps "Confirm & Release"
17. Bob signs release transaction (MetaMask/wallet)
18. EscrowContract.release() → ETH sent to Alice's Railgun private address
19. Agent emits "trade complete" event → begins decay
20. Both parties receive receipt (on-chain tx hash, no PII)
21. Agent expires / is manually deleted by Bob
```

### 3.3 Dispute Flow

```
If Bob does NOT confirm within 24 hours after Alice's payment signal:
  → Alice can raise a dispute flag
  → V1: Manual support review (off-chain)
  → V2: Decentralized arbitration (3-of-5 arbitrators, staked)

If Alice does NOT pay before agent expiry:
  → EscrowContract auto-returns ETH to Bob after expiry timestamp
  → Agent decays automatically
```

---

## 4. Key Design Decisions & Recommendations

### ✅ Decision 1: Bob manually confirms receipt — NOT automated webhook

**Problem:** Revolut webhooks can fail, be delayed, or be reversed (chargebacks on bank transfers exist). Auto-releasing ETH on a webhook is a theft vector.

**Solution:** Revolut payment notification is **advisory only**. Bob must explicitly sign a release transaction after verifying his Revolut balance. This is the standard approach used by Bisq and LocalBitcoins.

```
Alice pays Revolut → Alice signals payment (signed)
  → Bob gets notified → Bob checks Revolut app
  → Bob signs release → Contract releases ETH
```

### ✅ Decision 2: Escrow contract, NOT ephemeral server wallet

**Problem:** If a server holds the private key to the escrow wallet, your platform is a custodian → regulatory/legal liability, single point of failure, hack risk.

**Solution:** Deploy a smart contract per trade. The contract address is the escrow. Bob sends ETH to the contract. Only Bob's signed `release()` call (or the auto-expiry fallback) moves funds.

### ✅ Decision 3: Agent hash as filter

Each agent gets a deterministic hash:

```
orderHash = keccak256(
  abi.encodePacked(
    sellerEphemeralAddress,
    assetAddress,
    amount,
    expiry,
    agentName
  )
)
```

Alice's AR viewer filters: `show only agents where agent.orderHash === expectedHash`

This means hostile/scam agents are invisible to Alice, even if they're physically at the same location.

### ✅ Decision 4: One-time address via Railgun

Alice's ETH destination is a Railgun private address — her real wallet is never exposed on-chain.

### ✅ Decision 5: Crypto-for-crypto uses atomic escrow

For USDC↔ETH trades: both parties deposit into the contract, which atomically swaps when both sides are confirmed. No Revolut, no trust, no dispute possible.

### ✅ Decision 6: 10-minute price lock

At the moment Alice initiates payment:

- Current ETH/USD price is fetched (Chainlink oracle)
- Price is locked for 10 minutes
- If price moves >2% during that window, trade can be cancelled
- Bob sets max acceptable slippage at order creation

---

## 5. Smart Contract Architecture

### 5.1 P2PEscrow.sol — Per-Trade Escrow Contract

```solidity
// Simplified interface
contract P2PEscrow {
    address public seller;           // Bob's ephemeral address
    address public buyer;            // Alice's ephemeral address
    address public asset;            // ETH (address(0)) or ERC-20
    uint256 public amount;           // amount in escrow
    uint256 public expiresAt;        // auto-refund after this timestamp
    bytes32 public orderHash;        // trade identifier
    bool    public released;
    bool    public refunded;

    // Railgun private address for Alice
    bytes   public buyerRailgunAddress;

    // Bob deposits ETH/tokens
    function deposit() external payable;

    // Bob confirms Revolut received → releases to Alice
    function release() external onlySeller;

    // Auto-refund to Bob if expired and not released
    function claimRefund() external onlySeller afterExpiry notReleased;

    // Dispute flag — suspends auto-refund, escalates
    function raiseDispute() external onlyBuyer;

    // Price lock validation (Chainlink)
    function validatePriceLock(uint256 lockedPrice, uint256 tolerance) external view;

    // Events
    event Deposited(address asset, uint256 amount);
    event Released(address to, uint256 amount);
    event Refunded(address to, uint256 amount);
    event DisputeRaised(address by, uint256 timestamp);
}
```

### 5.2 P2PEscrowFactory.sol — Deploys per-trade contracts

```solidity
contract P2PEscrowFactory {
    // Maps orderHash → escrow contract address
    mapping(bytes32 => address) public escrows;

    function createEscrow(
        bytes32 orderHash,
        address buyer,
        address asset,
        uint256 amount,
        uint256 duration,     // seconds
        bytes calldata buyerRailgunAddress
    ) external returns (address escrow);

    event EscrowCreated(bytes32 indexed orderHash, address escrow, address seller);
}
```

### 5.3 AtomicSwapEscrow.sol — Crypto-for-Crypto

```solidity
contract AtomicSwapEscrow {
    // Bob deposits ETH, Alice deposits USDC
    // When both deposited, atomically swap

    struct Side {
        address party;
        address asset;
        uint256 amount;
        bool deposited;
    }

    Side public sellerSide;
    Side public buyerSide;
    uint256 public expiresAt;

    function depositSeller() external payable;
    function depositBuyer(uint256 amount) external;
    function swap() internal; // called automatically when both sides ready
    function refundAll() external afterExpiry;
}
```

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         P2P CUBEPAY PLATFORM                            │
├─────────────────────┬───────────────────────────────────────────────────┤
│   DEPLOYMENT APP    │              INTERACTION APP                       │
│   (Bob - Seller)    │              (Alice - Buyer)                       │
│                     │                                                   │
│  • Order creation   │   • Marketplace browsing                          │
│  • Agent deployment │   • Order matching                                │
│  • GPS location     │   • AR viewer                                     │
│  • Escrow funding   │   • Agent hash filter                             │
│  • Release confirm  │   • Agent movement request                        │
│  • Agent deletion   │   • Revolut payment                               │
│                     │   • Payment signal                                │
└─────────┬───────────┴──────────────┬────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES (Supabase)                     │
│                                                                         │
│  • deployed_objects table (agents + metadata + orderHash + GPS)         │
│  • orders table (encrypted, matched pairs only)                         │
│  • trade_sessions table (active trades, status, expiry)                 │
│  • move_requests table (signed GPS movement instructions)               │
│  • Realtime subscriptions (agent position updates)                      │
│  • Edge Functions:                                                      │
│    - match-orders (anonymous order matching)                            │
│    - verify-move-request (signature + radius check)                     │
│    - notify-parties (payment signals, trade status)                     │
│    - agent-expiry-sweep (decay expired agents)                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
          ┌───────────────────┼────────────────────────────┐
          ▼                   ▼                            ▼
┌──────────────────┐ ┌─────────────────┐      ┌─────────────────────────┐
│  BLOCKCHAIN      │ │  CHAINLINK      │      │  RAILGUN                │
│  LAYER           │ │  ORACLES        │      │  PRIVACY LAYER          │
│                  │ │                 │      │                         │
│ P2PEscrowFactory │ │ ETH/USD Price   │      │ • Shield ETH (Bob)      │
│ P2PEscrow (×N)   │ │ Feed            │      │ • Private Receive (Alice)│
│ AtomicSwap (×N)  │ │ Price Lock      │      │ • Hide on-chain trail   │
│                  │ │ Validation      │      │ • PPOI compliance       │
│ Networks:        │ │                 │      │                         │
│ • Ethereum       │ └─────────────────┘      └─────────────────────────┘
│ • Hedera         │
│ • Base           │
│ • Polygon        │
└──────────────────┘
```

### 6.1 Data Flow — Fiat Trade (ETH for Revolut)

```
Bob creates order → encrypted in Supabase
    ↓
Matching engine finds Alice
    ↓
EscrowFactory.createEscrow() → new contract deployed
    ↓
Bob sends ETH to contract address
    ↓
Agent spawned in deployed_objects (orderHash, GPS, expiry, radius)
    ↓
Alice receives orderHash + location area
    ↓
Alice signs move request → server validates → agent moves
    ↓
Alice opens AR → camera filters by orderHash → sees Bob's agent
    ↓
Alice taps agent → CubePay UI → sees ETH balance, price lock, Revolut details
    ↓
Alice makes Revolut payment
    ↓
Alice signs paymentConfirmed message → server records
    ↓
Bob receives notification, checks Revolut
    ↓
Bob signs release() transaction
    ↓
EscrowContract → sends ETH to Alice's Railgun address
    ↓
Agent status = "complete" → decay begins
```

---

## 7. Complete Tech Stack

### 7.1 Frontend

| Technology            | Version | Usage                                                  |
| --------------------- | ------- | ------------------------------------------------------ |
| **React**             | 18.x    | UI framework for both deployment and interaction sides |
| **Vite**              | 6.x     | Build tool, dev server                                 |
| **React Three Fiber** | 8.x     | 3D agent rendering in AR viewport                      |
| **@react-three/drei** | latest  | 3D helpers: Html, Billboard, useGLTF                   |
| **Three.js**          | r160+   | 3D scene, geometry, materials                          |
| **Tailwind CSS**      | 3.x     | Utility-first styling                                  |
| **Radix UI**          | latest  | Accessible UI components                               |
| **Framer Motion**     | 11.x    | Animations, transitions                                |
| **Lucide React**      | latest  | Icons                                                  |
| **React Router**      | 6.x     | Client-side routing (Deployment ↔ Interaction)         |

### 7.2 AR / Camera Layer

| Technology                     | Usage                                                   |
| ------------------------------ | ------------------------------------------------------- |
| **React Three Fiber + Canvas** | Main 3D scene                                           |
| **Camera API (getUserMedia)**  | Live camera feed as AR background                       |
| **Geolocation API**            | GPS coordinates for agent placement and viewer position |
| **Device Orientation API**     | Camera AR alignment                                     |
| **Billboard component (drei)** | Labels always face camera                               |

### 7.3 Blockchain & Smart Contracts

| Technology                 | Usage                                          |
| -------------------------- | ---------------------------------------------- |
| **Solidity** ^0.8.24       | Smart contract language                        |
| **OpenZeppelin Contracts** | ReentrancyGuard, SafeERC20, Ownable, IERC20    |
| **Hardhat**                | Contract development, testing, deployment      |
| **ethers.js** v6           | Wallet connection, contract interaction        |
| **Chainlink Price Feeds**  | ETH/USD price oracle for price lock validation |
| **Chainlink CCIP**         | Cross-chain payments (future: cross-chain P2P) |
| **MetaMask / EIP-1193**    | Wallet provider                                |
| **WalletConnect**          | Mobile wallet support                          |
| **viem**                   | Alternative low-level EVM client (optional)    |

### 7.4 Privacy Layer

| Technology                                                | Usage                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| **Railgun**                                               | On-chain transaction privacy — shield/unshield ETH and ERC-20  |
| **Railgun SDK** (`@railgun-community/wallet`)             | Client-side shielding and private transfers                    |
| **PPOI (Private Proof of Innocence)**                     | Compliance note — proves funds are not from sanctioned sources |
| **ephemeral wallets** (ethers.js `Wallet.createRandom()`) | One-use identities for both parties                            |

### 7.5 Supported Networks

| Network          | Chain ID | Use Case                |
| ---------------- | -------- | ----------------------- |
| Ethereum Mainnet | 1        | Production ETH trades   |
| Ethereum Sepolia | 11155111 | Testnet development     |
| Base             | 8453     | Low-fee ETH/USDC trades |
| Base Sepolia     | 84532    | Testnet                 |
| Polygon          | 137      | Low-fee USDC trades     |
| Hedera EVM       | 295      | USDd stablecoin trades  |
| Hedera Testnet   | 296      | Testnet USDd trades     |

### 7.6 Backend & Database

| Technology                         | Usage                                                             |
| ---------------------------------- | ----------------------------------------------------------------- |
| **Supabase**                       | PostgreSQL database, Realtime subscriptions, Auth, Edge Functions |
| **Supabase Realtime**              | Agent position updates, trade status notifications                |
| **Supabase Edge Functions** (Deno) | Order matching, move request validation, expiry sweep             |
| **Supabase Row Level Security**    | Data isolation — parties only see their trade data                |
| **Supabase Storage**               | Encrypted agent metadata                                          |
| **PostgreSQL pgcrypto**            | Server-side encryption of sensitive order fields                  |

### 7.7 Fiat / Revolut Integration

| Technology               | Usage                                                          |
| ------------------------ | -------------------------------------------------------------- |
| **Revolut Merchant API** | Payment link generation, webhook for payment advisory signal   |
| **Revolut Business API** | P2P payment initiation (future: direct API-triggered payments) |
| **Revolut Webhooks**     | Advisory notification only — NOT used to auto-release escrow   |

### 7.8 Marketplace & Matching

| Technology                                  | Usage                                                     |
| ------------------------------------------- | --------------------------------------------------------- |
| **Supabase (encrypted columns)**            | Order book storage                                        |
| **pgcrypto symmetric encryption**           | Order details encrypted, only matched parties can decrypt |
| **Noise Protocol / Signal-style messaging** | End-to-end encrypted chat between matched parties (V2)    |
| **Anonymous auth**                          | Wallet signature as identity, no email required           |

### 7.9 Communication Between Parties (In-Agent)

| Technology    | Usage                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| **Text chat** | Via Supabase Realtime channels, E2E encrypted                                          |
| **Voice**     | WebRTC (peer-to-peer, no server relay) — via `simple-peer` or native RTCPeerConnection |
| **No video**  | Intentionally excluded for privacy                                                     |

### 7.10 Development & DevOps

| Technology                    | Usage                                             |
| ----------------------------- | ------------------------------------------------- |
| **Hardhat**                   | Contract compilation, testing, deployment scripts |
| **Hardhat Network**           | Local blockchain for testing                      |
| **OpenZeppelin Test Helpers** | Contract test utilities                           |
| **Chai + Mocha**              | Test framework                                    |
| **ngrok**                     | Local HTTPS tunnel for mobile AR testing          |
| **ESLint + Prettier**         | Code quality                                      |
| **Git + GitHub**              | Version control                                   |

### 7.11 Privacy & Security Tooling

| Technology       | Usage                                              |
| ---------------- | -------------------------------------------------- |
| **TweetNaCl.js** | Client-side encryption of Revolut details          |
| **eth-sig-util** | EIP-712 typed data signing for move requests       |
| **noble-curves** | Elliptic curve crypto for ephemeral key generation |

---

## 8. Privacy Architecture

### 8.1 What Bob Cannot See About Alice

- Alice's real wallet address (she uses Railgun private address)
- Alice's identity, name, Revolut details
- Alice's chosen meeting location (she moved the agent)
- Alice's device or IP address (front-end only, no server logging of IPs)

### 8.2 What Alice Cannot See About Bob

- Bob's real wallet address (escrow contract is the counterparty)
- Bob's exact original deployment location (after Alice moves agent)
- Bob's identity or personal details
- Bob's Revolut account details beyond what's needed to make payment

### 8.3 What the Platform Cannot See

- Contents of the trade (only encrypted blobs stored)
- Revolut payment details (encrypted with shared key derived from both ephemeral keys)
- Alice or Bob's real-world identity

### 8.4 On-Chain Privacy via Railgun

```
Bob's real wallet
  → shield ETH into Railgun pool
  → Railgun internal transfer to EscrowContract deposit address
  → (on-chain: escrow ← Railgun, no link to Bob's real wallet)

EscrowContract.release()
  → transfers ETH to Alice's Railgun shielded address
  → Alice unshields to her real wallet
  → (on-chain: Railgun pool → Alice's wallet, no link to escrow or Bob)
```

### 8.5 Agent Hash Privacy Filter

```javascript
// In AR Viewer — filter logic
const visibleAgents = allNearbyAgents.filter((agent) => {
  // Only show the agent whose hash matches the expected orderHash
  return agent.orderHash === expectedOrderHash;
});
```

This makes Bob's agent invisible to all observers except Alice (who has the `orderHash`).

---

## 9. Agent Lifecycle

```
State Machine:

CREATED ──────────────────────────────────────► EXPIRED (auto, no deposit)
   │
   │ Bob deposits ETH
   ▼
FUNDED ───────────────────────────────────────► EXPIRED (auto-refund after expiry)
   │
   │ Alice commits to trade
   ▼
ACTIVE (Alice can move agent, interact)
   │
   │ Alice signals payment
   ▼
PENDING_RELEASE
   │                        │
   │ Bob releases           │ Dispute raised
   ▼                        ▼
COMPLETE               DISPUTED ──► V1: Support │ V2: Arbitration
   │
   ▼
DECAYING (AR agent fades visually, removed from map)
   │
   ▼
DELETED (from deployed_objects)
```

### Agent Metadata Stored in Supabase `deployed_objects`

```json
{
  "id": "uuid",
  "orderHash": "0xabc...",
  "name": "Blue Agent #7",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "radius_km": 5,
  "expires_at": "2026-05-10T12:00:00Z",
  "status": "active",
  "asset": "ETH",
  "amount_usd": 10000,
  "payment_method": "revolut",
  "interaction_types": ["text", "voice"],
  "escrow_contract": "0x...",
  "encrypted_revolut_details": "encrypted_blob",
  "chain_id": 1,
  "created_at": "2026-05-08T12:00:00Z"
}
```

---

## 10. Order Matching & Marketplace

### 10.1 Anonymous Identity

Users authenticate with:

- **Ephemeral wallet** (generated on first open, stored locally) — preferred
- **Anonymous email + wallet signature** (optional, for notifications)

No name, no phone, no KYC.

### 10.2 Order Book Structure

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_type TEXT NOT NULL,        -- 'sell' or 'buy'
  asset TEXT NOT NULL,             -- 'ETH', 'USDC', etc.
  amount_usd DECIMAL NOT NULL,     -- target amount in USD
  price_tolerance_pct DECIMAL,     -- e.g. 2.0 = ±2%
  payment_method TEXT NOT NULL,    -- 'revolut', 'usdc', 'cash'
  region TEXT,                     -- optional: 'EU', 'UK', 'global'
  radius_km INTEGER,               -- how far agent can be moved
  duration_hours INTEGER,          -- agent lifetime
  interaction_types TEXT[],        -- ['text', 'voice']
  seller_pubkey TEXT,              -- ephemeral public key (for E2E encryption)
  status TEXT DEFAULT 'open',      -- 'open', 'matched', 'complete', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  -- All sensitive fields encrypted at rest
  encrypted_payment_details BYTEA
);
```

### 10.3 Matching Algorithm

```
For each new buy order:
  1. Find open sell orders where:
     - asset matches
     - payment_method compatible
     - price within tolerance
     - region compatible (if set)
     - order not expired
  2. If single match found → create trade_session
  3. If partial match (e.g. Alice needs $15k, Bob has $10k):
     → create trade_session for $10k
     → continue searching for remaining $5k
     → Alice gets list of agents to visit
```

---

## 11. Escrow Logic & Release Conditions

### 11.1 Normal Release (Bob confirms)

```
Preconditions:
  - Escrow is funded
  - Alice has signaled payment (signed message on-chain or Supabase)
  - Bob has verified Revolut receipt manually

Bob calls: escrow.release()
  → Checks: msg.sender === seller
  → Checks: not already released
  → Transfers asset to buyerRailgunAddress
  → Emits Released event
  → Agent status → "complete"
```

### 11.2 Auto-Refund (Expiry)

```
After expiresAt timestamp:
  → Anyone can call escrow.claimRefund() on Bob's behalf
  → OR Bob calls directly
  → Transfers asset back to seller
  → Agent status → "expired" → deleted
```

### 11.3 Dispute Handling (V1 — Manual)

```
Alice raises dispute flag:
  - Signed message: {tradeId, "dispute", timestamp, reason}
  - Suspends auto-refund for 72 hours
  - Both parties provide evidence to support (encrypted)
  - Support team reviews and triggers release or refund
```

### 11.4 Dispute Handling (V2 — Decentralized)

```
Arbitration pool:
  - 5 randomly selected arbitrators (staked token required)
  - 3-of-5 majority decides outcome
  - Losing party's portion covers arbitration fee
  - Fully on-chain outcome execution
```

---

## 12. Agent Movement System

### 12.1 How Alice Moves the Agent

1. Alice opens Map view in Interaction App
2. Alice sees circle: center = agent's current location, radius = Bob's set radius
3. Alice taps desired location within the circle
4. App constructs signed move request:

```typescript
const moveRequest = {
  tradeId: "0xabc...",
  newLat: 51.51,
  newLng: -0.12,
  timestamp: Date.now(),
  nonce: randomNonce(),
};

// EIP-712 typed data signing
const signature = await signer.signTypedData({
  domain: { name: "P2PCubePay", version: "1", chainId },
  types: { MoveRequest: [...fields] },
  message: moveRequest,
});
```

5. Signed request sent to Supabase Edge Function `verify-move-request`
6. Server verifies:
   - Signature is valid (ethers `verifyTypedData`)
   - Signer matches Alice's ephemeral address on record
   - `distance(original_location, new_location) <= radius`
   - Timestamp is recent (prevents replay attacks)
7. Server updates `deployed_objects.latitude/longitude`
8. Supabase Realtime broadcasts update
9. AR Viewer reflects new agent position

### 12.2 Why Server-Side Verification?

GPS cannot be verified on-chain in real-time. The server is the trusted verifier for the movement constraint. This is an acceptable trust assumption because:

- Bob sets the radius, the server enforces it
- Alice can't fake being inside the radius (she physically has to go there)
- The server only knows GPS coordinates, not Alice's identity

---

## 13. Price Volatility Handling

### 13.1 Price Lock Mechanism

```
At moment Alice initiates payment:
  1. Fetch ETH/USD from Chainlink price feed
  2. Record: lockedPrice, lockedAt (timestamp)
  3. Display to Alice: "Price locked for 10 minutes: $3,450.23"
  4. Show countdown timer in UI

If Alice pays within 10 minutes:
  → Trade proceeds at locked price
  → Amount of ETH in escrow must cover this at locked price

If price moves > Bob's tolerance (e.g. 2%) during lock:
  → Trade auto-cancels
  → ETH stays in escrow (Bob can create new order or manually release)
  → Alice is notified: "Price moved too much, trade cancelled"

If Alice doesn't pay within 10 minutes:
  → Lock expires
  → Alice must re-initiate with new price lock
```

### 13.2 On-Contract Price Validation

```solidity
// In P2PEscrow.sol
address public constant ETH_USD_FEED = 0x...; // Chainlink ETH/USD

function validateAndRelease(
    uint256 lockedPrice,
    uint256 toleranceBps  // e.g. 200 = 2%
) external onlySeller {
    AggregatorV3Interface feed = AggregatorV3Interface(ETH_USD_FEED);
    (, int256 currentPrice,,,) = feed.latestRoundData();

    uint256 diff = abs(currentPrice - lockedPrice);
    require(diff * 10000 / lockedPrice <= toleranceBps, "Price moved too much");

    _release();
}
```

---

## 14. Crypto-for-Crypto Flow

### 14.1 ETH ↔ USDC Atomic Swap

For the crypto-for-crypto use case, no Revolut is involved. The entire trade is on-chain:

```
Bob creates order: sell 3 ETH, want 10,000 USDC
Alice creates order: sell 10,000 USDC, want 3 ETH

Matching engine connects them → AtomicSwapEscrow deployed

Bob deposits 3 ETH → contract
Alice deposits 10,000 USDC → contract

Contract verifies both sides deposited → atomically:
  → Transfers 3 ETH to Alice's Railgun address
  → Transfers 10,000 USDC to Bob's Railgun address

No trust required. No Revolut. No manual confirmation.
```

### 14.2 Why This Is The Stronger Product

- Fully trustless — neither party can cheat
- No dispute possible (math is the arbiter)
- No fiat regulatory exposure
- No Revolut dependency
- Still uses AR agent as the interaction layer (differentiator remains)
- Alice still moves the agent for safety

---

## 15. Regulatory Considerations

### 15.1 Legal Positioning

P2P CubePay is a **protocol**, not an exchange:

- Does not custody funds (smart contract is the custodian)
- Does not facilitate KYC-required transactions
- Does not process payments (Revolut-to-Revolut is user-to-user)
- Is software that enables two consenting adults to transact

This is analogous to how Bisq, Uniswap, and other DEX protocols operate.

### 15.2 Jurisdictional Considerations

| Jurisdiction | Status | Notes                                            |
| ------------ | ------ | ------------------------------------------------ |
| EU (MiCA)    | Grey   | P2P not directly covered by MiCA if no custody   |
| UK           | Grey   | FCA classifies P2P as regulated in some forms    |
| US           | Red    | FinCEN may classify as MSB; avoid US users in V1 |
| Global       | Green  | Most jurisdictions allow P2P software            |

### 15.3 Platform Disclaimers Required

- Platform is software only, not a financial intermediary
- Users are responsible for compliance with local laws
- Platform does not guarantee Revolut payment completion
- Escrow releases only on seller's explicit confirmation
- No investment advice

---

## 16. Security Threat Model

| Threat                                                     | Mitigation                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Bob deploys agent, takes Revolut money, refuses to release | Alice raises dispute → V1: manual, V2: arbitration + fund seizure   |
| Alice makes Revolut payment then reverses it (chargeback)  | Bob manually confirms — he only releases after seeing cleared funds |
| Hostile agent at same location intercepts Alice            | Agent hash filter — Alice's app shows only Bob's agent              |
| Platform server hacked, agent positions leaked             | Only GPS coordinates stored — no PII, no wallet addresses           |
| Platform server hacked, Revolut details leaked             | Revolut details encrypted with E2E key — server can't decrypt       |
| Blockchain analysis links Bob and Alice                    | Railgun shields both sides — no on-chain link                       |
| Alice's GPS spoofed to fake radius compliance              | Server checks GPS, but combined with physical presence requirement  |
| Escrow contract bug drains funds                           | OpenZeppelin base, professional audit before mainnet                |
| Price manipulation attack                                  | Chainlink oracle (manipulation resistant), price lock window        |
| Replay attack on move request                              | Nonce + timestamp in signed message, server validates recency       |

---

## 17. Development Phases

### Phase 1 — Foundation (Months 1-2)

- [ ] Fork and merge AgentSphere + AR Viewer into single codebase
- [ ] Basic anonymous auth (ephemeral wallet)
- [ ] Order creation form (sell/buy, asset, amount, Revolut/crypto)
- [ ] Simple order matching (no encryption yet)
- [ ] `P2PEscrow.sol` contract (ETH only)
- [ ] `P2PEscrowFactory.sol`
- [ ] Agent deployment with orderHash and expiry
- [ ] Agent hash filter in AR viewer
- [ ] Manual release flow (Bob signs, Alice receives)
- [ ] Testnet deployment (Sepolia)

### Phase 2 — Privacy & Movement (Months 3-4)

- [ ] Railgun SDK integration (shield/unshield)
- [ ] Ephemeral wallet generation and storage
- [ ] E2E encrypted Revolut details sharing
- [ ] Agent movement system (signed GPS message + server validation)
- [ ] Radius enforcement
- [ ] Price lock with Chainlink oracle
- [ ] Revolut advisory webhook (notification only)
- [ ] Text chat between matched parties

### Phase 3 — Crypto-for-Crypto & Multi-asset (Months 5-6)

- [ ] `AtomicSwapEscrow.sol`
- [ ] USDC support on Ethereum, Base, Polygon
- [ ] USDd support on Hedera
- [ ] Partial order matching (split orders across multiple sellers)
- [ ] Voice chat (WebRTC)
- [ ] Agent decay animation in AR

### Phase 4 — Production & Arbitration (Months 7-9)

- [ ] Smart contract professional audit
- [ ] Mainnet deployment
- [ ] V1 dispute resolution (manual support)
- [ ] V2 arbitration design (decentralized)
- [ ] Mobile app (React Native or PWA)
- [ ] Multi-language support
- [ ] Agent discovery map (no sign-in required to browse)

---

## 18. Open Questions

1. **Agent private key generation**: Explored but recommended against — smart contract escrow is better. No ephemeral agent wallet needed.

2. **Revolut P2P vs Merchant API**: P2P Revolut transfers (user-to-user) are cleaner for privacy but harder to webhook. Merchant API requires a business account. Decision: use P2P transfers, with Alice making a standard Revolut transfer and Bob confirming manually.

3. **ZK Location Proofs**: Tools like zkLocation are emerging but not production-ready. V1 uses server-side GPS validation. V2 could use ZK proofs for radius compliance without revealing exact coordinates to the server.

4. **Railgun on Hedera**: Railgun currently supports Ethereum, Polygon, BNB, Arbitrum, Base. Hedera support is not confirmed — for Hedera trades, alternative privacy (e.g. mixers, confidential transactions) would be needed.

5. **Multi-agent Alice flow**: When Alice splits a $15k order across two sellers, she needs to visit two agent locations. UI/UX for managing multiple simultaneous trades needs design.

6. **Voice chat key exchange**: WebRTC for voice requires a signaling server. This server can see that two parties connected but not the voice content (SRTP encrypted). Acceptable trade-off for V1.

7. **Agent movement — Bob's awareness**: Should Bob know Alice moved the agent? Recommended: no. Bob only sees that the agent is "active" and funds are in escrow. The new location is private to Alice.

8. **Exchange rate source**: Chainlink for on-chain validation. CoinGecko or CryptoCompare for UI display. Both should show the same price to avoid confusion.

---

## References

- [Vexl — P2P Bitcoin trading without KYC](https://vexl.it/)
- [Bisq — Decentralized Bitcoin exchange](https://bisq.network/)
- [Railgun Privacy Protocol](https://www.railgun.org/)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds)
- [Chainlink CCIP](https://docs.chain.link/ccip)
- [Revolut Merchant API](https://developer.revolut.com/docs/merchant/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WebRTC for P2P Voice](https://webrtc.org/)
- [EIP-712 Typed Structured Data Signing](https://eips.ethereum.org/EIPS/eip-712)

---

**Document Version:** 1.0  
**Last Updated:** May 8, 2026  
**Status:** Pre-Development Specification
