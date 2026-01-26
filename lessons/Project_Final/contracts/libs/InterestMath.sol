// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title InterestMath
/// @notice Thư viện tính lãi suất đơn giản theo basis points (bps)
/// @dev interest = principal * aprBps * tenorSeconds / (365 days * 10000)
library InterestMath {
    function simpleInterest(
        uint256 principal,
        uint256 aprBps,
        uint256 tenorSeconds
    ) internal pure returns (uint256) {
        if (principal == 0 || aprBps == 0 || tenorSeconds == 0) return 0;
        return (principal * aprBps * tenorSeconds) / (365 days * 10000);
    }
}
