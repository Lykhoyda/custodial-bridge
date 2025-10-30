import { mnemonicToAccount } from 'viem/accounts';
import { describe, expect, test } from 'vitest';
import { calculateIndex, deriveAddressFromXpub, deriveDepositAddress, getXpub } from './derivation';

describe('derivation', () => {
	const mnemonic = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

	describe('calculateIndex', () => {
		test('it calculates the same index for the same outputs', () => {
			const address = '0x9a5c142ffdbddfcc7b909104f1191d8e3cc44e90';
			const nonce = 5;
			const index1 = calculateIndex(address, nonce);
			const index2 = calculateIndex(address, nonce);

			expect(index1).toBe(index2);
			expect(typeof index1).toBe('number');
		});

		test('it generates different index for different nonces', () => {
			const address = '0x1234567890abcdef1234567890abcdef12345678';

			const index1 = calculateIndex(address, 1);
			const index2 = calculateIndex(address, 2);

			expect(index1).not.toBe(index2);
		});

		test('it generates different index for different addresses', () => {
			const index1 = calculateIndex('0x1234567890abcdef1234567890abcdef12345678', 1);
			const index2 = calculateIndex('0x6543217890abcdef1234567890abcdef12345678', 1);

			expect(index1).not.toBe(index2);
		});
	});

	describe('deriveDepositAddress', () => {
		test('it returns same account for mnemonics', () => {
			const index = 0;

			const accountData1 = deriveDepositAddress(mnemonic, index);
			const accountData2 = deriveDepositAddress(mnemonic, index);

			expect(accountData1.address).toBe(accountData2.address);
			expect(typeof accountData1.address).toBe('string');
			expect(typeof accountData1.account).toBe('object');
		});

		test('it returns different account for different indexes', () => {
			const accountData1 = deriveDepositAddress(mnemonic, 0);
			const accountData2 = deriveDepositAddress(mnemonic, 1);

			expect(accountData1.address).not.toBe(accountData2.address);
		});

		test('it uses correct BIP44 path for Ethereum', () => {
			const accountData = deriveDepositAddress(mnemonic, 0);
			const expectedAccount = mnemonicToAccount(mnemonic, {
				accountIndex: 0,
				changeIndex: 0,
				addressIndex: 0
			});
			expect(accountData.address).toBe(expectedAccount.address);
		});
	});

	describe('getXpub', () => {
		test('it returns correct xpub for mnemonic', () => {
			const expectedXpub =
				'xpub6Bh6Cg7bvjFdW6VEAaZmsyhZh86WdJ9Kr5aqqY5LN7UFLpxTrxsiys213UCu8MAYjcq5JhF7jzZXvruGfWfPbxqsByNNhwWaNQRuhP3JcC3';

			const xpub = getXpub(mnemonic);

			expect(xpub).toBe(expectedXpub);
		});

		test('xpub derivation matches mnemonic derivation', () => {
			const xpub = getXpub(mnemonic);
			const { address: mnemonicAddress } = deriveDepositAddress(mnemonic, 0);
			const xpubDerivedAddress = deriveAddressFromXpub(xpub, 0);

			expect(mnemonicAddress).toBe(xpubDerivedAddress);
		});
	});
});
