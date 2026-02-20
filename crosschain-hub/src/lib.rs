use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::{clock::Clock, Sysvar},
};

pub mod arcium;
pub mod bridge;
pub mod eidas;
pub mod wallet;

pub use arcium::*;
pub use bridge::*;
pub use eidas::*;
pub use wallet::*;

#[cfg(test)]
mod tests;

solana_program::declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct CrossChainConfig {
    pub admin: Pubkey,
    pub bridge_authority: Pubkey,
    pub eidas_authority: Pubkey,
    pub arcium_program: Pubkey,
    pub supported_chains: Vec<u64>,
    pub min_cross_chain_amount: u64,
    pub max_cross_chain_amount: u64,
    pub fee_basis_points: u16,
    pub paused: bool,
}

impl Default for CrossChainConfig {
    fn default() -> Self {
        Self {
            admin: Pubkey::default(),
            bridge_authority: Pubkey::default(),
            eidas_authority: Pubkey::default(),
            arcium_program: Pubkey::default(),
            supported_chains: vec![1, 10, 42161],
            min_cross_chain_amount: 1000,
            max_cross_chain_amount: 1_000_000_000,
            fee_basis_points: 25,
            paused: false,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Default)]
pub struct CrossChainState {
    pub config: CrossChainConfig,
    pub total_volume: u64,
    pub total_transactions: u64,
    pub registered_wallets: u64,
    pub compliance_records: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum CrossChainInstruction {
    Initialize {
        config: CrossChainConfig,
    },
    UpdateConfig {
        config: CrossChainConfig,
    },
    RegisterWallet {
        wallet_data: wallet::WalletData,
    },
    SignTransaction {
        signature_data: wallet::TransactionSignatureData,
    },
    VerifyCompliance {
        compliance_data: eidas::ComplianceData,
    },
    InitiateCrossChain {
        transfer_data: bridge::CrossChainTransferData,
    },
    CompleteCrossChain {
        transfer_data: bridge::CrossChainTransferData,
    },
    CreateQualifiedSignature {
        signature_data: eidas::QualifiedSignatureData,
    },
    VerifyQualifiedSignature {
        signature_data: eidas::QualifiedSignatureData,
    },
    CreateTimeStamp {
        timestamp_data: eidas::TimestampData,
    },
    ProcessArciumTransaction {
        arcium_data: arcium::ArciumTransactionData,
    },
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    let instruction = CrossChainInstruction::try_from_slice(data)?;

    match instruction {
        CrossChainInstruction::Initialize { config } => initialize(program_id, accounts, config),
        CrossChainInstruction::UpdateConfig { config } => {
            update_config(program_id, accounts, config)
        }
        CrossChainInstruction::RegisterWallet { wallet_data } => {
            register_wallet(program_id, accounts, wallet_data)
        }
        CrossChainInstruction::SignTransaction { signature_data } => {
            sign_transaction(program_id, accounts, signature_data)
        }
        CrossChainInstruction::VerifyCompliance { compliance_data } => {
            verify_compliance(program_id, accounts, compliance_data)
        }
        CrossChainInstruction::InitiateCrossChain { transfer_data } => {
            initiate_cross_chain(program_id, accounts, transfer_data)
        }
        CrossChainInstruction::CompleteCrossChain { transfer_data } => {
            complete_cross_chain(program_id, accounts, transfer_data)
        }
        CrossChainInstruction::CreateQualifiedSignature { signature_data } => {
            create_qualified_signature(program_id, accounts, signature_data)
        }
        CrossChainInstruction::VerifyQualifiedSignature { signature_data } => {
            verify_qualified_signature_on_chain(program_id, accounts, signature_data)
        }
        CrossChainInstruction::CreateTimeStamp { timestamp_data } => {
            create_timestamp(program_id, accounts, timestamp_data)
        }
        CrossChainInstruction::ProcessArciumTransaction { arcium_data } => {
            process_arcium_transaction(program_id, accounts, arcium_data)
        }
    }
}

fn initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    config: CrossChainConfig,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let admin = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let state = CrossChainState {
        config: CrossChainConfig {
            admin: *admin.key,
            ..config
        },
        ..Default::default()
    };

    let rent = Rent::get()?;
    let space = state.try_to_vec()?.len();

    invoke(
        &system_instruction::create_account(
            admin.key,
            state_account.key,
            rent.minimum_balance(space),
            space as u64,
            program_id,
        ),
        &[admin.clone(), state_account.clone(), system_program.clone()],
    )?;

    state.serialize(&mut &mut state_account.data.borrow_mut()[..])?;

    msg!("Cross-chain hub initialized successfully");
    Ok(())
}

fn update_config(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    config: CrossChainConfig,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let admin = next_account_info(account_info_iter)?;

    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut state = CrossChainState::try_from_slice(&state_account.data.borrow())?;

    if state.config.admin != *admin.key {
        return Err(ProgramError::Custom(1));
    }

    state.config = config;
    state.serialize(&mut &mut state_account.data.borrow_mut()[..])?;

    msg!("Config updated successfully");
    Ok(())
}

fn register_wallet(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    wallet_data: WalletData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let wallet_account = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut state = CrossChainState::try_from_slice(&state_account.data.borrow())?;

    let wallet = Wallet {
        owner: *owner.key,
        created_at: Clock::get()?.unix_timestamp,
        is_compliance_verified: false,
        eidas_level: EidasLevel::None,
        public_key: wallet_data.public_key,
        metadata: wallet_data.metadata,
    };

    let rent = Rent::get()?;
    let space = wallet.try_to_vec()?.len();

    invoke(
        &system_instruction::create_account(
            owner.key,
            wallet_account.key,
            rent.minimum_balance(space),
            space as u64,
            program_id,
        ),
        &[
            owner.clone(),
            wallet_account.clone(),
            system_program.clone(),
        ],
    )?;

    wallet.serialize(&mut &mut wallet_account.data.borrow_mut()[..])?;

    state.registered_wallets += 1;
    state.serialize(&mut &mut state_account.data.borrow_mut()[..])?;

    msg!("Wallet registered successfully");
    Ok(())
}

fn sign_transaction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    signature_data: TransactionSignatureData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let wallet_account = next_account_info(account_info_iter)?;
    let signer = next_account_info(account_info_iter)?;

    if !signer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let wallet = Wallet::try_from_slice(&wallet_account.data.borrow())?;

    if wallet.owner != *signer.key {
        return Err(ProgramError::IncorrectProgramId);
    }

    if wallet.is_compliance_verified && wallet.eidas_level == EidasLevel::None {
        return Err(ProgramError::Custom(1001)); // Compliance required
    }

    msg!(
        "Transaction signed successfully for: {:?}",
        signature_data.transaction_hash
    );
    Ok(())
}

fn verify_compliance(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    compliance_data: ComplianceData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let wallet_account = next_account_info(account_info_iter)?;
    let verifier = next_account_info(account_info_iter)?;

    if !verifier.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let state = CrossChainState::try_from_slice(&state_account.data.borrow())?;

    if state.config.eidas_authority != *verifier.key {
        return Err(ProgramError::Custom(1));
    }

    let mut wallet = Wallet::try_from_slice(&wallet_account.data.borrow())?;

    wallet.is_compliance_verified = compliance_data.verified;
    wallet.eidas_level = compliance_data.eidas_level;

    wallet.serialize(&mut &mut wallet_account.data.borrow_mut()[..])?;

    msg!("Compliance verified: {:?}", compliance_data.verified);
    Ok(())
}

fn initiate_cross_chain(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    transfer_data: CrossChainTransferData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let sender_wallet = next_account_info(account_info_iter)?;
    let sender = next_account_info(account_info_iter)?;
    let _system_program = next_account_info(account_info_iter)?;

    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let state = CrossChainState::try_from_slice(&state_account.data.borrow())?;

    if state.config.paused {
        return Err(ProgramError::Custom(1002)); // Program paused
    }

    let wallet = Wallet::try_from_slice(&sender_wallet.data.borrow())?;

    if wallet.owner != *sender.key {
        return Err(ProgramError::IncorrectProgramId);
    }

    if transfer_data.amount < state.config.min_cross_chain_amount {
        return Err(ProgramError::Custom(1003)); // Amount too low
    }

    if transfer_data.amount > state.config.max_cross_chain_amount {
        return Err(ProgramError::Custom(1004)); // Amount too high
    }

    let fee = (transfer_data.amount as u128 * state.config.fee_basis_points as u128 / 10000) as u64;

    msg!(
        "Initiated cross-chain transfer: {} SOL to chain {} with fee {}",
        transfer_data.amount - fee,
        transfer_data.destination_chain,
        fee
    );

    Ok(())
}

fn complete_cross_chain(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    transfer_data: CrossChainTransferData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let recipient_account = next_account_info(account_info_iter)?;
    let authority = next_account_info(account_info_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let state = CrossChainState::try_from_slice(&state_account.data.borrow())?;

    if state.config.bridge_authority != *authority.key {
        return Err(ProgramError::Custom(1));
    }

    msg!(
        "Completed cross-chain transfer: {} to {}",
        transfer_data.amount,
        recipient_account.key
    );

    Ok(())
}

fn create_qualified_signature(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _signature_data: QualifiedSignatureData,
) -> ProgramResult {
    msg!("Creating eIDAS qualified signature");
    Ok(())
}

fn verify_qualified_signature_on_chain(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _signature_data: QualifiedSignatureData,
) -> ProgramResult {
    msg!("Verifying eIDAS qualified signature");
    Ok(())
}

fn create_timestamp(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _timestamp_data: TimestampData,
) -> ProgramResult {
    msg!("Creating eIDAS qualified timestamp");
    Ok(())
}

fn process_arcium_transaction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _arcium_data: ArciumTransactionData,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let state_account = next_account_info(account_info_iter)?;
    let arcium_program = next_account_info(account_info_iter)?;

    let state = CrossChainState::try_from_slice(&state_account.data.borrow())?;

    if state.config.arcium_program != *arcium_program.key {
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Processing Arcium encrypted transaction");
    Ok(())
}
