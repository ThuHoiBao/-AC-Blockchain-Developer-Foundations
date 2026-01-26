import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import * as fs from "fs";
import * as path from "path";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer}`);
  console.log("====================");

  // ============ Deploy MockUSDC (test token) ============
  console.log("\n📦 Deploying MockUSDC...");
  const mockUSDCDeploy = await deploy("MockUSDC", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  const mockUSDCAddress = mockUSDCDeploy.address;
  console.log(`✅ MockUSDC deployed to: ${mockUSDCAddress}`);

  // ============ Deploy SavingsPool ============
  console.log("\n📦 Deploying SavingsPool...");
  
  const tokenDecimals = 6; // USDC decimals
  const feeReceiver = deployer; // Set deployer as fee receiver (can be changed later)

  const savingsPoolDeploy = await deploy("SavingsPool", {
    from: deployer,
    args: [mockUSDCAddress, tokenDecimals, feeReceiver],
    log: true,
    autoMine: true,
  });
  const savingsPoolAddress = savingsPoolDeploy.address;
  console.log(`✅ SavingsPool deployed to: ${savingsPoolAddress}`);

  // ============ Save Deployment Info ============
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: {
        address: mockUSDCAddress,
        tokenDecimals: tokenDecimals,
      },
      SavingsPool: {
        address: savingsPoolAddress,
        mockUSDC: mockUSDCAddress,
        feeReceiver: feeReceiver,
      },
    },
  };

  // Save to file
  const deploymentPath = path.join(__dirname, `../data/deployments-${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📝 Deployment info saved to: ${deploymentPath}`);

  console.log("\n====================");
  console.log("✅ Deployment completed successfully!");
  console.log("====================");
  console.log(JSON.stringify(deploymentInfo, null, 2));
};

func.tags = ["deploy"];
export default func;
