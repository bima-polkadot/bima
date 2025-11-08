import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';

let api = null;
let signer = null;

export async function getApi() {
  if (api) return api;
  const ws = process.env.POLKADOT_WS || 'wss://rpc.polkadot.io';
  const provider = new WsProvider(ws);
  api = await ApiPromise.create({ provider });
  return api;
}

async function getSigner() {
  if (signer) return signer;
  const seed = process.env.SR25519_SEED;
  if (!seed) return null;
  const kr = new Keyring({ type: 'sr25519' });
  signer = kr.addFromUri(seed);
  return signer;
}

// Submit extrinsic. If SR25519_SEED configured, sign and send; else send unsigned (best-effort).
async function submitExtrinsic(extrinsic) {
  const api = await getApi();
  const s = await getSigner();
  return new Promise((resolve, reject) => {
    const cb = ({ status, dispatchError, txHash, events }) => {
      if (dispatchError) {
        const msg = dispatchError.isModule ? dispatchError.asModule.toString() : dispatchError.toString();
        reject(new Error(msg));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve({ txHash: txHash?.toString?.() || null, status: status.type, events });
      }
    };
    (s ? extrinsic.signAndSend(s, cb) : extrinsic.send(cb)).catch(reject);
  });
}

export async function createLandRecord({ landId, owner, ipfsCid, geoHash }) {
  const api = await getApi();
  const pallet = api.tx?.bimaTitles;
  if (!pallet?.createLandRecord) return { skipped: true, reason: 'bimaTitles.createLandRecord not found' };
  const extrinsic = pallet.createLandRecord(landId, owner || null, ipfsCid, geoHash || null);
  return submitExtrinsic(extrinsic);
}

export async function verifyLandRecord({ landId, role, did }) {
  const api = await getApi();
  const pallet = api.tx?.bimaVerification;
  if (!pallet?.approve) return { skipped: true, reason: 'bimaVerification.approve not found' };
  const extrinsic = pallet.approve(landId, role, did || null);
  return submitExtrinsic(extrinsic);
}

export async function mintLandNFT({ landId, metadataCid }) {
  const api = await getApi();
  const pallet = api.tx?.bimaNft;
  if (!pallet?.mintLandNft) return { skipped: true, reason: 'bimaNft.mintLandNft not found' };
  const extrinsic = pallet.mintLandNft(landId, metadataCid);
  return submitExtrinsic(extrinsic);
}

export async function transferOwnership({ landId, newOwner }) {
  const api = await getApi();
  const pallet = api.tx?.bimaTitles;
  if (!pallet?.transferOwnership) return { skipped: true, reason: 'bimaTitles.transferOwnership not found' };
  const extrinsic = pallet.transferOwnership(landId, newOwner);
  return submitExtrinsic(extrinsic);
}

export async function createEscrowPurchase({ landId, buyer, seller, price }) {
  const api = await getApi();
  const pallet = api.tx?.bimaEscrow;
  if (!pallet?.purchase) return { skipped: true, reason: 'bimaEscrow.purchase not found' };
  const extrinsic = pallet.purchase(landId, buyer, seller, price);
  return submitExtrinsic(extrinsic);
}
