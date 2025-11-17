import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { web3FromAddress } from '@polkadot/extension-dapp';

let apiInstance: ApiPromise | null = null;
let contractInstance: ContractPromise | null = null;

const WS_URL = import.meta.env.VITE_POLKADOT_WS || 'wss://rpc.polkadot.io';
const CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_ADDRESS as string | undefined;
const METADATA_URL = '/contracts/escrowcontract1_v6.json'; // place your contract metadata here

async function initApi(): Promise<ApiPromise> {
  if (!apiInstance) {
    const provider = new WsProvider(WS_URL);
    apiInstance = await ApiPromise.create({ provider });
  }
  return apiInstance;
}

async function loadMetadata(): Promise<any> {
  const res = await fetch(METADATA_URL);
  if (!res.ok) {
    throw new Error(`Contract metadata not found at ${METADATA_URL}. Place your ink! metadata JSON there.`);
  }
  return res.json();
}

export async function getContract(): Promise<ContractPromise> {
  if (contractInstance) return contractInstance;
  if (!CONTRACT_ADDRESS) throw new Error('VITE_ESCROW_ADDRESS is not set in your environment.');
  const [api, metadata] = await Promise.all([initApi(), loadMetadata()]);
  contractInstance = new ContractPromise(api, metadata, CONTRACT_ADDRESS);
  return contractInstance;
}

// Helpers
async function withSigner(address: string) {
  const injector = await web3FromAddress(address);
  return { signer: injector.signer };
}

function minutesToWeight(mins = 5) {
  // reasonable default weight for contracts on common Substrate chains
  // callers can pass options to override via params
  return undefined as any; // let api fill default
}

// Messages mapping (must match your ink! messages)
export const messages = {
  create_escrow: 'create_escrow',
  fund_escrow: 'fund_escrow',
  approve_transaction: 'approve_transaction',
  release_funds: 'release_funds',
  refund_buyer: 'refund_buyer',
  cancel_escrow: 'cancel_escrow',
  get_escrow_details: 'get_escrow_details',
  get_owner: 'get_owner',
  get_next_escrow_id: 'get_next_escrow_id',
} as const;

// Query (read-only)
export async function getNextEscrowId() {
  const contract = await getContract();
  const api = await initApi();
  const { result, output } = await contract.query[messages.get_next_escrow_id](
    undefined as any,
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) }
  );
  if (result.isErr) throw new Error(result.asErr.toString());
  return output?.toJSON() as number;
}

export async function getEscrowDetails(escrowId: number) {
  const contract = await getContract();
  const api = await initApi();
  const { result, output } = await contract.query[messages.get_escrow_details](
    undefined as any,
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) },
    escrowId
  );
  if (result.isErr) throw new Error(result.asErr.toString());
  return output?.toJSON();
}

// Transactions (state-changing)
export type EscrowAgreement = {
  land_id: string;
  nft_id: string | null;
  terms: string;
  inspection_deadline: number; // block number
  completion_deadline: number;  // block number
};

export async function createEscrow(params: {
  caller: string;
  seller: string;
  inspector: string | null;
  agreement: EscrowAgreement;
}) {
  const { caller, seller, inspector, agreement } = params;
  const contract = await getContract();
  const api = await initApi();
  const { signer } = await withSigner(caller);

  const tx = contract.tx[messages.create_escrow](
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) },
    seller,
    inspector,
    agreement
  );
  return tx.signAndSend(caller, { signer });
}

export async function fundEscrow(params: { caller: string; escrowId: number; value: bigint }) {
  const { caller, escrowId, value } = params;
  const contract = await getContract();
  const api = await initApi();
  const { signer } = await withSigner(caller);

  const tx = contract.tx[messages.fund_escrow](
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()), value },
    escrowId
  );
  return tx.signAndSend(caller, { signer });
}

export async function approveTransaction(params: { caller: string; escrowId: number }) {
  const { caller, escrowId } = params;
  const contract = await getContract();
  const api = await initApi();
  const { signer } = await withSigner(caller);

  const tx = contract.tx[messages.approve_transaction](
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) },
    escrowId
  );
  return tx.signAndSend(caller, { signer });
}

export async function releaseFunds(params: { caller: string; escrowId: number }) {
  const { caller, escrowId } = params;
  const contract = await getContract();
  const api = await initApi();
  const { signer } = await withSigner(caller);

  const tx = contract.tx[messages.release_funds](
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) },
    escrowId
  );
  return tx.signAndSend(caller, { signer });
}

export async function refundBuyer(params: { caller: string; escrowId: number }) {
  const { caller, escrowId } = params;
  const contract = await getContract();
  const api = await initApi();
  const { signer } = await withSigner(caller);

  const tx = contract.tx[messages.refund_buyer](
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) },
    escrowId
  );
  return tx.signAndSend(caller, { signer });
}

export async function cancelEscrow(params: { caller: string; escrowId: number }) {
  const { caller, escrowId } = params;
  const contract = await getContract();
  const api = await initApi();
  const { signer } = await withSigner(caller);

  const tx = contract.tx[messages.cancel_escrow](
    { gasLimit: api.registry.createType('WeightV2', minutesToWeight()) },
    escrowId
  );
  return tx.signAndSend(caller, { signer });
}
