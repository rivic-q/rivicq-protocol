// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PolygonBridge is ReentrancyGuard, Pausable, AccessControl {
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
        uint256 feePaid;
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
    mapping(address => bool) public verifiedWallets;
    
    uint256 public feeBasisPoints;
    uint256 public minTransferAmount;
    uint256 public maxTransferAmount;
    uint256 public fastConfirmations;
    
    address public feeCollector;
    
    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 destinationChainId,
        address token,
        uint256 feePaid
    );
    
    event TransferCompleted(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount,
        address token
    );
    
    event FastConfirmed(
        bytes32 indexed transferId,
        bytes32 indexed txHash,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        feeCollector = msg.sender;
        
        feeBasisPoints = 25;
        minTransferAmount = 1000;
        maxTransferAmount = 10_000_000_000 * 1e18;
        fastConfirmations = 1;
        
        supportedChains[1] = true;    // Ethereum
        supportedChains[137] = true;   // Polygon
        supportedChains[42161] = true; // Arbitrum
        supportedChains[10] = true;    // Optimism
    }

    function initiateCrossChainTransfer(
        address recipient,
        uint256 amount,
        uint256 destinationChainId,
        address token,
        bool useFastConfirmation
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(whitelistedTokens[token], "Token not supported");
        require(supportedChains[destinationChainId], "Chain not supported");
        require(amount >= minTransferAmount, "Amount too low");
        require(amount <= maxTransferAmount, "Amount too high");
        require(recipient != address(0), "Invalid recipient");

        uint256 fee = useFastConfirmation 
            ? (amount * (feeBasisPoints * 2)) / 10000 
            : (amount * feeBasisPoints) / 10000;
        uint256 netAmount = amount - fee;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                amount,
                destinationChainId,
                block.timestamp,
                block.chainid,
                token
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
            token: token,
            feePaid: fee
        });

        if (fee > 0) {
            IERC20(token).safeTransfer(feeCollector, fee);
        }

        emit TransferInitiated(
            transferId, 
            msg.sender, 
            recipient, 
            amount, 
            destinationChainId, 
            token,
            fee
        );

        return transferId;
    }

    function completeCrossChainTransfer(
        bytes32 transferId,
        address recipient,
        uint256 amount
    ) external nonReentrant onlyRole(RELAYER_ROLE) {
        Transfer storage transfer = transfers[transferId];
        require(transfer.status == TransferStatus.Initiated, "Invalid state");
        require(transfer.recipient == recipient, "Invalid recipient");

        transfer.status = TransferStatus.Completed;
        transfer.transactionHash = keccak256(
            abi.encodePacked(transferId, block.timestamp)
        );

        IERC20 token = IERC20(transfer.token);
        token.safeTransfer(recipient, amount);

        emit TransferCompleted(transferId, recipient, amount, transfer.token);
    }

    function fastConfirmTransfer(
        bytes32 transferId,
        bytes32 transactionHash
    ) external onlyRole(RELAYER_ROLE) {
        Transfer storage transfer = transfers[transferId];
        require(transfer.status == TransferStatus.Initiated, "Invalid state");
        
        transfer.status = TransferStatus.Confirmed;
        transfer.transactionHash = transactionHash;
        
        IERC20 token = IERC20(transfer.token);
        token.safeTransfer(transfer.recipient, transfer.amount);
        
        emit FastConfirmed(transferId, transactionHash, block.timestamp);
    }

    function cancelTransfer(bytes32 transferId) external nonReentrant {
        Transfer storage transfer = transfers[transferId];
        require(transfer.sender == msg.sender, "Not sender");
        require(transfer.status == TransferStatus.Initiated, "Cannot cancel");
        
        transfer.status = TransferStatus.Cancelled;
        
        IERC20 token = IERC20(transfer.token);
        token.safeTransfer(transfer.sender, transfer.amount + transfer.feePaid);
    }

    function verifyWallet(address wallet, bool verified) external onlyRole(COMPLIANCE_ROLE) {
        verifiedWallets[wallet] = verified;
    }

    function setFeeCollector(address _feeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }

    function setFee(uint256 _feeBasisPoints) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBasisPoints <= 200, "Fee too high");
        feeBasisPoints = _feeBasisPoints;
    }

    function addToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistedTokens[token] = true;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getTransferDetails(bytes32 transferId) external view returns (Transfer memory) {
        return transfers[transferId];
    }
}
