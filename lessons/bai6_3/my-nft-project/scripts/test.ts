import { ethers } from "hardhat";

// ABI đầy đủ của MyNFT contract
const MyNFT_ABI = [
  "function mint(address to) external",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  "function admin() view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external"
];

async function main() {
  // Lấy deployment address từ file deployments
  const fs = require("fs");
  const path = require("path");
  
  const deploymentPath = path.join(__dirname, "../deployments/sepolia/MyNFT.json");
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("Contract chưa được deploy. Chạy: npm run deploy:sepolia");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.address;
  
  console.log("Contract address:", contractAddress);
  
  // Lấy signer (cho các transaction cần ký)
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  // Tạo 2 instance:
  // 1. Provider only - cho view functions (đọc dữ liệu, FREE)
  const provider = signer.provider;
  const MyNFT_ReadOnly = new ethers.Contract(contractAddress, MyNFT_ABI, provider);
  
  // 2. Signer - cho state-changing functions (ghi dữ liệu, TỐN GAS)
  const MyNFT_Write = new ethers.Contract(contractAddress, MyNFT_ABI, signer);
  
  // Test 1: Kiểm tra admin (VIEW - dùng provider)
  console.log("\n=== Test 1: Admin ===");
  const admin = await MyNFT_ReadOnly.admin();
  console.log("Admin address:", admin);
  
  // Test 2: Kiểm tra name và symbol (VIEW - dùng provider)
  console.log("\n=== Test 2: Name & Symbol ===");
  const name = await MyNFT_ReadOnly.name();
  const symbol = await MyNFT_ReadOnly.symbol();
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  
  // Test 3: Kiểm tra nextTokenId trước khi mint (VIEW - dùng provider)
  console.log("\n=== Test 3: Next Token ID ===");
  const nextTokenIdBefore = await MyNFT_ReadOnly.nextTokenId();
  console.log("Next Token ID before mint:", nextTokenIdBefore.toString());
  
  // Test 4: Kiểm tra balance trước khi mint (VIEW - dùng provider)
  console.log("\n=== Test 4: Balance Before Mint ===");
  const balanceBefore = await MyNFT_ReadOnly.balanceOf(signer.address);
  console.log("Balance before mint:", balanceBefore.toString());
  
  // Test 5: Mint một NFT mới (STATE-CHANGING - dùng signer, TỐN GAS)
  console.log("\n=== Test 5: Minting NFT ===");
  console.log("Minting NFT to:", signer.address);
  const tx = await MyNFT_Write.mint(signer.address);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("NFT minted successfully!");
  
  // Test 6: Lấy nextTokenId sau khi mint (VIEW - dùng provider)
  console.log("\n=== Test 6: Next Token ID After Mint ===");
  const nextTokenIdAfter = await MyNFT_ReadOnly.nextTokenId();
  console.log("Next Token ID after mint:", nextTokenIdAfter.toString());
  const tokenId = Number(nextTokenIdAfter) - 1;
  console.log("Minted Token ID:", tokenId);
  
  // Test 7: Kiểm tra owner của token vừa mint (VIEW - dùng provider)
  console.log("\n=== Test 7: Owner Of Token ===");
  const owner = await MyNFT_ReadOnly.ownerOf(tokenId);
  console.log(`Owner of token ${tokenId}:`, owner);
  console.log("Is owner correct?", owner === signer.address);
  
  // Test 8: Kiểm tra balance sau khi mint (VIEW - dùng provider)
  console.log("\n=== Test 8: Balance After Mint ===");
  const balanceAfter = await MyNFT_ReadOnly.balanceOf(signer.address);
  console.log("Balance after mint:", balanceAfter.toString());
  console.log("Balance increased?", Number(balanceAfter) > Number(balanceBefore));
  
  // Test 9: Thử lấy approved address (VIEW - dùng provider)
  console.log("\n=== Test 9: Get Approved ===");
  const approved = await MyNFT_ReadOnly.getApproved(tokenId);
  console.log(`Approved address for token ${tokenId}:`, approved);
  
  console.log("\n=== All Tests Completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
