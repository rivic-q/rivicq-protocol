// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CrossChainBridge is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    struct Transfer {
        address sender;
        address recipient;
        uint256 amount;
        uint256 destinationChainId;
        uint256 sourceChainId;
        bytes32 transactionHash;
        TransferStatus status;
        uint256 timestamp;
        address token;
    }

    enum TransferStatus {
        Pending,
        Initiated,
        Confirmed,
        Completed,
        Failed,
        Cancelled
    }

    mapping(bytes32 => Transfer) public transfers;
    mapping(address => bool) public whitelistedTokens;
    mapping(uint256 => bool) public supportedChains;
    mapping(address => bool) public eidasVerifiedWallets;
    
    uint256 public feeBasisPoints;
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    
    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 destinationChainId,
        address token
    );
    
    event TransferCompleted(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        address token
    );
    
    event ComplianceVerified(
        address indexed wallet,
        bool verified,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        feeBasisPoints = 25;
        minTransferAmount = 1000;
        maxTransferAmount = 1_000_000_000 * 1e18;
        
        supportedChains[1] = true;    // Ethereum Mainnet
        supportedChains[137] = true;  // Polygon
        supportedChains[5] = true;    // Goerli Testnet
        supportedChains[80001] = true; // Mumbai Testnet
    }

    function initiateCrossChainTransfer(
        address recipient,
        uint256 amount,
        uint256 destinationChainId,
        address token
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(whitelistedTokens[token], "Token not whitelisted");
        require(supportedChains[destinationChainId], "Chain not supported");
        require(amount >= minTransferAmount, "Amount too low");
        require(amount <= maxTransferAmount, "Amount too high");
        require(recipient != address(0), "Invalid recipient");

        uint256 fee = (amount * feeBasisPoints) / 10000;
        uint256 netAmount = amount - fee;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                amount,
                destinationChainId,
                block.timestamp,
                block.chainid
            )
        );

        transfers[transferId] = Transfer({
            sender: msg.sender,
            recipient: recipient,
            amount: netAmount,
            destinationChainId: destinationChainId,
            sourceChainId: block.chainid,
            transactionHash: bytes32(0),
            status: TransferStatus.Initiated,
            timestamp: block.timestamp,
            token: token
        });

        emit TransferInitiated(transferId, msg.sender, recipient, amount, destinationChainId, token);

        return transferId;
    }

    function completeCrossChainTransfer(
        bytes32 transferId,
        address recipient,
        uint256 amount,
        bytes32 transactionHash
    ) external nonReentrant onlyRole(RELAYER_ROLE) {
        Transfer storage transfer = transfers[transferId];
        require(transfer.status == TransferStatus.Initiated, "Invalid transfer state");
        require(transfer.recipient == recipient, "Invalid recipient");

        transfer.status = TransferStatus.Completed;
        transfer.transactionHash = transactionHash;

        IERC20 token = IERC20(transfer.token);
        token.safeTransfer(recipient, amount);

        emit TransferCompleted(transferId, recipient, amount, transfer.token);
    }

    function verifyCompliance(address wallet, bool verified) external onlyRole(COMPLIANCE_ROLE) {
        eidasVerifiedWallets[wallet] = verified;
        emit ComplianceVerified(wallet, verified, block.timestamp);
    }

    function setFeeBasisPoints(uint256 _feeBasisPoints) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBasisPoints <= 100, "Fee too high");
        feeBasisPoints = _feeBasisPoints;
    }

    function setTransferLimits(uint256 _min, uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_min < _max, "Invalid limits");
        minTransferAmount = _min;
        maxTransferAmount = _max;
    }

    function addSupportedChain(uint256 chainId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[chainId] = true;
    }

    function removeSupportedChain(uint256 chainId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedChains[chainId] = false;
    }

    function whitelistToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistedTokens[token] = true;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getTransfer(bytes32 transferId) external view returns (Transfer memory) {
        return transfers[transferId];
    }
}
