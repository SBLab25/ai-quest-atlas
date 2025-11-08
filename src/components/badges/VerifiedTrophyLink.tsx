import { ExternalLink, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedTrophyLinkProps {
  transactionHash?: string | null;
  status?: 'pending' | 'success' | 'failed';
  badgeId: string;
}

export const VerifiedTrophyLink = ({ transactionHash, status, badgeId }: VerifiedTrophyLinkProps) => {
  // Optimism Sepolia Block Explorer URL
  const getBlockExplorerUrl = (txHash: string) => {
    return `https://sepolia-optimism.etherscan.io/tx/${txHash}`;
  };

  if (!transactionHash) {
    // Check if it's pending or failed
    if (status === 'pending') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1.5 cursor-help">
                <Loader2 className="h-3 w-3 animate-spin" />
                Minting...
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>NFT is being minted on the blockchain</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (status === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="gap-1.5 cursor-help">
                <XCircle className="h-3 w-3" />
                Mint Failed
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>NFT minting failed. Please try again later.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // No transaction hash yet
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => window.open(getBlockExplorerUrl(transactionHash), '_blank')}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>Verified on Blockchain</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View this NFT on Optimism Sepolia Block Explorer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

