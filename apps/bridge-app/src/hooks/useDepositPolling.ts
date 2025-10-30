import { useEffect, useRef, useState } from 'react';

interface DepositStatus {
	deposit: {
		status: 'waiting' | 'confirming' | 'confirmed' | 'failed';
		txHash?: string;
		confirmations?: number;
	};
	payout: {
		status: 'pending' | 'sent' | 'failed';
		txHash?: string;
	};
}

export function useDepositPolling(depositAddress: string | null) {
	const [depositStatus, setDepositStatus] = useState<DepositStatus | null>(null);
	const [isPolling, setIsPolling] = useState(false);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!depositAddress) {
			// Clear polling if no address
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
				pollIntervalRef.current = null;
			}
			setIsPolling(false);
			setDepositStatus(null);
			return;
		}

		// Start polling
		setIsPolling(true);

		const poll = async () => {
			try {
				const response = await fetch(`/api/v1/deposits/${depositAddress}`);
				if (!response.ok) return;

				const data: DepositStatus = await response.json();
				setDepositStatus(data);

				// Stop polling when complete
				if (data.payout?.status === 'sent' || data.payout?.status === 'failed') {
					if (pollIntervalRef.current) {
						clearInterval(pollIntervalRef.current);
						pollIntervalRef.current = null;
					}
					setIsPolling(false);
				}
			} catch (error) {
				console.error('Polling error:', error);
			}
		};

		// Poll immediately, then every 5 seconds
		poll();
		pollIntervalRef.current = setInterval(poll, 5000);

		// Cleanup
		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
		};
	}, [depositAddress]);

	return { depositStatus, isPolling };
}
