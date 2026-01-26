import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");


  const privateKey = process.env.TESTNET_PRIVATE_KEY || "0xe384cd6fc90a57e9b6aa7a9d1886d1f7ac0870caeac7b29da490f3f53bdd6c0f";
  const signer = new ethers.Wallet(privateKey, provider);

  const abi = [
    "function getCount() public view returns (uint)",
    "function increment() public",
    "function decrement() public",
    "function setCount(uint _value) public"
  ];
  
  // Địa chỉ Counter đã deploy trên Sepolia
  const contractAddress = "0xaEAc644e996A0a8924BA2549c838bde0C3c35bCd";
  const contractAddressDecrement = "0x6067fE4af81Fcc474E60760393ec1Ef3646eDc6a";

  // Dùng provider cho view functions (đọc)
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  // Dùng signer cho state-changing functions (ghi/ký giao dịch)
  const contractDecrement = new ethers.Contract(contractAddressDecrement, abi, signer);

  // Đọc count từ Counter
  const count = await contract.getCount();
  console.log("Counter count is:", count.toString());

  // Set count của Decrement = count của Counter
  console.log("Setting Decrement count to:", count.toString());
  const setTx = await contractDecrement.setCount(count);
  await setTx.wait();
  console.log("✓ setCount confirmed");

  // Đọc count từ Decrement trước khi gọi decrement()
  const countBeforeDecrement = await contractDecrement.getCount();
  console.log("Decrement count BEFORE decrement():", countBeforeDecrement.toString());

  // Gọi decrement() và ký giao dịch
  console.log("Calling decrement()...");
  const tx = await contractDecrement.decrement();
  console.log("Transaction hash:", tx.hash);
  

  await tx.wait();
  console.log("✓ Transaction confirmed");

 
  const countAfterDecrement = await contractDecrement.getCount();
  console.log("Decrement count AFTER decrement():", countAfterDecrement.toString());
}
  
main().catch(console.error);

