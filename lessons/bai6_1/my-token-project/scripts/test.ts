import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

  // Standard ERC20 ABI
  const abi = [
    "function balanceOf(address account) public view returns (uint256)",
    "function name() public view returns (string memory)",
    "function symbol() public view returns (string memory)",
    "function totalSupply() public view returns (uint256)",
    "function decimals() public view returns (uint8)"
  ];

  // Contract address từ deployment
  const contractAddress = "0xCa7feb0B903BD29D194e2E0980d51c1e964Faf7B";
  const contract = new ethers.Contract(contractAddress, abi, provider);

  // Deployer address
  const deployerAddress = "0x6b603229f119FE0a3F21487A2b0dBFd3c0Ea138A";

  try {
    console.log("=".repeat(50));
    console.log("MyToken Information");
    console.log("=".repeat(50));
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(deployerAddress);

    console.log("Token Name:", name);
    console.log("Token Symbol:", symbol);
    console.log("Decimals:", decimals);
    console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
    console.log("=".repeat(50));
    console.log("Deployer Address:", deployerAddress);
    console.log("Deployer Balance:", ethers.formatUnits(balance, decimals), symbol);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
