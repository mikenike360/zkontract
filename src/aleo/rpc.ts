import { JSONRPCClient } from 'json-rpc-2.0';

export const TESTNETBETA_API_URL = process.env.RPC_URL!;
export const BOUNTY_PROGRAM_ID = 'zkontractv4.aleo';
export const CREDITS_PROGRAM_ID = 'credits.aleo';
const ALEO_URL = 'https://testnetbeta.aleorpc.com/';

// Create the JSON-RPC client
export const client = getClient(TESTNETBETA_API_URL);

/**
 * Utility to fetch program transactions
 */
export async function getProgramTransactions(
  functionName: string,
  page = 0,
  maxTransactions = 100
) {
  return client.request('aleoTransactionsForProgram', {
    programId: BOUNTY_PROGRAM_ID,
    functionName,
    page,
    maxTransactions,
  });
}

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
 * 1. Post Bounty
 */
export async function postBounty(
  caller: string,
  bountyId: number,
  reward: number
): Promise<string> {
  const inputs = [
    `${caller}.private`,
    `${bountyId}.private`,
    `${caller}.private`,
    `${reward}.private`,
  ];
  const result = await client.request('executeTransition', {
    programId: BOUNTY_PROGRAM_ID,
    functionName: 'post_bounty',
    inputs,
  });
  if (!result.transactionId) {
    throw new Error('Transaction failed: No transactionId returned.');
  }
  return result.transactionId;
}

/**
 * 2. View Bounty by ID
 */
export async function viewBountyById(
  bountyId: number
): Promise<{ payment: number; status: number }> {
  const inputs = [`${bountyId}.private`];
  const result = await client.request('executeTransition', {
    programId: BOUNTY_PROGRAM_ID,
    functionName: 'view_bounty_by_id',
    inputs,
  });

  // Fetch finalized data from the mappings
  const payment = await fetchMappingValue('bounty_output_payment', bountyId);
  const status = await fetchMappingValue('bounty_output_status', bountyId);

  return { payment, status };
}

/**
 * 3. Submit Proposal
 */
export async function submitProposal(
  caller: string,
  bountyId: number,
  proposalId: number,
  proposer: string
): Promise<string> {
  const inputs = [
    `${caller}.private`,
    `${bountyId}.private`,
    `${proposalId}.private`,
    `${proposer}.private`,
  ];
  const result = await client.request('executeTransition', {
    programId: BOUNTY_PROGRAM_ID,
    functionName: 'submit_proposal',
    inputs,
  });
  return result.transactionId;
}

/**
 * 4. Accept Proposal
 */
export async function acceptProposal(
  caller: string,
  bountyId: number,
  proposalId: number,
  creator: string
): Promise<string> {
  const inputs = [
    `${caller}.private`,
    `${bountyId}.private`,
    `${proposalId}.private`,
    `${creator}.private`,
  ];
  const result = await client.request('executeTransition', {
    programId: BOUNTY_PROGRAM_ID,
    functionName: 'accept_proposal',
    inputs,
  });
  return result.transactionId;
}

/**
 * 5. Delete Bounty
 */
export async function deleteBounty(
  caller: string,
  bountyId: number
): Promise<string> {
  const inputs = [`${caller}.private`, `${bountyId}.private`];
  const result = await client.request('executeTransition', {
    programId: BOUNTY_PROGRAM_ID,
    functionName: 'delete_bounty',
    inputs,
  });
  return result.transactionId;
}

/**
 * 6. Wait for Transaction Finalization
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
 * 7. Transfer Payment
 */
export async function transfer(
  caller: string,
  receiver: string,
  amount: number
): Promise<string> {
  const inputs = [`${caller}.private`, `${receiver}.private`, `${amount}.private`];
  const result = await client.request('executeTransition', {
    programId: BOUNTY_PROGRAM_ID,
    functionName: 'transfer',
    inputs,
  });
  if (!result.transactionId) {
    throw new Error('Transaction failed: No transactionId returned.');
  }
  return result.transactionId;
}


/**
 * Helper to Fetch Mapping Values
 */
export async function fetchMappingValue(
  mappingName: string,
  key: number
): Promise<any> {
  try {
    const result = await client.request('getMappingValue', {
      programId: BOUNTY_PROGRAM_ID,
      mappingName,
      key: `${key}.public`,
    });
    return parseInt(result.value, 10);
  } catch (error) {
    console.error(`Failed to fetch mapping ${mappingName} for key ${key}: ${error}`);
    throw error;
  }
}

/**
 * Utility to Create JSON-RPC Client
 */
export function getClient(apiUrl: string): JSONRPCClient {
  const client: JSONRPCClient = new JSONRPCClient((jsonRPCRequest: any) =>
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonRPCRequest),
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((jsonRPCResponse) =>
          client.receive(jsonRPCResponse)
        );
      }
      throw new Error(response.statusText);
    })
  );
  return client;
}

/**
 * Get Verifying Key for a Function
 */
async function getDeploymentTransaction(programId: string): Promise<any> {
  const response = await fetch(`${ALEO_URL}find/transactionID/deployment/${programId}`);
  const deployTxId = await response.json();
  const txResponse = await fetch(`${ALEO_URL}transaction/${deployTxId}`);
  const tx = await txResponse.json();
  return tx;
}

export async function getVerifyingKey(
  programId: string,
  functionName: string
): Promise<string> {
  const deploymentTx = await getDeploymentTransaction(programId);

  const allVerifyingKeys = deploymentTx.deployment.verifying_keys;
  const verifyingKey = allVerifyingKeys.filter((vk: any) => vk[0] === functionName)[0][1][0];
  return verifyingKey;
}

export async function getProgram(programId: string, apiUrl: string): Promise<string> {
  const client = getClient(apiUrl);
  const program = await client.request('program', {
    id: programId
  });
  return program;
}