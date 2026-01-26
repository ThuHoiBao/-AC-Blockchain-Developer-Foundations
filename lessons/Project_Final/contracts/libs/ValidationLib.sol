// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SavingsTypes } from "../types/SavingsTypes.sol";

/// @title ValidationLib
/// @notice Gom các kiểm tra đầu vào để tái sử dụng và giữ contract gọn gàng
library ValidationLib {
    function validatePlanParams(
        uint256 tenorDays,
        uint256 aprBps,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 earlyWithdrawPenaltyBps
    ) internal pure {
        require(tenorDays > 0, "Invalid tenor");
        require(aprBps > 0, "Invalid APR");
        require(minDeposit <= maxDeposit, "Invalid deposit limits");
        require(earlyWithdrawPenaltyBps <= 10000, "Penalty too high");
    }

    function validateApr(uint256 aprBps) internal pure {
        require(aprBps > 0, "Invalid APR");
    }

    function validateDepositAmount(
        uint256 amount,
        SavingsTypes.SavingPlan memory plan
    ) internal pure {
        require(amount >= plan.minDeposit, "Amount below minimum");
        require(amount <= plan.maxDeposit, "Amount exceeds maximum");
    }
}
