import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';

const mnemonic = generateMnemonic(english);
const account = mnemonicToAccount(mnemonic);

console.log(`Mnemonic phrase: ${mnemonic}`);
console.log(`Derived address: ${account}`);

console.log('\n=================================');
console.log('⚠️  SECURITY WARNINGS:');
console.log('=================================');
console.log('1. This is for TESTNET ONLY');
console.log('2. For production, use hardware wallet');
console.log('=================================\n');
