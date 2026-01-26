import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { SavingsPool, MockUSDC } from "../typechain";

describe("SavingsPool", function () {
  let savingsPool: SavingsPool;
  let mockUSDC: MockUSDC;
  let owner: Signer;
  let depositor1: Signer;
  let depositor2: Signer;
  let feeReceiver: Signer;

  const DECIMALS = 6;
  const MULTIPLIER = ethers.parseUnits("1", DECIMALS);

  beforeEach(async function () {
    [owner, depositor1, depositor2, feeReceiver] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = (await MockUSDCFactory.deploy()) as MockUSDC;
    await mockUSDC.waitForDeployment();

    // Deploy SavingsPool
    const SavingsPoolFactory = await ethers.getContractFactory("SavingsPool");
    savingsPool = (await SavingsPoolFactory.deploy(
      await mockUSDC.getAddress(),
      DECIMALS,
      await feeReceiver.getAddress()
    )) as SavingsPool;
    await savingsPool.waitForDeployment();

    // Mint tokens cho depositors
    await mockUSDC.mint(await depositor1.getAddress(), ethers.parseUnits("10000", DECIMALS));
    await mockUSDC.mint(await depositor2.getAddress(), ethers.parseUnits("10000", DECIMALS));

    // Mint tokens cho vault funding
    await mockUSDC.mint(await owner.getAddress(), ethers.parseUnits("100000", DECIMALS));
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await savingsPool.token()).to.equal(await mockUSDC.getAddress());
      expect(await savingsPool.tokenDecimals()).to.equal(DECIMALS);
      expect(await savingsPool.feeReceiver()).to.equal(await feeReceiver.getAddress());
    });
  });

  describe("Create Plan", function () {
    it("Should create saving plan", async function () {
      const tx = await savingsPool.createPlan(
        30,                          // 30 days
        800,                         // 8% APR (800 basis points)
        ethers.parseUnits("100", DECIMALS),   // min deposit
        ethers.parseUnits("50000", DECIMALS), // max deposit
        500                          // 5% penalty for early withdrawal
      );

      const receipt = await tx.wait();
      expect(receipt).not.to.be.null;

      const plan = await savingsPool.getPlan(1);
      expect(plan.tenorDays).to.equal(30);
      expect(plan.aprBps).to.equal(800);
      expect(plan.enabled).to.equal(true);
    });

    it("Should not create plan with invalid parameters", async function () {
      await expect(
        savingsPool.createPlan(0, 800, ethers.parseUnits("100", DECIMALS), ethers.parseUnits("50000", DECIMALS), 500)
      ).to.be.revertedWith("Invalid tenor");

      await expect(
        savingsPool.createPlan(30, 0, ethers.parseUnits("100", DECIMALS), ethers.parseUnits("50000", DECIMALS), 500)
      ).to.be.revertedWith("Invalid APR");
    });
  });

  describe("Fund Vault", function () {
    it("Should fund vault", async function () {
      const fundAmount = ethers.parseUnits("10000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);

      expect(await savingsPool.vaultBalance()).to.equal(fundAmount);
    });

    it("Should not fund with zero amount", async function () {
      await expect(savingsPool.fundVault(0)).to.be.revertedWith("Amount must be positive");
    });
  });

  describe("Open Deposit", function () {
    beforeEach(async function () {
      // Create a plan
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );

      // Fund vault
      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);
    });

    it("Should open deposit", async function () {
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      const depositor1Addr = await depositor1.getAddress();

      // Approve spending
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);

      // Open deposit
      const tx = await savingsPool.connect(depositor1).openDeposit(1, depositAmount);
      const receipt = await tx.wait();

      expect(receipt).not.to.be.null;

      // Check deposit was created
      const deposit = await savingsPool.getDeposit(1);
      expect(deposit.owner).to.equal(depositor1Addr);
      expect(deposit.principal).to.equal(depositAmount);
      expect(deposit.status).to.equal(0); // Active

      // Check NFT was minted
      const balance = await savingsPool.balanceOf(depositor1Addr);
      expect(balance).to.equal(1);
    });

    it("Should not open deposit with amount below minimum", async function () {
      const depositAmount = ethers.parseUnits("10", DECIMALS); // Below 100 minimum
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);

      await expect(
        savingsPool.connect(depositor1).openDeposit(1, depositAmount)
      ).to.be.revertedWith("Amount below minimum");
    });

    it("Should not open deposit with amount above maximum", async function () {
      const depositAmount = ethers.parseUnits("100000", DECIMALS); // Above 50000 maximum
      await mockUSDC.mint(await depositor1.getAddress(), depositAmount);
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);

      await expect(
        savingsPool.connect(depositor1).openDeposit(1, depositAmount)
      ).to.be.revertedWith("Amount exceeds maximum");
    });
  });

  describe("Calculate Interest", function () {
    beforeEach(async function () {
      // Create a plan
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );

      // Fund vault
      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);
    });

    it("Should calculate interest correctly", async function () {
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      const depositor1Addr = await depositor1.getAddress();

      // Open deposit
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);
      await savingsPool.connect(depositor1).openDeposit(1, depositAmount);

      // Calculate interest
      const interest = await savingsPool.calculateInterest(1);
      console.log("Calculated interest:", interest.toString());

      // For 30 days at 8% APR:
      // interest = 1000 * 800 * (30 * 86400) / (365 * 86400 * 10000)
      // interest = 1000 * 800 * 2592000 / 315360000000
      // interest ≈ 6.575 USDC (in 6 decimals)
      expect(interest).to.be.greaterThan(0);
    });
  });

  describe("Withdraw at Maturity", function () {
    beforeEach(async function () {
      // Create a plan
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );

      // Fund vault
      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);

      // Open deposit
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);
      await savingsPool.connect(depositor1).openDeposit(1, depositAmount);
    });

    it("Should withdraw at maturity", async function () {
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      const depositor1Addr = await depositor1.getAddress();

      // Get initial balance
      const initialBalance = await mockUSDC.balanceOf(depositor1Addr);

      // Fast-forward exactly to maturity timestamp
      const dep1 = await savingsPool.getDeposit(1);
      const maturity1 = Number(dep1.maturityAt) + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [maturity1]);
      await ethers.provider.send("evm_mine", []);

      // Withdraw
      const tx = await savingsPool.connect(depositor1).withdrawAtMaturity(1);
      await tx.wait();

      // Check new balance
      const finalBalance = await mockUSDC.balanceOf(depositor1Addr);
      const withdrawn = finalBalance - initialBalance;

      // Should be principal + interest
      expect(withdrawn).to.be.greaterThan(depositAmount);
    });

    it("Should not withdraw before maturity", async function () {
      await expect(
        savingsPool.connect(depositor1).withdrawAtMaturity(1)
      ).to.be.revertedWith("Not yet matured");
    });
  });

  describe("Early Withdraw", function () {
    beforeEach(async function () {
      // Create a plan
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500  // 5% penalty
      );

      // Fund vault
      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);

      // Open deposit
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);
      await savingsPool.connect(depositor1).openDeposit(1, depositAmount);
    });

    it("Should withdraw early with penalty", async function () {
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      const depositor1Addr = await depositor1.getAddress();

      const initialBalance = await mockUSDC.balanceOf(depositor1Addr);

      // Early withdraw
      const tx = await savingsPool.connect(depositor1).earlyWithdraw(1);
      await tx.wait();

      const finalBalance = await mockUSDC.balanceOf(depositor1Addr);
      const withdrawn = finalBalance - initialBalance;

      // Should be principal - penalty (5% of 1000 = 50)
      const expectedAmount = ethers.parseUnits("950", DECIMALS);
      expect(withdrawn).to.equal(expectedAmount);
    });

    it("Should not early withdraw after maturity", async function () {
      // Fast-forward exactly to maturity timestamp
      const dep2 = await savingsPool.getDeposit(1);
      const maturity2 = Number(dep2.maturityAt) + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [maturity2]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        savingsPool.connect(depositor1).earlyWithdraw(1)
      ).to.be.revertedWith("Already matured, use withdrawAtMaturity");
    });
  });

  describe("Renew Deposit", function () {
    beforeEach(async function () {
      // Create 2 plans
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );
      await savingsPool.createPlan(
        90,
        1000,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );

      // Fund vault
      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);

      // Open deposit
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);
      await savingsPool.connect(depositor1).openDeposit(1, depositAmount);
    });

    it("Should renew deposit with interest", async function () {
      const depositor1Addr = await depositor1.getAddress();

      // Fast-forward exactly to maturity timestamp
      const dep3 = await savingsPool.getDeposit(1);
      const maturity3 = Number(dep3.maturityAt) + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [maturity3]);
      await ethers.provider.send("evm_mine", []);

      // Renew with interest
      const tx = await savingsPool.connect(depositor1).renew(1, 2, true);
      const receipt = await tx.wait();

      expect(receipt).not.to.be.null;

      // Check new deposit was created
      const newDeposit = await savingsPool.getDeposit(2);
      expect(newDeposit.owner).to.equal(depositor1Addr);
      expect(newDeposit.planId).to.equal(2);
      expect(newDeposit.principal).to.be.greaterThan(ethers.parseUnits("1000", DECIMALS));

      // Old deposit should be marked as renewed
      const oldDeposit = await savingsPool.getDeposit(1);
      expect(oldDeposit.status).to.equal(2); // Renewed
    });

    it("Should renew deposit without interest", async function () {
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      const depositor1Addr = await depositor1.getAddress();

      // Fast-forward exactly to maturity timestamp
      const dep4 = await savingsPool.getDeposit(1);
      const maturity4 = Number(dep4.maturityAt) + 1;
      await ethers.provider.send("evm_setNextBlockTimestamp", [maturity4]);
      await ethers.provider.send("evm_mine", []);

      // Renew without interest
      const tx = await savingsPool.connect(depositor1).renew(1, 2, false);
      await tx.wait();

      // Check new deposit principal
      const newDeposit = await savingsPool.getDeposit(2);
      expect(newDeposit.principal).to.equal(depositAmount);
    });

    it("Should not renew before maturity", async function () {
      await expect(
        savingsPool.connect(depositor1).renew(1, 2, true)
      ).to.be.revertedWith("Not yet matured");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause and unpause", async function () {
      await savingsPool.pause();
      const paused = await savingsPool.paused();
      expect(paused).to.equal(true);

      await savingsPool.unpause();
      const unpaused = await savingsPool.paused();
      expect(unpaused).to.equal(false);
    });

    it("Should not open deposit when paused", async function () {
      // Create plan and fund vault
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );

      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);

      // Pause contract
      await savingsPool.pause();

      // Try to open deposit
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
      await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount);

      await expect(
        savingsPool.connect(depositor1).openDeposit(1, depositAmount)
      ).to.be.revertedWithCustomError(savingsPool, "EnforcedPause");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create plan
      await savingsPool.createPlan(
        30,
        800,
        ethers.parseUnits("100", DECIMALS),
        ethers.parseUnits("50000", DECIMALS),
        500
      );

      // Fund vault
      const fundAmount = ethers.parseUnits("50000", DECIMALS);
      await mockUSDC.approve(await savingsPool.getAddress(), fundAmount);
      await savingsPool.fundVault(fundAmount);

      // Open 2 deposits
      const depositAmount = ethers.parseUnits("1000", DECIMALS);
        await mockUSDC.connect(depositor1).approve(await savingsPool.getAddress(), depositAmount * 2n);
      await savingsPool.connect(depositor1).openDeposit(1, depositAmount);
      await savingsPool.connect(depositor1).openDeposit(1, depositAmount);
    });

    it("Should get user deposits", async function () {
      const depositor1Addr = await depositor1.getAddress();
      const deposits = await savingsPool.getUserDeposits(depositor1Addr);
      expect(deposits.length).to.equal(2);
    });

    it("Should get user deposit count", async function () {
      const depositor1Addr = await depositor1.getAddress();
      const count = await savingsPool.getUserDepositCount(depositor1Addr);
      expect(count).to.equal(2);
    });

    it("Should check if deposit matured", async function () {
      const matured = await savingsPool.isMatured(1);
      expect(matured).to.equal(false);
    });
  });
});
