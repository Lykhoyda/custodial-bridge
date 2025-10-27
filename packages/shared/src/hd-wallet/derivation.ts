import * as secp from '@noble/secp256k1';
import { mnemonicToSeedSync } from '@scure/bip39';
import {
	bytesToHex,
	getAddress,
	type HDAccount,
	type Hex,
	hexToNumber,
	keccak256,
	toBytes
} from 'viem';
import { HDKey, mnemonicToAccount } from 'viem/accounts';

export function calculateIndex(destinationAddress: string, nonce: number): number {
	const combined = `${destinationAddress.toLowerCase()}-${nonce.toString()}`;
	const hash = keccak256(toBytes(combined));

	return hexToNumber(<Hex>hash.slice(0, 10)); // take first 4 bytes (0x + 4 pairs)
}

export function deriveDepositAddress(
	mnemonic: string,
	index: number
): { address: string; account: HDAccount } {
	const account = mnemonicToAccount(mnemonic, {
		accountIndex: 0,
		changeIndex: 0,
		addressIndex: index
	});

	return {
		address: account.address,
		account
	};
}

export function getXpub(mnemonic: string): string {
	const seed = mnemonicToSeedSync(mnemonic);
	const masterKey = HDKey.fromMasterSeed(seed);

	const accountKey = masterKey.derive("m/44'/60'/0'");

	return accountKey.publicExtendedKey;
}

export function deriveAddressFromXpub(xpub: string, index: number): string {
	const hdKey = HDKey.fromExtendedKey(xpub);
	const derivedKey = hdKey.deriveChild(0).deriveChild(index);

	if (!derivedKey.publicKey) {
		throw new Error('Unable to derive public key');
	}

	// Decompress: 33 bytes (compressed) -> 65 bytes (uncompressed)
	const compressedHex = bytesToHex(derivedKey.publicKey).slice(2);
	const uncompressed = secp.Point.fromHex(compressedHex).toBytes(false);

	// Hash the uncompressed key (skip first 0x04 byte)
	const hash = keccak256(uncompressed.slice(1));

	// Address is last 20 bytes of the hash
	const address = `0x${hash.slice(-40)}`;

	return getAddress(address);
}
