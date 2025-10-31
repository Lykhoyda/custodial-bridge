import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateDepositFormProps {
	destinationAddress: string;
	amount: string;
	nonce: string;
	setDestinationAddress: (value: string) => void;
	setAmount: (value: string) => void;
	setNonce: (value: string) => void;
	handleSubmit: () => Promise<void>;
	isSubmitting: boolean;
	apiError: string | null;
}

export function CreateDepositForm({
	destinationAddress,
	amount,
	nonce,
	setDestinationAddress,
	setAmount,
	setNonce,
	handleSubmit,
	isSubmitting,
	apiError
}: CreateDepositFormProps) {
	return (
		<Card className="h-fit">
			<CardHeader>
				<CardTitle>Create Deposit Address</CardTitle>
				<CardDescription>
					Generate a unique deposit address for your bridge transaction
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="destination">Destination Address</Label>
					<Input
						id="destination"
						placeholder="0x..."
						value={destinationAddress}
						onChange={(e) => setDestinationAddress(e.target.value)}
						aria-describedby="destination-description"
					/>
					<p id="destination-description" className="text-xs text-slate-500">
						Your wallet address on Arbitrum Sepolia
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="amount">Amount (ETH)</Label>
					<Input
						id="amount"
						type="number"
						step="0.001"
						min="0"
						placeholder="0.1"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="nonce">Nonce (optional)</Label>
					<Input
						id="nonce"
						type="number"
						min="0"
						value={nonce}
						onChange={(e) => setNonce(e.target.value)}
						aria-describedby="nonce-description"
					/>
					<p id="nonce-description" className="text-xs text-slate-500">
						Use different nonces for multiple deposit addresses
					</p>
				</div>
				{apiError && (
					<div className="rounded-lg bg-red-50 p-3 border border-red-200">
						<p className="text-sm text-red-800">{apiError}</p>
					</div>
				)}
				<Button
					onClick={handleSubmit}
					disabled={!destinationAddress || !amount || isSubmitting}
					className="w-full"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Generating...
						</>
					) : (
						'Generate Deposit Address'
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
