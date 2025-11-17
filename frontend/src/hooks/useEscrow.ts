import { useCallback, useEffect, useMemo, useState } from 'react';
import { createEscrow, fundEscrow, approveTransaction, releaseFunds, refundBuyer, cancelEscrow, getNextEscrowId, getEscrowDetails, EscrowAgreement } from '../contracts/escrow';
import { connectWallet } from '../wallet/polkadotConnector';

export type Account = { address: string; name?: string };

export function useEscrow() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const accs = await connectWallet();
      const mapped = accs.map(a => ({ address: a.address, name: a.meta?.name }));
      setAccounts(mapped);
      if (mapped.length > 0) setSelected(mapped[0].address);
    } catch (e: any) {
      setError(e?.message ?? 'Wallet connection failed');
    }
  }, []);

  const create = useCallback(async (seller: string, inspector: string | null, agreement: EscrowAgreement) => {
    if (!selected) throw new Error('No caller selected');
    setLoading(true);
    setError(null);
    try {
      return await createEscrow({ caller: selected, seller, inspector, agreement });
    } catch (e: any) {
      setError(e?.message ?? 'create_escrow failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const fund = useCallback(async (escrowId: number, valuePlanck: bigint) => {
    if (!selected) throw new Error('No caller selected');
    setLoading(true);
    setError(null);
    try {
      return await fundEscrow({ caller: selected, escrowId, value: valuePlanck });
    } catch (e: any) {
      setError(e?.message ?? 'fund_escrow failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const approve = useCallback(async (escrowId: number) => {
    if (!selected) throw new Error('No caller selected');
    setLoading(true);
    setError(null);
    try {
      return await approveTransaction({ caller: selected, escrowId });
    } catch (e: any) {
      setError(e?.message ?? 'approve_transaction failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const release = useCallback(async (escrowId: number) => {
    if (!selected) throw new Error('No caller selected');
    setLoading(true);
    setError(null);
    try {
      return await releaseFunds({ caller: selected, escrowId });
    } catch (e: any) {
      setError(e?.message ?? 'release_funds failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const refund = useCallback(async (escrowId: number) => {
    if (!selected) throw new Error('No caller selected');
    setLoading(true);
    setError(null);
    try {
      return await refundBuyer({ caller: selected, escrowId });
    } catch (e: any) {
      setError(e?.message ?? 'refund_buyer failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const cancel = useCallback(async (escrowId: number) => {
    if (!selected) throw new Error('No caller selected');
    setLoading(true);
    setError(null);
    try {
      return await cancelEscrow({ caller: selected, escrowId });
    } catch (e: any) {
      setError(e?.message ?? 'cancel_escrow failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const getNextId = useCallback(async () => {
    return await getNextEscrowId();
  }, []);

  const getDetails = useCallback(async (escrowId: number) => {
    return await getEscrowDetails(escrowId);
  }, []);

  return {
    // state
    accounts,
    selected,
    setSelected,
    loading,
    error,

    // actions
    connect,
    create,
    fund,
    approve,
    release,
    refund,
    cancel,
    getNextId,
    getDetails,
  } as const;
}
