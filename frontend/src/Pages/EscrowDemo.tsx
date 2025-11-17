import React, { useState } from 'react';
import { useEscrow } from '../hooks/useEscrow';

export default function EscrowDemo() {
  const {
    accounts,
    selected,
    setSelected,
    loading,
    error,
    connect,
    create,
    fund,
    approve,
    release,
    refund,
    cancel,
    getNextId,
    getDetails,
  } = useEscrow();

  const [seller, setSeller] = useState('');
  const [inspector, setInspector] = useState('');
  const [escrowId, setEscrowId] = useState<number | null>(null);
  const [valuePlanck, setValuePlanck] = useState<string>('10000000000'); // 1 DOT default
  const [agreement, setAgreement] = useState({
    land_id: 'LAND-001',
    nft_id: null as string | null,
    terms: 'Basic terms',
    inspection_deadline: 0,
    completion_deadline: 0,
  });

  const createEscrowUI = async () => {
    const next = await getNextId();
    await create(seller, inspector || null, {
      ...agreement,
      inspection_deadline: Number(agreement.inspection_deadline),
      completion_deadline: Number(agreement.completion_deadline),
    });
    // Typically the id returned by contract event would be `next`, but polkadot.js high-level tx doesn't return event here.
    // So we set it to previous `next` for quick testing.
    setEscrowId(next);
  };

  const fundUI = async () => {
    if (escrowId == null) return;
    await fund(escrowId, BigInt(valuePlanck));
  };

  const approveUI = async () => {
    if (escrowId == null) return;
    await approve(escrowId);
  };

  const releaseUI = async () => {
    if (escrowId == null) return;
    await release(escrowId);
  };

  const refundUI = async () => {
    if (escrowId == null) return;
    await refund(escrowId);
  };

  const cancelUI = async () => {
    if (escrowId == null) return;
    await cancel(escrowId);
  };

  const loadDetails = async () => {
    if (escrowId == null) return;
    const d = await getDetails(escrowId);
    alert(JSON.stringify(d, null, 2));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Escrow Demo</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={connect} disabled={loading}>Connect Wallet</button>
        {accounts.length > 0 && (
          <select value={selected ?? ''} onChange={(e) => setSelected(e.target.value)} style={{ marginLeft: 8 }}>
            {accounts.map((a) => (
              <option key={a.address} value={a.address}>{a.name ?? a.address}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
        <h3>Create Escrow</h3>
        <div>
          <label>Seller address: </label>
          <input value={seller} onChange={(e) => setSeller(e.target.value)} style={{ width: 400 }} />
        </div>
        <div>
          <label>Inspector (optional): </label>
          <input value={inspector} onChange={(e) => setInspector(e.target.value)} style={{ width: 400 }} />
        </div>
        <div>
          <label>Land ID: </label>
          <input value={agreement.land_id} onChange={(e) => setAgreement({ ...agreement, land_id: e.target.value })} />
        </div>
        <div>
          <label>Terms: </label>
          <input value={agreement.terms} onChange={(e) => setAgreement({ ...agreement, terms: e.target.value })} style={{ width: 400 }} />
        </div>
        <div>
          <label>Inspection deadline (block): </label>
          <input type="number" value={agreement.inspection_deadline} onChange={(e) => setAgreement({ ...agreement, inspection_deadline: Number(e.target.value) })} />
        </div>
        <div>
          <label>Completion deadline (block): </label>
          <input type="number" value={agreement.completion_deadline} onChange={(e) => setAgreement({ ...agreement, completion_deadline: Number(e.target.value) })} />
        </div>
        <button onClick={createEscrowUI} disabled={loading || !seller}>Create</button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
        <h3>Actions</h3>
        <div>
          <label>Escrow ID: </label>
          <input type="number" value={escrowId ?? ''} onChange={(e) => setEscrowId(Number(e.target.value))} />
        </div>
        <div>
          <label>Fund value (planck): </label>
          <input value={valuePlanck} onChange={(e) => setValuePlanck(e.target.value)} />
          <button onClick={fundUI} disabled={loading || escrowId == null}>Fund</button>
        </div>
        <div>
          <button onClick={approveUI} disabled={loading || escrowId == null}>Approve</button>
          <button onClick={releaseUI} disabled={loading || escrowId == null}>Release</button>
          <button onClick={refundUI} disabled={loading || escrowId == null}>Refund</button>
          <button onClick={cancelUI} disabled={loading || escrowId == null}>Cancel</button>
          <button onClick={loadDetails} disabled={loading || escrowId == null}>Get Details</button>
        </div>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
