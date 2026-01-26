import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { MyNFT } from "../typechain";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MyNFT", function () {
  let myNFT: MyNFT;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [deployer, user1] = await ethers.getSigners();
    
    await deployments.fixture(["deploy"]);
    const myNFTDeployment = await deployments.get("MyNFT");
    myNFT = await ethers.getContractAt("MyNFT", myNFTDeployment.address);
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await myNFT.admin()).to.equal(deployer.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await myNFT.name()).to.equal("MyNFT");
      expect(await myNFT.symbol()).to.equal("MNFT");
    });

    it("Should start with nextTokenId = 0", async function () {
      expect(await myNFT.nextTokenId()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT by admin", async function () {
      await myNFT.mint(user1.address);
      expect(await myNFT.ownerOf(0)).to.equal(user1.address);
      expect(await myNFT.nextTokenId()).to.equal(1);
    });

    it("Should mint multiple NFTs", async function () {
      await myNFT.mint(user1.address);
      await myNFT.mint(deployer.address);
      
      expect(await myNFT.ownerOf(0)).to.equal(user1.address);
      expect(await myNFT.ownerOf(1)).to.equal(deployer.address);
      expect(await myNFT.nextTokenId()).to.equal(2);
    });

    it("Should fail when non-admin tries to mint", async function () {
      await expect(
        myNFT.connect(user1).mint(user1.address)
      ).to.be.revertedWith("only admin");
    });

    it("Should increment nextTokenId after each mint", async function () {
      expect(await myNFT.nextTokenId()).to.equal(0);
      
      await myNFT.mint(user1.address);
      expect(await myNFT.nextTokenId()).to.equal(1);
      
      await myNFT.mint(user1.address);
      expect(await myNFT.nextTokenId()).to.equal(2);
    });
  });

  describe("Ownership", function () {
    it("Should return correct owner", async function () {
      await myNFT.mint(user1.address);
      const owner = await myNFT.ownerOf(0);
      expect(owner).to.equal(user1.address);
    });

    it("Should allow transfer by owner", async function () {
      await myNFT.mint(user1.address);
      await myNFT.connect(user1).transferFrom(user1.address, deployer.address, 0);
      expect(await myNFT.ownerOf(0)).to.equal(deployer.address);
    });
  });
});
