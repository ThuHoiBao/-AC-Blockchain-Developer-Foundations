import { expect } from "chai";
import { ethers } from "hardhat";
// Nếu vẫn lỗi import, hãy thử chạy: npx hardhat compile để nó tạo type

describe("MyMintableToken", function () {
    let token: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        const MyMintableToken = await ethers.getContractFactory("MyMintableToken");
        token = await MyMintableToken.deploy();
        // Trong Ethers v6, waitForDeployment() thay cho deployed()
        await token.waitForDeployment(); 

        [owner, addr1] = await ethers.getSigners();
    });

    it("✅ Should have correct token name", async function () {
        expect(await token.name()).to.equal("MyMintableToken");
    });

    it("✅ Should have correct token symbol", async function () {
        expect(await token.symbol()).to.equal("MMT");
    });

    it("✅ Owner should be able to mint", async function () {
        // SỬA: Bỏ .utils cho Ethers v6
        const mintAmount = ethers.parseEther("1000"); 
        await token.mint(owner.address, mintAmount);

        const balance = await token.balanceOf(owner.address);
        expect(balance).to.equal(mintAmount);
    });

    it("✅ Non-owner should NOT be able to mint", async function () {
        const mintAmount = ethers.parseEther("100");
        
        await expect(
            token.connect(addr1).mint(addr1.address, mintAmount)
        ).to.be.reverted; // Cú pháp này ok nếu dùng Waffle/Chai matchers mới
    });

    it("✅ Should be able to transfer tokens", async function () {
        const mintAmount = ethers.parseEther("1000");
        await token.mint(owner.address, mintAmount);

        const transferAmount = ethers.parseEther("100");
        await token.transfer(addr1.address, transferAmount);

        const addr1Balance = await token.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(transferAmount);
    });

    it("✅ Total supply should increase when minting", async function () {
        const mintAmount = ethers.parseEther("500");
        await token.mint(owner.address, mintAmount);

        const totalSupply = await token.totalSupply();
        expect(totalSupply).to.equal(mintAmount);
    });
});