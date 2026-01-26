import { ethers } from "hardhat";

const MyMintableToken_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const fs = require("fs");
  const path = require("path");
  
  const deploymentPath = path.join(__dirname, "../deployments/sepolia/MyMintableToken.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Contract chưa được deploy.");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.address;
  const [signer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  
  const token = new ethers.Contract(contractAddress, MyMintableToken_ABI, signer);
  
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  
  console.log("========== MINT TOKEN & KIỂM TRA BALANCE ==========\n");
  console.log(" Contract:", contractAddress);
  console.log(` Network: ${net.name || "unknown"} (chainId: ${Number(net.chainId)})`);
  console.log(` Signer (mint to): ${signer.address}`);
  console.log(` Token: ${name} (${symbol})`);
  
  // BƯỚC 1: Gọi hàm mint()
  console.log("\n  Gọi hàm mint():");
  const balanceBefore = await token.balanceOf(signer.address);
  console.log(`   Balance before: ${ethers.formatEther(balanceBefore)} ${symbol}`);
  
  const mintAmount = ethers.parseEther("500");
  const tx = await token.mint(signer.address, mintAmount);
  console.log(`    TX: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`    Mint thành công! Gas: ${receipt?.gasUsed.toString()}`);
   

  // BƯỚC 2: Truy vấn balanceOf()
  console.log("\n 2️  Truy vấn balanceOf():");
  const balanceAfter = await token.balanceOf(signer.address);
  console.log(`    Balance after: ${ethers.formatEther(balanceAfter)} ${symbol}`);
  
  // BƯỚC 3: Thêm vào MetaMask
  console.log("\n 3️  Mở MetaMask → Thêm token thủ công:");
  console.log(`
    1. Chọn mạng: Sepolia (không phải Ethereum mainnet)
    2. MetaMask → Import tokens → Token tùy chỉnh
    3. Contract Address: ${contractAddress}
    4. Symbol: ${symbol}
    5. Decimals: ${decimals} (nếu hiện 0, nhập tay: 18)
    6. Tiếp theo → Import 
  `);
  
  console.log("==========  HOÀN THÀNH ==========\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
