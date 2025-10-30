import { ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface DepositStatusCardsProps {
	depositStatus: DepositStatus;
	isPolling: boolean;
}

export function DepositStatusCards({ depositStatus, isPolling }: DepositStatusCardsProps) {
	return (
		<>
			<Card className="border-l-4 border-l-blue-600">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<span className="h-2 w-2 rounded-full bg-blue-600" />
						Deposit Status (Base)
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm text-slate-600">Status</span>
						<span className="text-sm font-medium capitalize">{depositStatus.deposit.status}</span>
					</div>

					{depositStatus.deposit.status === 'confirming' &&
						depositStatus.deposit.confirmations !== undefined && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-600">Confirmations</span>
								<span className="text-sm font-medium">{depositStatus.deposit.confirmations}/7</span>
							</div>
						)}

					{depositStatus.deposit.txHash && (
						<a
							href={`https://sepolia.basescan.org/tx/${depositStatus.deposit.txHash}`}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
						>
							View Transaction
							<ExternalLink className="h-3 w-3" />
						</a>
					)}
				</CardContent>
			</Card>

			<Card className="border-l-4 border-l-cyan-600">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<span className="h-2 w-2 rounded-full bg-cyan-600" />
						Payout Status (Arbitrum)
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm text-slate-600">Status</span>
						<span className="text-sm font-medium capitalize">{depositStatus.payout.status}</span>
					</div>

					{depositStatus.payout.txHash && (
						<a
							href={`https://sepolia.arbiscan.io/tx/${depositStatus.payout.txHash}`}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
						>
							View Transaction
							<ExternalLink className="h-3 w-3" />
						</a>
					)}
				</CardContent>
			</Card>

			{isPolling && (
				<div className="flex items-center justify-center gap-2 text-sm text-slate-500">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>Monitoring transaction...</span>
				</div>
			)}
		</>
	);
}
