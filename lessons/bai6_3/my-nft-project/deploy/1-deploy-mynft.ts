import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);
  console.log("====================");

  console.log("====================");
  console.log("Deploy MyNFT Contract");
  console.log("====================");

  await deploy("MyNFT", {
    contract: "MyNFT",
    args: [],
    from: deployer,
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: false,
  });

  const myNFTDeployment = await deployments.get("MyNFT");
  console.log("====================");
  console.log("MyNFT deployed to:", myNFTDeployment.address);
  console.log("====================");
};

func.tags = ["deploy"];
export default func;
