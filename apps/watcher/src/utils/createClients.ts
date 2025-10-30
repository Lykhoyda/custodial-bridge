import { createPublicClient, http } from 'viem';
import { arbitrumSepolia, baseSepolia } from 'viem/chains';
import { config } from '../config';

function createClients() {
	const baseClient = createPublicClient({
		chain: baseSepolia,
		transport: http(config.baseRpcUrl)
	});

	const arbitrumClient = createPublicClient({
		chain: arbitrumSepolia,
		transport: http(config.arbitrumRpcUrl)
	});

	return { base: baseClient, arbitrum: arbitrumClient };
}

export { createClients };
