import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadFileToIPFS, uploadJSONToIPFS } from './uploadToIPFS.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { loadVerificationLog, saveVerificationLog, getLandEntryById, applyApproval } from './landService.js';
import { createLandRecord, verifyLandRecord, mintLandNFT, createEscrowPurchase } from './substrateClient.js';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// Health Check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ipfs: process.env.PINATA_API_KEY ? 'configured' : 'not configured',
      polkadot: process.env.POLKADOT_WS ? 'configured' : 'not configured'
    }
  });
});

// IPFS: Upload a file
app.post('/ipfs/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ipfsHash = await uploadFileToIPFS(req.file.path);
    fs.unlinkSync(req.file.path); // Cleanup temp
    res.json({ ipfsHash, status: 'success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// IPFS: Upload metadata JSON
app.post('/ipfs/upload-json', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) return res.status(400).json({ error: 'No JSON data' });
    const ipfsHash = await uploadJSONToIPFS(req.body);
    res.json({ ipfsHash, status: 'success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helpers for safe JSON file I/O
function loadJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// POST /listings: Create listing referencing metadata
app.post('/listings', async (req, res) => {
  try {
    const { metadataHash, sellerId } = req.body;
    if (!metadataHash || !sellerId) {
      return res.status(400).json({ error: 'Both metadataHash and sellerId required' });
    }
    // Simple log (JSON file-based)
    const listingsFile = path.join(process.cwd(), 'listings-log.json');
    let data = loadJsonSafe(listingsFile);
    const record = {
      listingId: Date.now(),
      metadataHash,
      sellerId,
      status: 'pending_verification',
      createdAt: new Date().toISOString()
    };
    data.push(record);
    saveJson(listingsFile, data);
    res.json({ listingId: record.listingId, status: record.status, message: 'Listing created successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NFT Routes
app.post('/nft/create', upload.array('documents'), async (req, res) => {
  try {
    const { metadataHash, size, price, location } = req.body;
    
    if (!metadataHash) {
      return res.status(400).json({ error: 'Metadata hash is required' });
    }

    // Load the verification log safely
    const verificationLog = loadVerificationLog();
    
    // Create a new land entry
    const landEntry = {
      landId: Date.now(), // Use timestamp as temporary ID
      size,
      price,
      location,
      metadataHash,
      approvals: [],
      verified: false,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // Add to verification log
    verificationLog.push(landEntry);
    saveVerificationLog(verificationLog);

    // Try to submit to Substrate registry pallet (best-effort)
    let chain = null;
    try {
      chain = await createLandRecord({
        landId: landEntry.landId,
        owner: null,
        ipfsCid: metadataHash,
        geoHash: null
      });
    } catch (e) {
      chain = { error: e?.message || String(e) };
    }

    // Return the land entry ID for tracking
    res.json({ 
      success: true, 
      landId: landEntry.landId,
      message: 'Land parcel submitted for verification',
      chain
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/nft/mint', async (req, res) => {
  try {
    const { landId, metadataHash } = req.body || {};
    if (!landId || !metadataHash) {
      return res.status(400).json({ error: 'landId and metadataHash are required' });
    }
    const result = await mintLandNFT({ landId, metadataCid: metadataHash });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verification: record an approval and auto-mint if now verified
app.post('/land/verify', async (req, res) => {
  try {
    const { landId, role, name, did } = req.body || {};
    if (!landId || !role || !name) {
      return res.status(400).json({ error: 'landId, role, and name are required' });
    }
    if (!['Chief', 'Surveyor'].includes(role)) {
      return res.status(400).json({ error: "role must be 'Chief' or 'Surveyor'" });
    }
    const log = loadVerificationLog();
    const entry = getLandEntryById(log, landId);
    if (!entry) return res.status(404).json({ error: 'Land entry not found' });

    applyApproval(entry, role, name);

    // Best-effort on-chain verification record when DID provided
    let chainVerify = null;
    if (did) {
      try {
        chainVerify = await verifyLandRecord({ landId, role, did });
      } catch (e) {
        chainVerify = { error: e?.message || String(e) };
      }
    }
    let autoMint = null;
    if (entry.verified && !entry.nftMinted) {
      try {
        autoMint = await mintLandNFT({ landId, metadataCid: entry.metadataHash });
        entry.nftMinted = true;
        entry.nftSerial = autoMint?.serial || null;
        entry.status = 'minted';
      } catch (e) {
        autoMint = { error: e?.message || String(e) };
      }
    }
    saveVerificationLog(log);
    res.json({ success: true, verified: entry.verified, status: entry.status, autoMint, chainVerify });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Browse parcels: optional status filter (pending, approved, minted)
app.get('/parcels', async (req, res) => {
  try {
    const { status } = req.query;
    const log = loadVerificationLog();
    const filtered = status ? log.filter((e) => e.status === status) : log;
    res.json({ count: filtered.length, items: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase: on-chain escrow via pallet
app.post('/market/purchase', async (req, res) => {
  try {
    const { landId, buyerId, sellerId, priceDot } = req.body || {};
    if (!landId || !buyerId || !sellerId || !priceDot) {
      return res.status(400).json({ error: 'landId, buyerId, sellerId, priceDot are required' });
    }
    const log = loadVerificationLog();
    const entry = getLandEntryById(log, landId);
    if (!entry || !entry.verified || !entry.nftMinted) {
      return res.status(400).json({ error: 'Parcel must be verified and minted before purchase' });
    }

    const result = await createEscrowPurchase({ landId, buyer: buyerId, seller: sellerId, price: priceDot });

    entry.status = 'sold';
    entry.soldAt = new Date().toISOString();
    entry.buyerId = buyerId;
    saveVerificationLog(log);

    res.json({ success: true, chain: result, landId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// (removed legacy CLI-bridge /land/verify route)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});