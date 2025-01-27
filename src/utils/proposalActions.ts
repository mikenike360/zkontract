import { Transaction, WalletAdapterNetwork,} from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { BountyData, ProposalData } from '@/components/ui/ProposalItem';
import { transferPublic } from '@/aleo/rpc';

export const CREDITS_PROGRAM_ID = 'credits.aleo';
const BOUNTY_PROGRAM_ID = 'zkontractv4.aleo';
const ACCEPT_PROPOSAL_FUNCTION = 'accept_proposal';
const TRANSFER_PUBLIC_FUNCTION = 'transfer_public'

export async function handleAcceptSolution(
  wallet: any,
  publicKey: string,
  bounty: BountyData,
  proposal: ProposalData,
  setTxStatus: (status: string | null) => void,
  mutate: () => void
) {
  if (!wallet || !publicKey) {
    alert('Connect your wallet before accepting proposals.');
    return;
  }

  const rewardAmount = `${bounty.reward}0000u64`;

  try {
  
    // // Step 1: Transfer the reward to the proposer
    // for some reason the reward if formatted differently. Need to improve this.
    
    const rewardAmountforTransfer = `${bounty.reward}000000u64`;

    setTxStatus('Transferring reward to proposer...');

    const transferInput = [
      `${proposal.proposerAddress}`,
      `${rewardAmountforTransfer}`,
    ];

    const fee = 100000;

    // Create the transaction
    const transTX = Transaction.createTransaction(
        publicKey,                                   
        WalletAdapterNetwork.TestnetBeta,                 
        CREDITS_PROGRAM_ID,                               
        TRANSFER_PUBLIC_FUNCTION,                                     
        transferInput,                                        
        fee,      
        false                                            
      );

    const acceptTxTrans = await (wallet.adapter as LeoWalletAdapter).requestTransaction(transTX);
    console.log('Transfer public credits transaction submitted:', acceptTxTrans);

    setTxStatus('Waiting for transfer_public transaction to finalize...');
    let transFinalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(acceptTxTrans);
      if (status === 'Finalized') {
        transFinalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!transFinalized) {
      throw new Error('transfer_public transaction not finalized in time.');
    }
  
    // Step 2: Accept the proposal
    setTxStatus('Accepting proposal...');
    const acceptInputs = [
      publicKey, // Caller
      `${bounty.id}u64`, // Bounty ID
      `${proposal.proposalId}u64`, // Proposal ID
      publicKey, // Creator address
      rewardAmount, // Payment amount
    ];

    const acceptFee = 100000; // Fixed fee for accepting the proposal
    const acceptTx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      BOUNTY_PROGRAM_ID,
      ACCEPT_PROPOSAL_FUNCTION,
      acceptInputs,
      acceptFee,
      true
    );

    const acceptTxId = await (wallet.adapter as LeoWalletAdapter).requestTransaction(acceptTx);
    console.log('Accept proposal transaction submitted:', acceptTxId);

    setTxStatus('Waiting for accept_proposal transaction to finalize...');
    let acceptFinalized = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const status = await (wallet.adapter as LeoWalletAdapter).transactionStatus(acceptTxId);
      if (status === 'Finalized') {
        acceptFinalized = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }

    if (!acceptFinalized) {
      throw new Error('accept_proposal transaction not finalized in time.');
    }

    // Step 3: Update the proposal status in the database
    await fetch('/api/update-proposal-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bountyId: bounty.id,
        proposalId: proposal.proposalId,
        newStatus: 'accepted',
      }),
    });

    alert('Proposal accepted successfully! The reward has been sent.');
    mutate();
  } catch (err) {
    console.error('Error accepting proposal:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    setTxStatus(null);
  }
}

export async function handleDenySolution(bounty: BountyData, proposal: ProposalData) {
  console.log(bounty);
  console.log(proposal);
}
