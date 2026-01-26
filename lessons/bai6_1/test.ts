import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");

  const abi = [
    "function balanceOf(address account) public view returns (uint256)",
    "function name() public view returns (string memory)",
    "function symbol() public view returns (string memory)",
    "function totalSupply() public view returns (uint256)"
  ];
  const contractAddress = "0x41d0Ad4E6227062B59CA673B418Fc00E3A2d10Cf"; // Replace with your contract address
  const contract = new ethers.Contract(contractAddress, abi, provider);

  /**
   * Get the current balance of deployer
   */
  const deployerAddress = "0x5c2E9a9f5E5B7F1A7d5E9C3B8A2F1E5D9C8B7A6F"; // Replace with deployer address
  const balance = await contract.balanceOf(deployerAddress);
  const name = await contract.name();
  const symbol = await contract.symbol();
  const totalSupply = await contract.totalSupply();

  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Total Supply:", ethers.formatEther(totalSupply));
  console.log("Deployer Balance:", ethers.formatEther(balance));
}

main().catch(console.error);
