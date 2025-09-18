// feeCalculator.ts

export interface FeeMapping {
    [functionName: string]: number; // fee in credits
  }
  
  // Hard-coded fee values in credits
  export const defaultFeeValues: FeeMapping = {
    post_bounty: 0.1, // Increased due to escrow creation
    submit_proposal: 0.05,
    accept_proposal: 0.07, // Increased due to escrow release
    deny_proposal: 0.02,
    cancel_bounty_escrow: 0.05, // Increased for escrow cancel function
    delete_bounty: 0.04,
    transfer_public: 0.05,
    transfer_private: 0.05,
  };
  
  /**
   * Returns the fee for a given function in micro credits.
   * (1 credit = 1,000,000 micro credits)
   */
  export function getFeeForFunction(functionName: string): number {
    const feeInCredits = defaultFeeValues[functionName];
    if (feeInCredits === undefined) {
      throw new Error(`No fee value found for function: ${functionName}`);
    }
    return feeInCredits * 1_000_000; // convert credits to micro credits
  }
  