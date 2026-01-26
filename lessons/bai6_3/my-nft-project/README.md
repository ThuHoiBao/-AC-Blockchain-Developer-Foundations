# My NFT Project

Smart contract NFT (ERC721) cơ bản sử dụng Hardhat và OpenZeppelin.

## Cài đặt

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Deploy

Deploy lên Sepolia testnet:

```bash
npm run deploy:sepolia
```

## Test

Chạy script test để mint NFT và kiểm tra owner:

```bash
npx hardhat run scripts/test.ts --network sepolia
```
