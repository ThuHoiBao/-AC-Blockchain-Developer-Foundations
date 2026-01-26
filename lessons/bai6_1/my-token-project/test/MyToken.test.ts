import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken } from "../typechain";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MyToken", function () {
  let myToken: MyToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyTokenFactory = await ethers.getContractFactory("MyToken");
    myToken = await MyTokenFactory.deploy();
    await myToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await myToken.name()).to.equal("MyToken");
      expect(await myToken.symbol()).to.equal("MTK");
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await myToken.balanceOf(owner.address);
      const totalSupply = await myToken.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should have correct total supply", async function () {
      const totalSupply = await myToken.totalSupply();
      const decimals = await myToken.decimals();
      const expectedSupply = ethers.parseUnits("1000000", decimals);
      expect(totalSupply).to.equal(expectedSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 100 tokens from owner to addr1
      await myToken.transfer(addr1.address, ethers.parseEther("100"));
      const addr1Balance = await myToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.parseEther("100"));

      // Transfer 50 tokens from addr1 to addr2
      await myToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
      const addr2Balance = await myToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await myToken.balanceOf(owner.address);

      // Try to send more tokens than owner has
      await expect(
        myToken.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;

      // Owner balance shouldn't have changed
      expect(await myToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should emit Transfer event", async function () {
      await expect(myToken.transfer(addr1.address, ethers.parseEther("100")))
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
    });
  });

  describe("Allowance", function () {
    it("Should approve tokens for delegated transfer", async function () {
      await myToken.approve(addr1.address, ethers.parseEther("100"));
      const allowance = await myToken.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(ethers.parseEther("100"));
    });

    it("Should transfer tokens using transferFrom", async function () {
      // Owner approves addr1 to spend 100 tokens
      await myToken.approve(addr1.address, ethers.parseEther("100"));

      // addr1 transfers 50 tokens from owner to addr2
      await myToken.connect(addr1).transferFrom(
        owner.address,
        addr2.address,
        ethers.parseEther("50")
      );

      const addr2Balance = await myToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));

      // Check remaining allowance
      const allowance = await myToken.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(ethers.parseEther("50"));
    });

    it("Should emit Approval event", async function () {
      await expect(myToken.approve(addr1.address, ethers.parseEther("100")))
        .to.emit(myToken, "Approval")
        .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
    });

    it("Should fail transferFrom without approval", async function () {
      await expect(
        myToken.connect(addr1).transferFrom(
          owner.address,
          addr2.address,
          ethers.parseEther("100")
        )
      ).to.be.reverted;
    });
  });
});
