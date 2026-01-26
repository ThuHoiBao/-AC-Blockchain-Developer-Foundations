# MyToken ERC20 Project

## Cài đặt
```bash
npm install
```

## Compile
```bash
npm run compile
```

## Deploy lên Sepolia
1. Copy `.env.example` thành `.env`
2. Điền private key của bạn vào `TESTNET_PRIVATE_KEY`
3. Chạy:
```bash
npm run deploy:sepolia
```

## Chạy test script
```bash
npx ts-node scripts/test.ts
```
