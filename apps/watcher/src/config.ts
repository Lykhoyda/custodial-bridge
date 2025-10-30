function getEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

export const config = {
	baseRpcUrl: getEnvVar('BASE_RPC_URL'),
	arbitrumRpcUrl: getEnvVar('ARBITRUM_RPC_URL'),
	mnemonic: getEnvVar('BRIDGE_MNEMONIC'),
	requiredConfirmations: Number(process.env.REQUIRED_CONFIRMATIONS || 7),
	pollInterval: Number(process.env.POLL_INTERVAL_MS || 10000)
};
