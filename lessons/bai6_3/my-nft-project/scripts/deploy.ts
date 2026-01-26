import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);

  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy();
  await nft.waitForDeployment();

  const nftAddress = await nft.getAddress();
  console.log("MyNFT deployed to:", nftAddress);

  // Mint một NFT cho deployer
  console.log("\nMinting NFT to:", deployer.address);
  const tx = await nft.mint(deployer.address);
  await tx.wait();
  console.log("NFT minted successfully!");

  // Kiểm tra owner của token ID 0
  const owner = await nft.ownerOf(0);
  console.log("\nOwner of token 0:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
