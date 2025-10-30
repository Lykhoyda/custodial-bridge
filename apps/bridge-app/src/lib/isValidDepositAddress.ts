import { calculateIndex, deriveAddressFromXpub } from '@bridge/shared';

async function isValidDepositAddress(
	depositAddress: string,
	destinationAddress: string,
	nonce: number
): Promise<boolean> {
	if (!process.env.NEXT_PUBLIC_BRIDGE_XPUB) {
		throw new Error('NEXT_PUBLIC_BRIDGE_XPUB not set in environment');
	}

	try {
		const index = calculateIndex(destinationAddress, nonce);
		const derivedAddress = deriveAddressFromXpub(process.env.NEXT_PUBLIC_BRIDGE_XPUB, index);

		return derivedAddress.toLowerCase() === depositAddress.toLowerCase();
	} catch (error) {
		console.error('Verification error:', error);
		return false;
	}
}

export { isValidDepositAddress };
