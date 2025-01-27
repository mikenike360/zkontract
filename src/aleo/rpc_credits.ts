import {client} from './rpc';

export const TESTNETBETA_API_URL = process.env.RPC_URL!;
export const CREDITS_PROGRAM_ID = 'credits.aleo';

const ALEO_URL = 'https://testnetbeta.aleorpc.com/';


/**
 * Transfer credits publicly between two accounts.
 */
export async function transferPublic(
  recipient: string,
  amount: string
): Promise<string> {
  const inputs = [
    `${recipient}.public`, // Recipient's public address
    `${amount}u64`,    // Amount to transfer
  ];

  const result = await client.request('executeTransition', {
    programId: CREDITS_PROGRAM_ID,
    functionName: 'transfer_public',
    inputs,
  });

  if (!result.transactionId) {
    throw new Error('Transaction failed: No transactionId returned.');
  }
  return result.transactionId;
}

/**
 * Wait for a transaction to finalize.
 */
export async function waitForTransactionToFinalize(
  transactionId: string
): Promise<boolean> {
  const maxRetries = 30;
  const delay = 1000; // 1 second
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const status = await client.request('getTransactionStatus', { id: transactionId });
      if (status === 'finalized') {
        return true;
      }
    } catch (error) {
      console.error(`Failed to get transaction status: ${error}`);
    }
    retries++;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false; // Return false if transaction is not finalized
}

/**
 * Fetch transactions for a specific function in the program.
 */
export async function getTransactionsForProgram(
  functionName: string,
  page = 0,
  maxTransactions = 100
): Promise<any> {
  return client.request('aleoTransactionsForProgram', {
    programId: CREDITS_PROGRAM_ID,
    functionName,
    page,
    maxTransactions,
  });
}

/**
 * Fetch details for a specific transaction.
 */
export const getAleoTransaction = async (id: string): Promise<any> => {
  return await client.request('aleoTransaction', { id });
};

/**
 * Fetch mapping values for a specific key in a program.
 */
export async function fetchMappingValue(
  mappingName: string,
  key: string
): Promise<any> {
  try {
    const result = await client.request('getMappingValue', {
      programId: CREDITS_PROGRAM_ID,
      mappingName,
      key: `${key}.public`,
    });
    return result.value;
  } catch (error) {
    console.error(`Failed to fetch mapping ${mappingName} for key ${key}: ${error}`);
    throw error;
  }
}

/**
 * Fetch deployment transaction details.
 */
async function getDeploymentTransaction(programId: string): Promise<any> {
  const response = await fetch(`${ALEO_URL}find/transactionID/deployment/${programId}`);
  const deployTxId = await response.json();
  const txResponse = await fetch(`${ALEO_URL}transaction/${deployTxId}`);
  return await txResponse.json();
}

/**
 * Get the verifying key for a function in the program.
 */
export async function getVerifyingKey(
  programId: string,
  functionName: string
): Promise<string> {
  const deploymentTx = await getDeploymentTransaction(programId);
  const allVerifyingKeys = deploymentTx.deployment.verifying_keys;
  const verifyingKey = allVerifyingKeys.filter((vk: any) => vk[0] === functionName)[0][1][0];
  return verifyingKey;
}
