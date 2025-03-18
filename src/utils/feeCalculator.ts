// feeCalculator.ts

export interface FeeMapping {
    [functionName: string]: number; // fee in credits
  }
  
  // Hard-coded fee values in credits
  export const defaultFeeValues: FeeMapping = {
    post_bounty: 0.051598,
    submit_proposal: 0.042786,
    accept_proposal: 0.027616,
    deny_proposal: 0.01445,
    delete_bounty: 0.033482,
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
  