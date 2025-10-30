import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface VerificationDisplayProps {
	isVerified: boolean | null;
	verificationError: string | null;
	depositAddress: string | null;
	amount: string;
}

export function VerificationDisplay({
	isVerified,
	verificationError,
	depositAddress,
	amount
}: VerificationDisplayProps) {
	// Don't render if no verification attempt yet
	if (isVerified === null) {
		return (
			<Card className="border-dashed">
				<CardContent className="py-12 text-center">
					<p className="text-slate-400">Generate a deposit address to begin</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={isVerified ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
			<CardContent className="pt-6">
				<div className="flex items-start gap-3 sm:gap-4">
					{isVerified ? (
						<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-12 sm:w-12">
							<CheckCircle2 className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
						</div>
					) : (
						<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:h-12 sm:w-12">
							<XCircle className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
						</div>
					)}

					<div className="flex-1 min-w-0">
						<h3
							className={`text-base font-semibold sm:text-lg ${
								isVerified ? 'text-green-900' : 'text-red-900'
							}`}
						>
							{isVerified ? 'Verified ✓' : 'Mismatch ✗'}
						</h3>

						{isVerified ? (
							<div className="mt-3 space-y-3">
								<p className="text-sm text-slate-600">Address verified. Safe to deposit.</p>

								<div className="rounded-lg bg-slate-50 p-3">
									<Label className="text-xs text-slate-500">Deposit Address (Base Sepolia)</Label>
									<div className="mt-1 flex items-center gap-2">
										<code className="min-w-0 flex-1 break-all text-xs font-mono text-slate-900 sm:text-sm">
											{depositAddress}
										</code>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => navigator.clipboard.writeText(depositAddress!)}
											className="flex-shrink-0"
											aria-label="Copy deposit address"
										>
											Copy
										</Button>
									</div>
								</div>

								<p className="text-sm font-medium text-slate-700">
									Send exactly <span className="font-semibold text-slate-900">{amount} ETH</span> to
									this address
								</p>
							</div>
						) : (
							<p className="mt-2 text-sm text-red-700" role="alert">
								{verificationError}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
