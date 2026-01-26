// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SavingsTypes
/// @notice Các kiểu dữ liệu dùng chung cho hệ thống tiết kiệm
library SavingsTypes {
    /// @notice Thông tin gói tiết kiệm
    struct SavingPlan {
        uint256 planId;
        uint256 tenorDays;           // Kỳ hạn (ngày)
        uint256 aprBps;              // Lãi suất năm (basis points)
        uint256 minDeposit;          // Số tiền tối thiểu
        uint256 maxDeposit;          // Số tiền tối đa
        uint256 earlyWithdrawPenaltyBps; // Phạt rút trước hạn (bps)
        bool enabled;                // Trạng thái bật/tắt gói
        uint256 createdAt;           // Thời điểm tạo
    }

    /// @notice Thông tin sổ tiết kiệm
    struct Deposit {
        uint256 depositId;
        address owner;
        uint256 planId;
        uint256 principal;           // Tiền gốc
        uint256 startAt;             // Thời gian bắt đầu
        uint256 maturityAt;          // Thời gian đến hạn
        uint8 status;                // 0: Active, 1: Withdrawn, 2: Renewed
        uint256 accruedInterest;     // Lãi tích lũy (phục vụ rollover)
    }
}
