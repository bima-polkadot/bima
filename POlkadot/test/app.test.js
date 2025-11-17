import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import os from 'os';
import path from 'path';
import fs from 'fs';

import { createApp } from '../app.js';
import { createLandService } from '../landService.js';

// Helper to make a unique temp log file per test run
function makeTempLog(name) {
  const p = path.join(os.tmpdir(), `bima-verif-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  // Ensure it's absent
  try { fs.unlinkSync(p); } catch {}
  return p;
}

function makeMocks() {
  const calls = { createLandRecord: [], verifyLandRecord: [], mintLandNFT: [], createEscrowPurchase: [] };
  const substrateClient = {
    async createLandRecord(args) { calls.createLandRecord.push(args); return { ok: true, method: 'createLandRecord' }; },
    async verifyLandRecord(args) { calls.verifyLandRecord.push(args); return { ok: true, method: 'verifyLandRecord' }; },
    async mintLandNFT(args) { calls.mintLandNFT.push(args); return { ok: true, method: 'mintLandNFT', serial: 1 }; },
    async createEscrowPurchase(args) { calls.createEscrowPurchase.push(args); return { ok: true, method: 'createEscrowPurchase' }; },
  };
  const uploadToIPFS = {
    async uploadFileToIPFS() { return 'QmFileHash'; },
    async uploadJSONToIPFS() { return 'QmJsonHash'; },
  };
  return { substrateClient, uploadToIPFS, calls };
}

async function makeAppWithTempLog(tempLogPath) {
  const { substrateClient, uploadToIPFS, calls } = makeMocks();
  const landService = createLandService(tempLogPath);
  const app = createApp({ substrateClient, uploadToIPFS, landService });
  return { app, calls };
}

// Node test runner doesn't support top-level await with dynamic import inside function without marking tests async

test('POST /nft/create requires metadataHash', async () => {
  const temp = makeTempLog('require-metadata');
  const { app } = await makeAppWithTempLog(temp);
  const res = await request(app).post('/nft/create').send({});
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Metadata hash is required/i);
});

test('End-to-end: create -> verify twice -> auto-mint -> purchase allowed; purchase blocked before verification', async () => {
  const temp = makeTempLog('e2e');
  const { app, calls } = await makeAppWithTempLog(temp);

  // Create parcel A
  const createRes = await request(app).post('/nft/create').send({ metadataHash: 'QmCID_A', size: '100', price: '10', location: 'Nairobi' });
  assert.equal(createRes.status, 200);
  assert.equal(createRes.body.success, true);
  const landIdA = createRes.body.landId;
  assert.ok(landIdA);

  // Verify step 1: Chief
  const v1 = await request(app).post('/land/verify').send({ landId: landIdA, role: 'Chief', name: 'Alice' });
  assert.equal(v1.status, 200);
  assert.equal(v1.body.success, true);
  assert.equal(v1.body.verified, false);
  assert.equal(v1.body.status, 'pending');

  // Verify step 2: Surveyor triggers auto-mint
  const v2 = await request(app).post('/land/verify').send({ landId: landIdA, role: 'Surveyor', name: 'Bob' });
  assert.equal(v2.status, 200);
  assert.equal(v2.body.success, true);
  assert.equal(v2.body.verified, true);
  // After auto-mint, status should be 'minted'
  assert.equal(v2.body.status, 'minted');
  // Ensure mint was called
  assert.equal(calls.mintLandNFT.length >= 1, true);

  // Now purchase should be allowed
  const buy = await request(app).post('/market/purchase').send({ landId: landIdA, buyerId: 'buyer1', sellerId: 'seller1', priceDot: '10' });
  assert.equal(buy.status, 200);
  assert.equal(buy.body.success, true);

  // Create parcel B and try purchase before verification -> should fail
  const createB = await request(app).post('/nft/create').send({ metadataHash: 'QmCID_B' });
  const landIdB = createB.body.landId;
  const buyB = await request(app).post('/market/purchase').send({ landId: landIdB, buyerId: 'b2', sellerId: 's2', priceDot: '5' });
  assert.equal(buyB.status, 400);
  assert.match(buyB.body.error, /must be verified and minted/i);
});

test('GET /parcels returns items and supports status filter', async () => {
  const temp = makeTempLog('parcels');
  const { app } = await makeAppWithTempLog(temp);

  // Create two parcels
  const c1 = await request(app).post('/nft/create').send({ metadataHash: 'X1' });
  const id1 = c1.body.landId;
  const c2 = await request(app).post('/nft/create').send({ metadataHash: 'X2' });
  const id2 = c2.body.landId;

  // Approve id2 fully to get to minted
  await request(app).post('/land/verify').send({ landId: id2, role: 'Chief', name: 'A' });
  await request(app).post('/land/verify').send({ landId: id2, role: 'Surveyor', name: 'B' });

  const all = await request(app).get('/parcels');
  assert.equal(all.status, 200);
  assert.equal(all.body.count, 2);

  const pending = await request(app).get('/parcels').query({ status: 'pending' });
  assert.equal(pending.status, 200);
  // id1 still pending
  assert.equal(pending.body.items.some((x) => x.landId === id1), true);

  const minted = await request(app).get('/parcels').query({ status: 'minted' });
  assert.equal(minted.status, 200);
  assert.equal(minted.body.items.some((x) => x.landId === id2), true);
});
