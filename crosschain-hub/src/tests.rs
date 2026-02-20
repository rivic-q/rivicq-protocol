#[cfg(test)]
mod test_functions {
    use crate::arcium::*;
    use crate::bridge::*;
    use crate::eidas::*;
    use crate::*;
    use borsh::BorshSerialize;
    use solana_program::pubkey::Pubkey;

    #[test]
    fn test_eidas_level_default() {
        let level = EidasLevel::None;
        assert_eq!(level, EidasLevel::None);
    }

    #[test]
    fn test_certificate_validation() {
        let cert = QualifiedCertificate {
            subject: "Test User".to_string(),
            issuer: "Test Authority".to_string(),
            serial_number: vec![1, 2, 3, 4],
            not_before: 0,
            not_after: 1000000000,
            public_key_hash: vec![],
            certificate_type: CertificateType::QES,
            country: "DE".to_string(),
            qscd: true,
        };

        let result = validate_certificate(&cert);
        assert!(result.is_ok());
    }

    #[test]
    fn test_certificate_expired() {
        let cert = QualifiedCertificate {
            subject: "Test User".to_string(),
            issuer: "Test Authority".to_string(),
            serial_number: vec![1, 2, 3, 4],
            not_before: 0,
            not_after: 100,
            public_key_hash: vec![],
            certificate_type: CertificateType::QES,
            country: "DE".to_string(),
            qscd: true,
        };

        let result = validate_certificate(&cert);
        assert!(result.is_err());
    }

    #[test]
    fn test_certificate_not_qscd() {
        let cert = QualifiedCertificate {
            subject: "Test User".to_string(),
            issuer: "Test Authority".to_string(),
            serial_number: vec![1, 2, 3, 4],
            not_before: 0,
            not_after: 1000000000,
            public_key_hash: vec![],
            certificate_type: CertificateType::QES,
            country: "DE".to_string(),
            qscd: false,
        };

        let result = validate_certificate(&cert);
        assert!(result.is_err());
    }

    #[test]
    fn test_restricted_jurisdiction() {
        assert!(check_restricted_jurisdiction("KP"));
        assert!(check_restricted_jurisdiction("IR"));
        assert!(check_restricted_jurisdiction("SY"));
        assert!(!check_restricted_jurisdiction("DE"));
        assert!(!check_restricted_jurisdiction("US"));
    }

    #[test]
    fn test_audit_log_creation() {
        let test_key = Pubkey::new_from_array([1u8; 32]);
        let log = create_audit_log(
            "TEST_ACTION".to_string(),
            test_key,
            "Test details".to_string(),
            "COMPLIANT".to_string(),
        );

        assert_eq!(log.action, "TEST_ACTION");
        assert_eq!(log.compliance_status, "COMPLIANT");
        assert!(!log.id.is_empty());
    }

    #[test]
    fn test_compliance_data_default() {
        let data = ComplianceData::default();
        assert_eq!(data.eidas_level, EidasLevel::None);
        assert!(!data.kyc_verified);
        assert!(!data.aml_screened);
        assert!(!data.verified);
    }

    #[test]
    fn test_wallet_default_config() {
        let config = WalletConfig::default();
        assert_eq!(config.min_balance, 0);
        assert_eq!(config.max_daily_transfer, u64::MAX);
        assert!(!config.require_eidas);
        assert!(!config.require_2fa);
    }

    #[test]
    fn test_bridge_config() {
        let config = BridgeConfig {
            min_confirmation_blocks: 12,
            max_confirmation_blocks: 100,
            relayer_fee: 1000,
            protocol_fee: 500,
            emergency_breaker: false,
            supported_tokens: vec![],
        };

        assert!(config.relayer_fee > 0);
        assert!(config.protocol_fee > 0);
        assert!(config.min_confirmation_blocks > 0);
    }

    #[test]
    fn test_cross_chain_fee_calculation() {
        let fee = calculate_cross_chain_fee(1_000_000, 25, 1000);
        assert!(fee > 0);

        let fee_no_relayer = calculate_cross_chain_fee(1_000_000, 25, 0);
        assert!(fee_no_relayer > 0);
    }

    #[test]
    fn test_arcium_config_default() {
        let config = ArciumConfig::default();
        assert!(config.encryption_enabled);
        assert!(config.proof_required);
        assert!(config.max_encrypted_state_size > 0);
    }

    #[test]
    fn test_validate_arcium_transaction() {
        let config = ArciumConfig {
            encryption_enabled: true,
            proof_required: true,
            ..Default::default()
        };

        let tx_data = ArciumTransactionData {
            encrypted_payload: vec![1, 2, 3, 4],
            ciphertext: vec![],
            proof: vec![1, 2, 3, 4],
            public_inputs: vec![],
            arcium_program_id: Pubkey::default(),
            encryption_public_key: vec![],
        };

        let result = validate_arcium_transaction(&tx_data, &config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_arcium_transaction_no_encryption() {
        let config = ArciumConfig {
            encryption_enabled: false,
            proof_required: false,
            ..Default::default()
        };

        let tx_data = ArciumTransactionData {
            encrypted_payload: vec![],
            ciphertext: vec![],
            proof: vec![],
            public_inputs: vec![],
            arcium_program_id: Pubkey::default(),
            encryption_public_key: vec![],
        };

        let result = validate_arcium_transaction(&tx_data, &config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_cross_chain_config_serialization() {
        let config = CrossChainConfig {
            admin: Pubkey::new_from_array([1u8; 32]),
            bridge_authority: Pubkey::new_from_array([2u8; 32]),
            eidas_authority: Pubkey::new_from_array([3u8; 32]),
            arcium_program: Pubkey::new_from_array([4u8; 32]),
            supported_chains: vec![1, 10, 42161],
            min_cross_chain_amount: 1000,
            max_cross_chain_amount: 1_000_000_000,
            fee_basis_points: 25,
            paused: false,
        };

        let serialized = config.try_to_vec().unwrap();
        let deserialized = CrossChainConfig::try_from_slice(&serialized).unwrap();

        assert_eq!(config.admin, deserialized.admin);
        assert_eq!(config.supported_chains, deserialized.supported_chains);
        assert_eq!(config.fee_basis_points, deserialized.fee_basis_points);
    }

    #[test]
    fn test_cross_chain_state_default() {
        let state = CrossChainState::default();
        assert_eq!(state.total_volume, 0);
        assert_eq!(state.total_transactions, 0);
        assert_eq!(state.registered_wallets, 0);
        assert_eq!(state.compliance_records, 0);
        assert!(!state.config.paused);
    }

    #[test]
    fn test_wallet_data_serialization() {
        let wallet_data = WalletData {
            public_key: vec![1, 2, 3, 4, 5],
            metadata: vec![6, 7, 8, 9, 10],
        };

        let serialized = wallet_data.try_to_vec().unwrap();
        let deserialized = WalletData::try_from_slice(&serialized).unwrap();

        assert_eq!(wallet_data.public_key, deserialized.public_key);
    }

    #[test]
    fn test_transaction_signature_data_serialization() {
        let sig_data = TransactionSignatureData {
            transaction_hash: vec![1u8; 32],
            amount: 1000,
            recipient: Pubkey::new_from_array([2u8; 32]),
            source_chain: 1,
            destination_chain: 10,
            nonce: 1,
        };

        let serialized = sig_data.try_to_vec().unwrap();
        let deserialized = TransactionSignatureData::try_from_slice(&serialized).unwrap();

        assert_eq!(sig_data.amount, deserialized.amount);
        assert_eq!(sig_data.source_chain, deserialized.source_chain);
    }
}
