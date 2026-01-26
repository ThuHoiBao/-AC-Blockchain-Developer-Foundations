# Bài Tập 6.3 – Mint NFT bằng Hardhat

🎯 Mục tiêu:
- Viết, deploy và mint NFT ERC721 bằng Hardhat.

---

## ✅ Yêu cầu

1. Viết contract `MyNFT`:
   - Kế thừa từ ERC721
   - Biến `nextTokenId`
   - Hàm `mint(address to)` chỉ owner gọi được
   - Mỗi lần mint tăng `nextTokenId`

2. Viết script deploy:
   - Deploy contract
   - Mint 1 NFT cho deployer
   - In `ownerOf(0)`

---

## 💡 Gợi ý

- Dùng `_safeMint(to, nextTokenId)` để mint NFT
- Hàm `ownerOf()` trả về địa chỉ chủ sở hữu

---

## 🧪 Chạy lệnh

```bash
npx hardhat deploy --network sepolia --tags deploy
```
Sau khi deploy, chạy file test.ts để mint một NFT và trả về địa chỉ sở hữu.


cd "D:\Blockchain Intern\-AC-Blockchain-Developer-Foundations\lessons\bai6_3\my-nft-project"

# Compile
npm run compile

# Test local
npm test

# Deploy lên Sepolia
npm run deploy:sepolia

# Mint NFT sau khi deploy
npx hardhat run scripts/test.ts --network sepolia