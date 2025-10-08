// Frontend utility for signing API requests
// Use this in your React components before making authenticated API calls

/**
 * FRONTEND USAGE EXAMPLE:
 * 
 * import { signRequest } from '@/utils/signing';
 * import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
 * 
 * const { wallet, publicKey } = useWallet();
 * 
 * async function deleteBounty(bountyId: number) {
 *   const auth = await signRequest(wallet, 'delete_bounty', { bountyId });
 *   
 *   await fetch('/api/delete-bounty', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       caller: publicKey,
 *       bountyId,
 *       ...auth
 *     })
 *   });
 * }
 */

import type { WalletAdapter } from '@demox-labs/aleo-wallet-adapter-base';

export interface SignedRequest {
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
}

/**
 * Sign a request for API authentication
 * @param wallet - Connected Aleo wallet adapter
 * @param action - Action being performed (e.g., 'delete_bounty', 'update_status')
 * @param data - Data associated with the action (e.g., { bountyId: 123 })
 * @returns Signed request object to include in API call
 */
export async function signRequest(
  wallet: WalletAdapter | null,
  action: string,
  data: Record<string, any>
): Promise<SignedRequest> {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  
  // Create message to sign
  const message = JSON.stringify({
    action,
    ...data,
    timestamp,
    nonce,
  });

  try {
    // Sign the message with the wallet
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await wallet.signMessage(messageBytes);
    
    // Convert signature to base64 for transport
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    return {
      signature,
      message,
      timestamp,
      nonce,
    };
  } catch (error) {
    console.error('Error signing request:', error);
    throw new Error('Failed to sign request. Please try again.');
  }
}

/**
 * Helper to make authenticated API calls
 * @param wallet - Connected Aleo wallet
 * @param publicKey - User's public key
 * @param endpoint - API endpoint (e.g., '/api/delete-bounty')
 * @param action - Action being performed
 * @param data - Request data
 */
export async function makeAuthenticatedRequest(
  wallet: WalletAdapter | null,
  publicKey: string | null,
  endpoint: string,
  action: string,
  data: Record<string, any>
): Promise<Response> {
  if (!wallet || !publicKey) {
    throw new Error('Wallet not connected');
  }

  // Sign the request
  const auth = await signRequest(wallet, action, data);
  
  // Make the API call
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caller: publicKey,
      ...data,
      ...auth,
    }),
  });
}

