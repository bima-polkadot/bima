#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::new_without_default)]

#[ink::contract]
mod bima_escrow {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    // use ink::prelude::vec::Vec; // not used
    use ink::storage::Mapping;
    // StorageLayout will be derived via path-qualified derive when `std` is enabled

    /// Escrow status tracking
    #[derive(
        scale::Encode,
        scale::Decode,
        Debug,
        PartialEq,
        Eq,
        Copy,
        Clone,
        scale_info::TypeInfo,
    )]
    pub enum EscrowStatus {
        Created,
        Funded,
        Approved,
        Completed,
        Refunded,
        Cancelled,
        Disputed,

    /// Fee configuration for revenue sharing
    #[derive(
        Copy,
        scale_info::TypeInfo,
    )]
    pub struct FeeConfig {
        pub platform_fee_bps: u16,
        pub inspector_fee_bps: u16,
        pub platform_account: AccountId,
    }

    /// Escrow agreement details
    #[derive(
        scale::Encode,
        scale::Decode,
        Debug,
        Clone,
        scale_info::TypeInfo,
    )]
    pub struct EscrowAgreement {
        pub land_id: String,
        pub nft_id: Option<String>,
        pub terms: String,
        pub inspection_deadline: u32,
        pub completion_deadline: u32,
    }

    /// Main escrow structure
    #[derive(
        scale::Encode,
        scale::Decode,
        Debug,
        Clone,
        scale_info::TypeInfo,
    )]
    pub struct EscrowDetails {
        pub buyer: AccountId,
        pub seller: AccountId,
        pub inspector: Option<AccountId>,
        pub amount: Balance,
        pub status: EscrowStatus,
        pub agreement: EscrowAgreement,
        pub fee_config: FeeConfig,
        pub created_at: u32,
        pub funded: bool,
        pub dispute_reason: Option<String>,
    }

    /// Contract errors
    #[derive(
        scale::Encode,
        scale::Decode,
        Debug,
        PartialEq,
        Eq,
        Copy,
        Clone,
        scale_info::TypeInfo
    )]
    pub enum EscrowError {
        Unauthorized,
        InvalidAmount,
        InvalidState,
        AlreadyFunded,
        NotFunded,
        TransferFailed,
        DeadlinePassed,
        DeadlineNotReached,
        InvalidInspector,
        InvalidFeeConfig,
        EscrowNotFound,
    }

    pub type Result<T> = core::result::Result<T, EscrowError>;

    #[ink(event)]
    pub struct EscrowCreated {
        #[ink(topic)]
        pub escrow_id: u64,
        pub buyer: AccountId,
        pub seller: AccountId,
    }

    #[ink(event)]
    pub struct EscrowFunded {
        #[ink(topic)]
        pub escrow_id: u64,
        pub buyer: AccountId,
        pub amount: Balance,
    }

    #[ink(event)]
    pub struct EscrowCompleted {
        #[ink(topic)]
        pub escrow_id: u64,
        pub seller: AccountId,
        pub amount: Balance,
    }

    #[ink(storage)]
    pub struct BimaEscrow {
        // Store SCALE-encoded bytes to avoid StorageLayout requirements
        escrows: Mapping<u64, Vec<u8>>,
        next_escrow_id: u64,
        owner: AccountId,
        default_fees: FeeConfig,
    }

    impl BimaEscrow {
        #[ink(constructor)]
        pub fn new(platform_account: AccountId) -> Self {
            let caller = Self::env().caller();
            let default_fees = FeeConfig {
                platform_fee_bps: 250,
                inspector_fee_bps: 150,
                platform_account,
            };

            Self {
                escrows: Mapping::default(),
                next_escrow_id: 1,
                owner: caller,
                default_fees,
            }
        }

        #[ink(message)]
        pub fn create_escrow(
            &mut self,
            seller: AccountId,
            inspector: Option<AccountId>,
            agreement: EscrowAgreement,
        ) -> Result<u64> {
            let caller = Self::env().caller();
            let current_block = Self::env().block_number();

            if agreement.inspection_deadline <= current_block {
                return Err(EscrowError::DeadlinePassed);
            }

            let escrow_id = self.next_escrow_id;
            let escrow = EscrowDetails {
                buyer: caller,
                seller,
                inspector,
                amount: 0,
                status: EscrowStatus::Created,
                agreement,
                fee_config: self.default_fees,
                created_at: current_block,
                funded: false,
                dispute_reason: None,
            };

            self.escrows.insert(escrow_id, &escrow.encode());
            self.next_escrow_id = self.next_escrow_id.checked_add(1)
                .ok_or(EscrowError::InvalidState)?;

            Self::env().emit_event(EscrowCreated {
                escrow_id,
                buyer: caller,
                seller,
            });

            Ok(escrow_id)
        }

        #[ink(message, payable)]
        pub fn fund_escrow(&mut self, escrow_id: u64) -> Result<()> {
            let caller = Self::env().caller();
            let transferred = Self::env().transferred_value();

            if transferred == 0 {
                return Err(EscrowError::InvalidAmount);
            }

            let mut escrow: EscrowDetails = self
                .escrows
                .get(escrow_id)
                .and_then(|bytes| scale::Decode::decode(&mut &bytes[..]).ok())
                .ok_or(EscrowError::EscrowNotFound)?;

            if caller != escrow.buyer {
                return Err(EscrowError::Unauthorized);
            }

            if escrow.funded {
                return Err(EscrowError::AlreadyFunded);
            }

            escrow.amount = transferred;
            escrow.funded = true;
            escrow.status = EscrowStatus::Funded;

            self.escrows.insert(escrow_id, &escrow);

            Self::env().emit_event(EscrowFunded {
                escrow_id,
                buyer: caller,
                amount: transferred,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn approve_transaction(&mut self, escrow_id: u64) -> Result<()> {
            let caller = Self::env().caller();
            let mut escrow = self.escrows.get(escrow_id)
                .ok_or(EscrowError::EscrowNotFound)?;

            if escrow.inspector != Some(caller) {
                return Err(EscrowError::InvalidInspector);
            }

            if escrow.status != EscrowStatus::Funded {
                return Err(EscrowError::InvalidState);
            }

            escrow.status = EscrowStatus::Approved;
            self.escrows.insert(escrow_id, &escrow.encode());

            Ok(())
        }

        #[ink(message)]
        pub fn release_funds(&mut self, escrow_id: u64) -> Result<()> {
            let escrow: EscrowDetails = self
                .escrows
                .get(escrow_id)
                .and_then(|bytes| scale::Decode::decode(&mut &bytes[..]).ok())
                .ok_or(EscrowError::EscrowNotFound)?;

            if escrow.status != EscrowStatus::Approved {
                return Err(EscrowError::InvalidState);
            }

            let (seller_amount, platform_fee, inspector_fee) = self.calculate_payouts(&escrow);

            self.transfer_funds(escrow.seller, seller_amount)?;
            self.transfer_funds(escrow.fee_config.platform_account, platform_fee)?;

            if let Some(inspector) = escrow.inspector {
                self.transfer_funds(inspector, inspector_fee)?;
            }

            let mut updated_escrow = escrow;
            updated_escrow.status = EscrowStatus::Completed;
            self.escrows.insert(escrow_id, &updated_escrow.encode());

            Self::env().emit_event(EscrowCompleted {
                escrow_id,
                seller: updated_escrow.seller,
                amount: seller_amount,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn refund_buyer(&mut self, escrow_id: u64) -> Result<()> {
            let escrow = self.escrows.get(escrow_id)
                .ok_or(EscrowError::EscrowNotFound)?;
            let current_block = Self::env().block_number();

            let can_refund = escrow.status == EscrowStatus::Funded 
                && current_block > escrow.agreement.inspection_deadline;

            if !can_refund {
                return Err(EscrowError::InvalidState);
            }

            self.transfer_funds(escrow.buyer, escrow.amount)?;

            let mut updated_escrow = escrow;
            updated_escrow.status = EscrowStatus::Refunded;
            self.escrows.insert(escrow_id, &updated_escrow);

            Ok(())
        }

        #[ink(message)]
        pub fn cancel_escrow(&mut self, escrow_id: u64) -> Result<()> {
            let caller = Self::env().caller();
            let mut escrow = self.escrows.get(escrow_id)
                .ok_or(EscrowError::EscrowNotFound)?;

            if caller != escrow.buyer && caller != escrow.seller {
                return Err(EscrowError::Unauthorized);
            }

            if escrow.funded {
                return Err(EscrowError::InvalidState);
            }

            escrow.status = EscrowStatus::Cancelled;
            self.escrows.insert(escrow_id, &escrow);

            Ok(())
        }

        // Helper functions
        fn calculate_payouts(&self, escrow: &EscrowDetails) -> (Balance, Balance, Balance) {
            let denom: u128 = 10_000;
            let platform_fee = escrow
                .amount
                .saturating_mul(escrow.fee_config.platform_fee_bps as u128)
                / denom;
            let inspector_fee = escrow
                .amount
                .saturating_mul(escrow.fee_config.inspector_fee_bps as u128)
                / denom;
            let seller_amount = escrow
                .amount
                .saturating_sub(platform_fee)
                .saturating_sub(inspector_fee);

            (seller_amount, platform_fee, inspector_fee)
        }

        fn transfer_funds(&self, to: AccountId, amount: Balance) -> Result<()> {
            if Self::env().transfer(to, amount).is_err() {
                return Err(EscrowError::TransferFailed);
            }
            Ok(())
        }

        // Query functions
        #[ink(message)]
        pub fn get_escrow_details(&self, escrow_id: u64) -> Option<EscrowDetails> {
            self.escrows
                .get(escrow_id)
                .and_then(|bytes| scale::Decode::decode(&mut &bytes[..]).ok())
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        #[ink(message)]
        pub fn get_next_escrow_id(&self) -> u64 {
            self.next_escrow_id
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_create_escrow() {
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            let mut contract = BimaEscrow::new(accounts.alice);
            
            let agreement = EscrowAgreement {
                land_id: "LAND_123".to_string(),
                nft_id: Some("NFT_456".to_string()),
                terms: "Test terms".to_string(),
                inspection_deadline: 1000,
                completion_deadline: 2000,
            };

            let escrow_id = contract.create_escrow(
                accounts.bob,
                Some(accounts.charlie),
                agreement,
            ).unwrap();

            assert_eq!(escrow_id, 1);
        }
    }
}