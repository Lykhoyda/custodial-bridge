import { getXpub } from '@bridge/shared';

async function main() {
	const mnemonic = process.env.BRIDGE_MNEMONIC;

	if (!mnemonic) {
		throw new Error('BRIDGE_MNEMONIC not set in environment');
	}

	const xpub = getXpub(mnemonic);

	console.log('\n=================================\n');
	console.log('Add this to your frontend env file:');
	console.log(`XPUB: ${xpub}`);
	console.log('=================================\n');
}

main().catch(console.error);
