# Contract metadata

Place your ink! contract metadata JSON here and name it `escrowcontract1_v6.json`.

How to get it:
- From your build artifacts, locate the generated `.contract` bundle for `escrowcontract1_v6`.
- Unzip or open it. Copy the `metadata.json` (or the whole JSON) and save it here as `escrowcontract1_v6.json`.

Frontend expects it at runtime via:
- Path: `/contracts/escrowcontract1_v6.json`

Also set environment variables for frontend:
- `VITE_POLKADOT_WS` (e.g. `wss://rpc.polkadot.io` or your local node ws)
- `VITE_ESCROW_ADDRESS` (the deployed contract address)
