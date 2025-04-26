import { useState, useEffect, useCallback, memo } from "react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Website } from "@/stores/use-websites-store";
import { useWebsitesStore } from "@/stores/use-websites-store";

interface VerificationDialogProps {
  website: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (id: string) => void;
  onRegenerateToken: (id: string) => Promise<{ data?: Website; error?: string }>;
  isVerifying: boolean;
  isRegenerating: boolean;
}

export const VerificationDialog = memo(function VerificationDialog({
  website,
  open,
  onOpenChange,
  onVerify,
  onRegenerateToken,
  isVerifying,
  isRegenerating,
}: VerificationDialogProps) {
  const [displayToken, setDisplayToken] = useState<string>('');
  const setSelectedWebsite = useWebsitesStore(state => state.setSelectedWebsite);
  const setShowVerificationDialog = useWebsitesStore(state => state.setShowVerificationDialog);
  
  // Reset token when dialog closes
  useEffect(() => {
    if (!open) {
      setDisplayToken('');
    }
  }, [open]);
  
  // Memoize these functions to prevent recreating on each render
  const getDomainForDNS = useCallback((domain: string) => {
    try {
      // Ensure domain has a protocol
      const domainWithProtocol = domain.startsWith('http') ? domain : `https://${domain}`;
      return new URL(domainWithProtocol).hostname.replace(/^www\./, '');
    } catch (error) {
      console.error('Invalid domain:', domain);
      return domain;
    }
  }, []);

  const handleVerifyDomain = useCallback(() => {
    if (!website) return;
    onVerify(website.id);
  }, [website, onVerify]);
  
  const handleRegenerateToken = useCallback(async () => {
    if (!website) return;
    
    try {
      const result = await onRegenerateToken(website.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.data?.verificationToken) {
        setDisplayToken(result.data.verificationToken);
        toast.success("Token regenerated", {
          description: "Please update your DNS record with the new token.",
        });
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast.error("Failed to regenerate token");
    }
  }, [website, onRegenerateToken]);

  const handleClose = useCallback(() => {
    setSelectedWebsite(null);
    setShowVerificationDialog(false);
    onOpenChange(false);
  }, [setSelectedWebsite, setShowVerificationDialog, onOpenChange]);

  const isVerified = website?.verificationStatus === "VERIFIED";
  
  // If not open, don't render anything (optimization)
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Domain</DialogTitle>
          <DialogDescription>
            Verify ownership of {website?.domain} by adding a DNS record.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">DNS Verification</h4>
            <p className="text-sm text-muted-foreground">
              Add the following DNS TXT record to verify ownership of your domain:
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">TXT Record:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    const dnsRecord = `_databuddy.${getDomainForDNS(website?.domain || '')}`;
                    navigator.clipboard.writeText(dnsRecord);
                    toast("DNS record name copied to clipboard");
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="mt-1">_databuddy.{getDomainForDNS(website?.domain || '')}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Value:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(displayToken);
                    toast("Verification token copied to clipboard");
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="mt-1">{displayToken}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: DNS changes can take up to 48 hours to propagate. If verification fails, wait a while and try again.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyDomain}
              disabled={isVerifying || isVerified}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : isVerified ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Verified
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Verify Domain
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerateToken}
              disabled={isRegenerating || isVerified}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}); 