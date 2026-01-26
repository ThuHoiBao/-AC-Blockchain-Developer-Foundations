// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token cho testing
 * Gần giống USDC thực với 6 decimals
 */
contract MockUSDC is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {}

    /**
     * @dev Decimals = 6 (giống USDC thực)
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mint token mới (chỉ owner)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Mint token cho msg.sender
     */
    function mintSelf(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
