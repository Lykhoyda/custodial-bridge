import { useState } from 'react';
import { parseEther } from 'viem';
import { isValidDepositAddress } from '@/lib/isValidDepositAddress';

interface UseCreateDepositFormReturn {
	// Form state
	destinationAddress: string;
	amount: string;
	nonce: string;

	// Setters
	setDestinationAddress: (value: string) => void;
	setAmount: (value: string) => void;
	setNonce: (value: string) => void;

	// Submission
	handleSubmit: () => Promise<void>;
	isSubmitting: boolean;

	// Results
	depositAddress: string | null;
	isVerified: boolean | null;
	verificationError: string | null;
	apiError: string | null;

	// Reset
	reset: () => void;
}

export function useCreateDepositForm(): UseCreateDepositFormReturn {
	const [destinationAddress, setDestinationAddress] = useState('');
	const [amount, setAmount] = useState('');
	const [nonce, setNonce] = useState('0');

	const [depositAddress, setDepositAddress] = useState<string | null>(null);
	const [isVerified, setIsVerified] = useState<boolean | null>(null);
	const [verificationError, setVerificationError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);

	const handleSubmit = async () => {
		try {
			setIsSubmitting(true);
			setVerificationError(null);
			setApiError(null);

			const parsedNonce = nonce ? Number(nonce) : 0;
			if (Number.isNaN(parsedNonce)) {
				throw new Error('Invalid nonce value');
			}

			const amountInWei = parseEther(amount);
			const response = await fetch('/api/v1/deposit-address', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					destinationAddress,
					amount: amountInWei.toString(),
					nonce: parsedNonce
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				setApiError(errorData.error || 'Failed to generate deposit address');
				throw new Error(errorData.error || 'Failed to generate deposit address');
			}

			const data = await response.json();

			const verified = await isValidDepositAddress(
				data.depositAddress,
				data.destinationAddress,
				data.nonce
			);

			setIsVerified(verified);

			if (verified) {
				setDepositAddress(data.depositAddress);
			} else {
				setVerificationError(
					'The API returned an address that does not match the expected derivation. DO NOT send funds.'
				);
			}
		} catch (error) {
			setVerificationError(error instanceof Error ? error.message : 'Unknown error occurred');
		} finally {
			setIsSubmitting(false);
		}
	};

	const reset = () => {
		setDepositAddress(null);
		setIsVerified(null);
		setVerificationError(null);
		setApiError(null);
	};

	return {
		apiError,
		destinationAddress,
		amount,
		nonce,
		setDestinationAddress,
		setAmount,
		setNonce,
		handleSubmit,
		isSubmitting,
		depositAddress,
		isVerified,
		verificationError,
		reset
	};
}
