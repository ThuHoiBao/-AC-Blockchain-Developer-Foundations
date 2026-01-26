// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import { SavingsTypes } from "./types/SavingsTypes.sol";
import { InterestMath } from "./libs/InterestMath.sol";
import { ValidationLib } from "./libs/ValidationLib.sol";
import { ISavingsPool } from "./interfaces/ISavingsPool.sol";

/**
 * @title SavingsPool
 * @dev Hệ thống tiết kiệm kỹ thuật số trên blockchain
 * Cho phép người dùng gửi tiền, nhận lãi, và rút tiền theo kỳ hạn
 */
contract SavingsPool is ERC721Enumerable, ERC721Burnable, Ownable, Pausable, ISavingsPool {
    IERC20 public token;
    
    // Tiêu chuẩn decimals
    uint8 public tokenDecimals;
    
    // Người nhận phí
    address public feeReceiver;
    
    // Kho dự trữ để trả lãi
    uint256 public vaultBalance;
    
    // Định danh cho lần tạo tiếp theo
    uint256 private nextDepositId = 1;
    
    // Định danh gói tiết kiệm tiếp theo
    uint256 private nextPlanId = 1;

    // ==================== Mappings ====================
    
    mapping(uint256 => SavingsTypes.SavingPlan) public plans;
    mapping(uint256 => SavingsTypes.Deposit) public deposits;
    mapping(address => uint256[]) public userDeposits;

    // ==================== Events ====================
    // Events are declared in ISavingsPool and inherited here.

    // ==================== Modifiers ====================
    
    modifier onlyDepositOwner(uint256 depositId) {
        require(deposits[depositId].owner == msg.sender, "Not deposit owner");
        _;
    }
    
    modifier validPlan(uint256 planId) {
        require(plans[planId].planId != 0, "Plan not found");
        require(plans[planId].enabled, "Plan is disabled");
        _;
    }

    // ==================== Constructor ====================
    
    constructor(
        address _token,
        uint8 _tokenDecimals,
        address _feeReceiver
        ) ERC721("SavingsCertificate", "SAVI") Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        require(_feeReceiver != address(0), "Invalid fee receiver");
        
        token = IERC20(_token);
        tokenDecimals = _tokenDecimals;
        feeReceiver = _feeReceiver;
    }

    // ==================== Admin Functions ====================
    
    /**
     * @dev Tạo gói tiết kiệm mới
     */
    function createPlan(
        uint256 tenorDays,
        uint256 aprBps,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 earlyWithdrawPenaltyBps
    ) external onlyOwner returns (uint256) {
        ValidationLib.validatePlanParams(tenorDays, aprBps, minDeposit, maxDeposit, earlyWithdrawPenaltyBps);
        
        uint256 planId = nextPlanId++;
        
        plans[planId] = SavingsTypes.SavingPlan({
            planId: planId,
            tenorDays: tenorDays,
            aprBps: aprBps,
            minDeposit: minDeposit,
            maxDeposit: maxDeposit,
            earlyWithdrawPenaltyBps: earlyWithdrawPenaltyBps,
            enabled: true,
            createdAt: block.timestamp
        });
        
        emit PlanCreated(planId, tenorDays, aprBps, minDeposit, maxDeposit);
        return planId;
    }

    /**
     * @dev Cập nhật gói tiết kiệm
     */
    function updatePlan(
        uint256 planId,
        uint256 aprBps,
        bool enabled
    ) external onlyOwner validPlan(planId) {
        ValidationLib.validateApr(aprBps);
        
        plans[planId].aprBps = aprBps;
        plans[planId].enabled = enabled;
        
        emit PlanUpdated(planId, aprBps, enabled);
    }

    /**
     * @dev Nạp tiền vào vault để trả lãi
     */
    function fundVault(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        vaultBalance += amount;
        emit VaultFunded(msg.sender, amount);
    }

    /**
     * @dev Rút tiền từ vault
     */
    function withdrawVault(uint256 amount) external onlyOwner {
        require(amount <= vaultBalance, "Insufficient vault balance");
        
        vaultBalance -= amount;
        require(token.transfer(feeReceiver, amount), "Transfer failed");
        
        emit VaultWithdrawn(feeReceiver, amount);
    }

    /**
     * @dev Đặt địa chỉ nhận phí
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid address");
        feeReceiver = _feeReceiver;
        emit FeeReceiverSet(_feeReceiver);
    }

    /**
     * @dev Tạm dừng hệ thống
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Mở lại hệ thống
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ==================== User Functions ====================

    /**
     * @dev Mở sổ tiết kiệm mới
     */
    function openDeposit(uint256 planId, uint256 amount) 
        external 
        validPlan(planId)
        whenNotPaused
        returns (uint256)
    {
        SavingsTypes.SavingPlan memory plan = plans[planId];
        
        ValidationLib.validateDepositAmount(amount, plan);
        
        // Chuyển token từ user vào contract
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        uint256 depositId = nextDepositId++;
        uint256 maturityAt = block.timestamp + (plan.tenorDays * 1 days);

        deposits[depositId] = SavingsTypes.Deposit({
            depositId: depositId,
            owner: msg.sender,
            planId: planId,
            principal: amount,
            startAt: block.timestamp,
            maturityAt: maturityAt,
            status: 0, // Active
            accruedInterest: 0
        });

        userDeposits[msg.sender].push(depositId);

        // Mint NFT cho deposit
        _safeMint(msg.sender, depositId);

        emit DepositOpened(depositId, msg.sender, planId, amount, maturityAt);
        return depositId;
    }

    /**
     * @dev Tính toán lãi dựa trên công thức simple interest
     * interest = principal * aprBps * tenorSeconds / (365 days * 10000)
     */
    function calculateInterest(uint256 depositId) 
        public 
        view 
        returns (uint256)
    {
        SavingsTypes.Deposit memory deposit = deposits[depositId];
        require(deposit.depositId != 0, "Deposit not found");

        SavingsTypes.SavingPlan memory plan = plans[deposit.planId];
        
        // Tính số giây
        uint256 tenorSeconds = plan.tenorDays * 1 days;
        // Sử dụng thư viện InterestMath để tính lãi đơn giản
        return InterestMath.simpleInterest(deposit.principal, plan.aprBps, tenorSeconds);
    }

    /**
     * @dev Rút tiền đúng hạn
     */
    function withdrawAtMaturity(uint256 depositId) 
        external 
        onlyDepositOwner(depositId)
        whenNotPaused
    {
        SavingsTypes.Deposit storage deposit = deposits[depositId];
        require(deposit.status == 0, "Deposit already processed");
        require(block.timestamp >= deposit.maturityAt, "Not yet matured");

        uint256 interest = calculateInterest(depositId);
        uint256 totalAmount = deposit.principal + interest;

        require(vaultBalance >= interest, "Insufficient vault balance");

        // Cập nhật trạng thái
        deposit.status = 1; // Withdrawn
        vaultBalance -= interest;

        // Chuyển tiền cho user
        require(token.transfer(msg.sender, totalAmount), "Transfer failed");

        emit Withdrawn(depositId, msg.sender, deposit.principal, interest, false);
    }

    /**
     * @dev Rút tiền trước hạn (chịu phạt)
     */
    function earlyWithdraw(uint256 depositId) 
        external 
        onlyDepositOwner(depositId)
        whenNotPaused
    {
            SavingsTypes.Deposit storage deposit = deposits[depositId];
        require(deposit.status == 0, "Deposit already processed");
        require(block.timestamp < deposit.maturityAt, "Already matured, use withdrawAtMaturity");

        SavingsTypes.SavingPlan memory plan = plans[deposit.planId];
        
        // Tính phạt: penalty = principal * penaltyBps / 10000
        uint256 penalty = (deposit.principal * plan.earlyWithdrawPenaltyBps) / 10000;
        uint256 amountToUser = deposit.principal - penalty;

        // Cập nhật trạng thái
        deposit.status = 1; // Withdrawn

        // Gửi phạt cho feeReceiver
        if (penalty > 0) {
            require(token.transfer(feeReceiver, penalty), "Penalty transfer failed");
        }

        // Gửi tiền gốc cho user
        require(token.transfer(msg.sender, amountToUser), "Transfer failed");

        emit Withdrawn(depositId, msg.sender, deposit.principal, 0, true);
    }

    /**
     * @dev Gia hạn sổ tiết kiệm
     */
    function renew(uint256 oldDepositId, uint256 newPlanId, bool includeInterest)
        external
        onlyDepositOwner(oldDepositId)
        validPlan(newPlanId)
        whenNotPaused
        returns (uint256)
    {
        SavingsTypes.Deposit storage oldDeposit = deposits[oldDepositId];
        require(oldDeposit.status == 0, "Deposit already processed");
        require(block.timestamp >= oldDeposit.maturityAt, "Not yet matured");

        // Tính lãi của sổ cũ
        uint256 interest = calculateInterest(oldDepositId);
        uint256 newPrincipal = includeInterest 
            ? oldDeposit.principal + interest 
            : oldDeposit.principal;

        // Kiểm tra vault có đủ lãi không (nếu includeInterest = true)
        if (includeInterest && interest > 0) {
            require(vaultBalance >= interest, "Insufficient vault balance");
            vaultBalance -= interest;
        }

        SavingsTypes.SavingPlan memory newPlan = plans[newPlanId];
        ValidationLib.validateDepositAmount(newPrincipal, newPlan);

        // Cập nhật sổ cũ
        oldDeposit.status = 2; // Renewed

        // Tạo sổ tiết kiệm mới
        uint256 newDepositId = nextDepositId++;
        uint256 newMaturityAt = block.timestamp + (newPlan.tenorDays * 1 days);

        deposits[newDepositId] = SavingsTypes.Deposit({
            depositId: newDepositId,
            owner: msg.sender,
            planId: newPlanId,
            principal: newPrincipal,
            startAt: block.timestamp,
            maturityAt: newMaturityAt,
            status: 0, // Active
            accruedInterest: 0
        });

        userDeposits[msg.sender].push(newDepositId);

        // Mint NFT cho deposit mới
        _safeMint(msg.sender, newDepositId);

        emit Renewed(oldDepositId, newDepositId, newPrincipal, msg.sender);
        return newDepositId;
    }

    // ==================== View Functions ====================

    /**
     * @dev Lấy thông tin gói tiết kiệm
     */
    function getPlan(uint256 planId) external view returns (SavingsTypes.SavingPlan memory) {
        return plans[planId];
    }

    /**
     * @dev Lấy thông tin sổ tiết kiệm
     */
    function getDeposit(uint256 depositId) external view returns (SavingsTypes.Deposit memory) {
        return deposits[depositId];
    }

    /**
     * @dev Lấy tất cả sổ tiết kiệm của một user
     */
    function getUserDeposits(address user) 
        external 
        view 
        returns (uint256[] memory)
    {
        return userDeposits[user];
    }

    /**
     * @dev Lấy số lượng sổ tiết kiệm của một user
     */
    function getUserDepositCount(address user) 
        external 
        view 
        returns (uint256)
    {
        return userDeposits[user].length;
    }

    /**
     * @dev Kiểm tra xem sổ tiết kiệm có đến hạn chưa
     */
    function isMatured(uint256 depositId) external view returns (bool) {
        return block.timestamp >= deposits[depositId].maturityAt;
    }

    // ==================== Required Overrides ====================

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
