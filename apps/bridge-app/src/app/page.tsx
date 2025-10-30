'use client';

import { CreateDepositForm } from '@/components/CreateDepositForm';
import { DepositStatusCards } from '@/components/DepositStatusCards';
import { VerificationDisplay } from '@/components/VerificationDisplay';
import { useCreateDepositForm } from '@/hooks/useCreateDepositForm';
import { useDepositPolling } from '@/hooks/useDepositPolling';

export default function BridgePage() {
	const form = useCreateDepositForm();
	const { depositStatus, isPolling } = useDepositPolling(form.depositAddress);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-4 sm:p-6 lg:p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Bridge</h1>
					<p className="mt-1 text-sm text-slate-600 sm:text-base">
						Base Sepolia → Arbitrum Sepolia
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
					<CreateDepositForm {...form} />

					<div className="space-y-4 lg:space-y-6" aria-live="polite">
						<VerificationDisplay
							isVerified={form.isVerified}
							verificationError={form.verificationError}
							depositAddress={form.depositAddress}
							amount={form.amount}
						/>

						{form.isVerified && depositStatus && (
							<DepositStatusCards depositStatus={depositStatus} isPolling={isPolling} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
