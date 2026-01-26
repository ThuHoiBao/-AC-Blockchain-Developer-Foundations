import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("====================");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);
  console.log("====================");

  console.log("====================");
  console.log("Deploy MyToken Contract");
  console.log("====================");

  await deploy("MyToken", {
    contract: "MyToken",
    args: [],
    from: deployer,
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: false,
  });

  const myTokenDeployment = await deployments.get("MyToken");
  console.log("====================");
  console.log("MyToken deployed to:", myTokenDeployment.address);
  console.log("====================");
};

func.tags = ["deploy"];
export default func;
