// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SavingsTypes } from "../types/SavingsTypes.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISavingsPool {
    // Events
    event PlanCreated(
        uint256 indexed planId,
        uint256 tenorDays,
        uint256 aprBps,
        uint256 minDeposit,
        uint256 maxDeposit
    );

    event PlanUpdated(
        uint256 indexed planId,
        uint256 aprBps,
        bool enabled
    );

    event DepositOpened(
        uint256 indexed depositId,
        address indexed owner,
        uint256 indexed planId,
        uint256 principal,
        uint256 maturityAt
    );

    event Withdrawn(
        uint256 indexed depositId,
        address indexed owner,
        uint256 principal,
        uint256 interest,
        bool isEarly
    );

    event Renewed(
        uint256 indexed oldDepositId,
        uint256 indexed newDepositId,
        uint256 newPrincipal,
        address indexed owner
    );

    event VaultFunded(address indexed funder, uint256 amount);
    event VaultWithdrawn(address indexed recipient, uint256 amount);
    event FeeReceiverSet(address indexed newFeeReceiver);

    // Views
    function token() external view returns (IERC20);
    function tokenDecimals() external view returns (uint8);
    function feeReceiver() external view returns (address);
    function vaultBalance() external view returns (uint256);

    function getPlan(uint256 planId) external view returns (SavingsTypes.SavingPlan memory);
    function getDeposit(uint256 depositId) external view returns (SavingsTypes.Deposit memory);
    function getUserDeposits(address user) external view returns (uint256[] memory);
    function getUserDepositCount(address user) external view returns (uint256);
    function isMatured(uint256 depositId) external view returns (bool);
    function calculateInterest(uint256 depositId) external view returns (uint256);

    // Admin ops
    function createPlan(
        uint256 tenorDays,
        uint256 aprBps,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 earlyWithdrawPenaltyBps
    ) external returns (uint256);

    function updatePlan(uint256 planId, uint256 aprBps, bool enabled) external;

    function fundVault(uint256 amount) external;

    function withdrawVault(uint256 amount) external;

    function setFeeReceiver(address _feeReceiver) external;

    // User ops
    function openDeposit(uint256 planId, uint256 amount) external returns (uint256);

    function withdrawAtMaturity(uint256 depositId) external;

    function earlyWithdraw(uint256 depositId) external;

    function renew(uint256 oldDepositId, uint256 newPlanId, bool includeInterest) external returns (uint256);
}
