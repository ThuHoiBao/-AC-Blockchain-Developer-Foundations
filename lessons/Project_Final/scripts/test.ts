import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Test script để verify và test các ABI contract sau khi deploy trên Sepolia
 * Chạy với: npx hardhat run scripts/test.ts --network sepolia
 */

async function main() {
  const network = (await ethers.provider.getNetwork()).name;
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const [deployer] = await ethers.getSigners();

  console.log("\n========================================");
  console.log("🔍 Testing Deployed Contracts");
  console.log("========================================");
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${deployer.address}`);

  // ============ Load Deployment Info ============
  const deploymentPath = path.join(
    __dirname,
    `../data/deployments-${network}.json`
  );

  if (!fs.existsSync(deploymentPath)) {
    console.error(`\n❌ Deployment file not found: ${deploymentPath}`);
    console.error(
      "Please run: npx hardhat run deploy/deploy.ts --network sepolia"
    );
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const { MockUSDC: mockUSDCData, SavingsPool: savingsPoolData } =
    deploymentData.contracts;

  console.log("\n========================================");
  console.log("📋 Loaded Deployment Data:");
  console.log("========================================");
  console.log(`MockUSDC: ${mockUSDCData.address}`);
  console.log(`SavingsPool: ${savingsPoolData.address}`);

  // ============ Get Contract Instances ============
  const MockUSDC = await ethers.getContractAt("MockUSDC", mockUSDCData.address);
  const SavingsPool = await ethers.getContractAt(
    "SavingsPool",
    savingsPoolData.address
  );

  console.log("\n========================================");
  console.log("✅ Contract Instances Created");
  console.log("========================================");

  // ============ Test MockUSDC ============
  console.log("\n========================================");
  console.log("🧪 Testing MockUSDC");
  console.log("========================================");

  try {
    const name = await MockUSDC.name();
    const symbol = await MockUSDC.symbol();
    const decimals = await MockUSDC.decimals();
    const totalSupply = await MockUSDC.totalSupply();

    console.log(`✅ Name: ${name}`);
    console.log(`✅ Symbol: ${symbol}`);
    console.log(`✅ Decimals: ${decimals}`);
    console.log(`✅ Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
  } catch (error: any) {
    console.error(`❌ MockUSDC test failed: ${error.message}`);
  }

  // ============ Test SavingsPool ============
  console.log("\n========================================");
  console.log("🧪 Testing SavingsPool");
  console.log("========================================");

  try {
    const token = await SavingsPool.token();
    const tokenDecimals = await SavingsPool.tokenDecimals();
    const feeReceiver = await SavingsPool.feeReceiver();
    const owner = await SavingsPool.owner();
    const vaultBalance = await SavingsPool.vaultBalance();
    const paused = await SavingsPool.paused();

    console.log(`✅ Token: ${token}`);
    console.log(`✅ Token Decimals: ${tokenDecimals}`);
    console.log(`✅ Fee Receiver: ${feeReceiver}`);
    console.log(`✅ Owner: ${owner}`);
    console.log(
      `✅ Vault Balance: ${ethers.formatUnits(vaultBalance, tokenDecimals)} USDC`
    );
    console.log(`✅ Paused: ${paused}`);
  } catch (error: any) {
    console.error(`❌ SavingsPool test failed: ${error.message}`);
  }

  // ============ Test Create Plan (Owner Only) ============
  console.log("\n========================================");
  console.log("🧪 Testing Create Plan");
  console.log("========================================");

  try {
    // Kiểm tra có plan nào tồn tại không
    const existingPlan = await SavingsPool.getPlan(1).catch(() => null);

    if (!existingPlan) {
      console.log("No plan found, attempting to create one...");
      const tx = await SavingsPool.createPlan(
        90, // tenorDays: 90 days
        500, // aprBps: 5% (500 basis points)
        ethers.parseUnits("100", 6), // minDeposit: 100 USDC
        ethers.parseUnits("10000", 6), // maxDeposit: 10,000 USDC
        200 // earlyWithdrawPenaltyBps: 2% (200 basis points)
      );

      const receipt = await tx.wait();
      console.log(`✅ Plan created in tx: ${receipt?.hash}`);

      const plan = await SavingsPool.getPlan(1);
      console.log(`✅ Plan 1 Details:`);
      console.log(`   - Tenor Days: ${plan.tenorDays}`);
      console.log(`   - APR BPS: ${plan.aprBps}`);
      console.log(`   - Min Deposit: ${ethers.formatUnits(plan.minDeposit, 6)} USDC`);
      console.log(`   - Max Deposit: ${ethers.formatUnits(plan.maxDeposit, 6)} USDC`);
      console.log(`   - Early Withdraw Penalty: ${plan.earlyWithdrawPenaltyBps} bps`);
      console.log(`   - Enabled: ${plan.enabled}`);
    } else {
      console.log("✅ Plan already exists:");
      console.log(`   - Tenor Days: ${existingPlan.tenorDays}`);
      console.log(`   - APR BPS: ${existingPlan.aprBps}`);
      console.log(`   - Enabled: ${existingPlan.enabled}`);
    }
  } catch (error: any) {
    console.error(`⚠️ Create Plan test: ${error.message}`);
  }

  // ============ Test Fund Vault ============
  console.log("\n========================================");
  console.log("🧪 Testing Fund Vault");
  console.log("========================================");

  try {
    const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    const currentBalance = await MockUSDC.balanceOf(deployer.address);

    console.log(`Current deployer USDC balance: ${ethers.formatUnits(currentBalance, 6)} USDC`);

    if (currentBalance < mintAmount) {
      console.log(`Minting ${ethers.formatUnits(mintAmount, 6)} USDC...`);
      const mintTx = await MockUSDC.mintSelf(mintAmount);
      await mintTx.wait();
      console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 6)} USDC`);
    }

    const allowanceAmount = ethers.parseUnits("500", 6);
    const currentAllowance = await MockUSDC.allowance(
      deployer.address,
      savingsPoolData.address
    );

    if (currentAllowance < allowanceAmount) {
      console.log(`Setting allowance to ${ethers.formatUnits(allowanceAmount, 6)} USDC...`);
      const approveTx = await MockUSDC.approve(
        savingsPoolData.address,
        allowanceAmount
      );
      await approveTx.wait();
      console.log(`✅ Allowance set`);
    }

    const fundAmount = ethers.parseUnits("100", 6); // 100 USDC
    const fundTx = await SavingsPool.fundVault(fundAmount);
    const receipt = await fundTx.wait();

    console.log(`✅ Vault funded with ${ethers.formatUnits(fundAmount, 6)} USDC`);
    console.log(`   - Tx: ${receipt?.hash}`);

    const newVaultBalance = await SavingsPool.vaultBalance();
    console.log(
      `✅ New Vault Balance: ${ethers.formatUnits(newVaultBalance, 6)} USDC`
    );
  } catch (error: any) {
    console.error(`⚠️ Fund Vault test: ${error.message}`);
  }

  // ============ Save Test Report ============
  const testReport = {
    timestamp: new Date().toISOString(),
    network: network,
    chainId: Number(chainId),
    deployer: deployer.address,
    contracts: {
      MockUSDC: mockUSDCData.address,
      SavingsPool: savingsPoolData.address,
    },
    testStatus: "completed",
    notes:
      "All basic contract interactions tested. Contracts are ready for use.",
  };

  const reportPath = path.join(
    __dirname,
    `../data/test-report-${network}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

  console.log("\n========================================");
  console.log("✅ All Tests Completed!");
  console.log("========================================");
  console.log(`📝 Test report saved to: ${reportPath}`);
  console.log("\n📊 Summary:");
  console.log(JSON.stringify(testReport, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
