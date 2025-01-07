program zkoi_test2.aleo {

// Contract owner. Locks certain functions to the hard-coded address.
const contract_owner: address = aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec;

// --------------------------------------------
// Structs
// --------------------------------------------

struct BaseURI {
    data0: u128,
    data1: u128,
    data2: u128,
    data3: u128,
}

struct TokenId {
    id0: u128,
    id1: u128,
}

struct approval {
    approver: address,
    spender: address,
}

// We removed `struct nft_content` since you no longer store full metadata on-chain.

// --------------------------------------------
// Records
// --------------------------------------------

record NFT_claim {
    private owner: address,
    private claim_owner: address,
    private claim: field,
}

record NFT {
    private owner: address,
    private data: TokenId,
    private edition: scalar,
}

record NFTView {
    private owner: address,
    private data: TokenId,
    private edition: scalar,
    public is_view: bool,
}

record NFT_mint {
    private owner: address,
    private minter_address: address,
    private amount: u8,
}

record PublicNFT {
    private owner: address,
    public nft_owner: address,
    public data: TokenId,
    public edition: scalar,
}

record NFT_ownership {
    private owner: address,
    private nft_owner: address,
    private data: TokenId,
    private edition: scalar,
}

// --------------------------------------------
// Mappings
// --------------------------------------------
mapping toggle_settings: u8 => u32;
mapping general_settings: u8 => u128;
mapping nfts_to_mint: u128 => field;
mapping claims_to_nfts: field => field;
mapping nft_commits: field => bool;
mapping nft_owners: field => address;
mapping for_all_approvals: field => bool;
mapping nft_approvals: field => field;

// We removed `mapping nft_contents: field => nft_content;`

// --------------------------------------------
// Helper Function
// --------------------------------------------

// Generates a unique cryptographic commitment for an NFT by
// hashing its token_id (URL) and combining it with the edition.
inline commit_nft(
    token_id: TokenId,
    nft_edition: scalar
) -> field {
    let id_hash: field = BHP256::hash_to_field(token_id);
    let commitment: field = BHP256::commit_to_field(id_hash, nft_edition);
    return commitment;
}

// --------------------------------------------
// prove_ownership & verify_ownership
// --------------------------------------------

transition prove_ownership(
    private nft: NFT,
) -> NFT_ownership {
    let ownership_proof: NFT_ownership = NFT_ownership {
        owner: self.caller,
        nft_owner: nft.owner,
        data: nft.data,
        edition: nft.edition,
    };

    return ownership_proof;
}

transition verify_ownership(
    private proof: NFT_ownership,
    private tokenId: TokenId,
    private edition: scalar,
) -> bool {
    assert_eq(proof.data, tokenId);
    assert_eq(proof.edition, edition);
    assert_eq(proof.nft_owner, self.caller);

    return true;
}

// --------------------------------------------
// Transfers
// --------------------------------------------

// Private -> Private
transition transfer_private(
    private nft: NFT,
    private to: address,
) -> NFT {
    return NFT {
        owner: to,
        data: nft.data,
        edition: nft.edition,
    };
}

// Private -> Public
async transition transfer_priv_to_pub(
    private nft: NFT,
    public to: address,
) -> (NFTView, Future) {
    let nft_commit: field = commit_nft(nft.data, nft.edition);

    let nft_view: NFTView = NFTView {
        owner: to,
        data: nft.data,
        edition: nft.edition,
        is_view: true
    };

    let transfer_future: Future = finalize_transfer_priv_to_pub(
        to, nft_commit
    );
    return (nft_view, transfer_future);
}

async function finalize_transfer_priv_to_pub(
    to: address,
    nft_commit: field,
) {
    nft_owners.set(nft_commit, to);
}

// Public -> Public
async transition transfer_public(
    private token_id: TokenId,
    private nft_edition: scalar,
    public to: address,
) -> (NFTView, Future) {
    let nft_commit: field = commit_nft(token_id, nft_edition);
    let caller: address = self.caller;

    let nft_view: NFTView = NFTView {
        owner: to,
        data: token_id,
        edition: nft_edition,
        is_view: true
    };

    let transfer_future: Future = finalize_transfer_public(
        to, nft_commit, caller
    );

    return (nft_view, transfer_future);
}

async function finalize_transfer_public(
    to: address,
    nft_commit: field,
    caller: address,
) {
    let owner: address = nft_owners.get(nft_commit);
    assert_eq(caller, owner);
    nft_approvals.remove(nft_commit);
    nft_owners.set(nft_commit, to);
}

// Public -> Public (signer-based)
async transition transfer_pub_as_signer(
    private token_id: TokenId,
    private nft_edition: scalar,
    public to: address,
) -> (NFTView, Future) {
    let nft_commit: field = commit_nft(token_id, nft_edition);
    let signer: address = self.signer;

    let nft_view: NFTView = NFTView {
        owner: to,
        data: token_id,
        edition: nft_edition,
        is_view: true
    };

    let transfer_future: Future = finalize_transfer_pub_as_signer(
        to, nft_commit, signer
    );

    return (nft_view, transfer_future);
}

async function finalize_transfer_pub_as_signer(
    to: address,
    nft_commit: field,
    signer: address,
) {
    let owner: address = nft_owners.get(nft_commit);
    assert_eq(signer, owner);
    nft_approvals.remove(nft_commit);
    nft_owners.set(nft_commit, to);
}

// Public -> Private
async transition transfer_pub_to_priv(
    private token_id: TokenId,
    private nft_edition: scalar,
    private to: address,
) -> (NFT, Future) {
    let nft_commit: field = commit_nft(token_id, nft_edition);
    let caller: address = self.caller;

    let finalize_future: Future = finalize_transfer_pub_to_priv(
        caller, nft_commit
    );

    let received_nft: NFT = NFT {
        owner: to,
        data: token_id,
        edition: nft_edition,
    };

    return (received_nft, finalize_future);
}

async function finalize_transfer_pub_to_priv(
    caller: address,
    nft_commit: field,
) {
    let owner: address = nft_owners.get(nft_commit);
    assert_eq(caller, owner);
    nft_approvals.remove(nft_commit);
    nft_owners.remove(nft_commit);
}

// --------------------------------------------
// Approvals
// --------------------------------------------

async transition set_for_all_approval(
    private spender: address,
    public new_value: bool,
) -> Future {
    let apvl: approval = approval {
        approver: self.caller,
        spender: spender,
    };
    let apvl_hash: field = BHP256::hash_to_field(apvl);

    return finalize_set_for_all_approval(
        apvl_hash, new_value
    );
}

async function finalize_set_for_all_approval(
    apvl_hash: field,
    new_value: bool,
) {
    for_all_approvals.set(apvl_hash, new_value);
}

async transition approve_public(
    private spender: address,
    private token_id: TokenId,
    private nft_edition: scalar,
) -> Future {
    let nft_commit: field = commit_nft(token_id, nft_edition);

    let apvl: approval = approval {
        approver: self.caller,
        spender: spender,
    };
    let apvl_hash: field = BHP256::hash_to_field(apvl);

    return finalize_approve_public(
        self.caller, apvl_hash, nft_commit
    );
}

async function finalize_approve_public(
    caller: address,
    apvl_hash: field,
    nft_commit: field,
) {
    let owner: address = nft_owners.get(nft_commit);
    assert_eq(owner, caller);
    nft_approvals.set(nft_commit, apvl_hash);
}

async transition transfer_from_public(
    public from: address,
    public to: address,
    private token_id: TokenId,
    private nft_edition: scalar,
) -> (NFTView, Future) {
    let nft_commit: field = commit_nft(token_id, nft_edition);

    let nft_view: NFTView = NFTView {
        owner: to,
        data: token_id,
        edition: nft_edition,
        is_view: true
    };

    let apvl: approval = approval {
        approver: from,
        spender: self.caller,
    };
    let apvl_hash: field = BHP256::hash_to_field(apvl);

    let transfer_future: Future = finalize_transfer_from_public(
        apvl_hash, from, to, nft_commit
    );

    return (nft_view, transfer_future);
}

async function finalize_transfer_from_public(
    apvl_hash: field,
    from: address,
    to: address,
    nft_commit: field,
) {
    assert(
        nft_approvals.contains(nft_commit)
        || for_all_approvals.get_or_use(apvl_hash, false)
    );

    let owner: address = nft_owners.get(nft_commit);
    assert_eq(from, owner);

    nft_approvals.remove(nft_commit);
    nft_owners.set(nft_commit, to);
}

// --------------------------------------------
// Update edition
// --------------------------------------------

async transition update_edition_private(
    private nft: NFT,
    private new_edition: scalar,
) -> (NFT, Future) {
    let out_nft: NFT = NFT {
        owner: nft.owner,
        data: nft.data,
        edition: new_edition,
    };
    let nft_commit: field = commit_nft(nft.data, new_edition);

    let update_future: Future = finalize_update_edition_private(
        nft_commit
    );

    return (out_nft, update_future);
}

async function finalize_update_edition_private(
    nft_commit: field,
) {
    assert(nft_commits.contains(nft_commit).not());
    nft_commits.set(nft_commit, true);
}

// --------------------------------------------
// Minting
// --------------------------------------------

async transition mint(
    private token_id: TokenId,
    private nft_edition: scalar,
    private to: address,
) -> (NFT, Future) {
    // Create a unique commitment for the new NFT.
    let nft_commit: field = commit_nft(token_id, nft_edition);

    // Call the async function to validate and store the NFT.
    let mint_future: Future = finalize_mint(nft_commit, to);

    // Return the new NFT and the future.
    let nft: NFT = NFT {
        owner: to,
        data: token_id,
        edition: nft_edition,
    };

    return (nft, mint_future);
}

async function finalize_mint(
    nft_commit: field,
    to: address,
) {
    // Ensure the NFT is unique.
    assert(nft_commits.contains(nft_commit).not());

    // Store the NFT commitment and ownership.
    nft_commits.set(nft_commit, true);
    nft_owners.set(nft_commit, to);
}

// --------------------------------------------
// Initialize collection
// --------------------------------------------

async transition initialize_collection(
    public total: u128,
    public symbol: u128,
    public base_uri: BaseURI,
) -> Future {
    // Ensure only the specified caller can initialize.
    assert_eq(
        self.caller,
        contract_owner
    );

    let init_future: Future = finalize_initialize_collection(
        total, symbol, base_uri
    );

    return init_future;
}

async function finalize_initialize_collection(
    total: u128,
    symbol: u128,
    base_uri: BaseURI,
) {
    // Ensure initialize cannot be called twice!
    let toggle_settings_status: u32 = toggle_settings.get_or_use(0u8, 0u32);
    let is_initialized: u32 = toggle_settings_status & 1u32;
    assert_eq(is_initialized, 0u32);

    // Set general settings.
    general_settings.set(0u8, 0u128); // Number of mintable NFTs (all editions).
    general_settings.set(1u8, total); // Total NFTs (first-editions).
    general_settings.set(2u8, symbol); // Symbol for the NFT.
    general_settings.set(3u8, base_uri.data0); 
    general_settings.set(4u8, base_uri.data1); 
    general_settings.set(5u8, base_uri.data2); 
    general_settings.set(6u8, base_uri.data3); 

    // Default flags: not frozen, whitelist required, not minting, initialized.
    // Flags value = 0b0101 = 5u32.
    toggle_settings.set(0u8, 5u32);
    toggle_settings.set(1u8, 0u32); // Block height when minting is allowed.
}

// --------------------------------------------
// Add NFT to the collection
// --------------------------------------------

async transition add_nft(
    public tokenId: TokenId,
    public edition: scalar,
) -> Future {
    // Ensure only the specified caller can add an NFT.
    assert_eq(
        self.caller,
        contract_owner
    );

    // Compute the token hashes.
    let tokenHash: field = BHP256::hash_to_field(tokenId);
    let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);

    let add_nft_future: Future = finalize_add_nft(tokenEditionHash);

    return add_nft_future;
}

async function finalize_add_nft(
    tokenEditionHash: field,
) {
    // Ensure the collection is initialized and not frozen.
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    // Initialized & frozen flags = 0b1001 = 9u32.
    // Required = 0b0001 = 1u32.
    let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
    assert_eq(is_initialized_and_not_frozen, 1u32);

    // Reduce the amount of total NFTs that can be initialized.
    let remaining: u128 = general_settings.get(1u8);
    general_settings.set(1u8, remaining - 1u128);

    // Add this NFT to the mintable NFT collection.
    let mintable_num: u128 = general_settings.get(0u8);
    nfts_to_mint.set(mintable_num, tokenEditionHash);
    general_settings.set(0u8, mintable_num + 1u128);
}

// --------------------------------------------
// Add a minter
// --------------------------------------------

async transition add_minter(
    private minter: address,
    public amount: u8,
) -> (NFT_mint, Future) {
    // Ensure only the specified caller can add a minter.
    assert_eq(
        self.caller,
        contract_owner
    );

    let nft_mint: NFT_mint = NFT_mint {
        minter_address: minter,
        amount,
    };

    let add_minter_future: Future = finalize_add_minter();
    return (nft_mint, add_minter_future);
}

async function finalize_add_minter() {
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
    assert_eq(is_initialized_and_not_frozen, 1u32);
}

// --------------------------------------------
// Toggle settings
// --------------------------------------------

async transition update_toggle_settings(
    public toggle_settings_bitstring: u32,
) -> Future {
    assert_eq(
        self.caller,
        contract_owner
    );

    let update_future: Future = finalize_update_toggle_settings(toggle_settings_bitstring);
    return update_future;
}

async function finalize_update_toggle_settings(
    toggle_settings_bitstring: u32,
) {
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
    assert_eq(is_initialized_and_not_frozen, 1u32);

    // Ensure we don't uninitialize the collection:
    let still_initialized: u32 = toggle_settings_bitstring & 1u32;
    assert_eq(still_initialized, 1u32);

    toggle_settings.set(0u8, toggle_settings_bitstring);
}

// --------------------------------------------
// Set mint block
// --------------------------------------------

async transition set_mint_block(
    public mint_block: u32,
) -> Future {
    assert_eq(
        self.caller,
        contract_owner
    );
    let set_block_future: Future = finalize_set_mint_block(mint_block);
    return set_block_future;
}

async function finalize_set_mint_block(
    mint_block: u32,
) {
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
    assert_eq(is_initialized_and_not_frozen, 1u32);

    toggle_settings.set(1u8, mint_block);
}

// --------------------------------------------
// Update symbol
// --------------------------------------------

async transition update_symbol(
    public symbol: u128,
) -> Future {
    assert_eq(
        self.caller,
        contract_owner
    );
    let update_symbol_future: Future = finalize_update_symbol(symbol);
    return update_symbol_future;
}

async function finalize_update_symbol(
    symbol: u128,
) {
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
    assert_eq(is_initialized_and_not_frozen, 1u32);

    general_settings.set(2u8, symbol);
}

// --------------------------------------------
// Update base URI
// --------------------------------------------

async transition update_base_uri(
    public base_uri: BaseURI,
) -> Future {
    assert_eq(
        self.caller,
        contract_owner
    );
    let update_base_uri_future: Future = finalize_update_base_uri(base_uri);
    return update_base_uri_future;
}

async function finalize_update_base_uri(
    base_uri: BaseURI,
) {
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
    assert_eq(is_initialized_and_not_frozen, 1u32);

    general_settings.set(3u8, base_uri.data0);
    general_settings.set(4u8, base_uri.data1);
    general_settings.set(5u8, base_uri.data2);
    general_settings.set(6u8, base_uri.data3);
}

// --------------------------------------------
// Open mint
// --------------------------------------------

async transition open_mint(
    private hiding_nonce: scalar,
) -> (NFT_claim, Future) {
    let address_hash: field = BHP256::hash_to_field(self.caller);
    let claim: field = BHP256::commit_to_field(address_hash, hiding_nonce);

    let nft_claim: NFT_claim = NFT_claim {
        claim_owner: self.caller,
        claim,
    };

    let mint_future: Future = finalize_open_mint(claim);
    return (nft_claim, mint_future);
}

async function finalize_open_mint(
    claim: field,
) {
    // Ensure block height is okay.
    let mint_block: u32 = toggle_settings.get(1u8);
    let passed_height_check: bool = mint_block <= block.height;
    assert_eq(passed_height_check, true);

    // Ensure not frozen, no whitelist, minting allowed, and initialized
    // = 0b0011 = 3u32 when masked with 0b1111 = 15u32.
    let toggle_settings_status: u32 = toggle_settings.get(0u8);
    let collection_settings_met: u32 = toggle_settings_status & 15u32;
    assert_eq(collection_settings_met, 3u32);

    // Ensure this claim not used.
    let existing_claim: field = claims_to_nfts.get_or_use(claim, 0field);
    assert_eq(existing_claim, 0field);

    // Randomly select an NFT to mint.
    let randomNum: u128 = ChaCha::rand_u128();
    let old_mintable_sum: u128 = general_settings.get_or_use(0u8, 0u128);
    let randomIndex: u128 = randomNum % old_mintable_sum;
    let tokenEditionHash: field = nfts_to_mint.get(randomIndex);

    claims_to_nfts.set(claim, tokenEditionHash);

    // Decrease the number of mintable NFTs.
    let new_mintable_num: u128 = old_mintable_sum - 1u128;
    general_settings.set(0u8, new_mintable_num);

    // Replace the minted NFT with the last NFT in the array.
    nfts_to_mint.set(randomIndex, nfts_to_mint.get(new_mintable_num));
}

// --------------------------------------------
// Claim NFT
// --------------------------------------------

async transition claim_nft(
    nft_claim: NFT_claim,
    private tokenId: TokenId,
    private edition: scalar,
) -> (PublicNFT, Future<Fn(field, field)>) {
    let tokenHash: field = BHP256::hash_to_field(tokenId);
    let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);

    let public_nft: PublicNFT = PublicNFT {
        nft_owner: nft_claim.claim_owner,
        data: tokenId,
        edition,
    };

    let claim_future: Future<Fn(field, field)> = finalize_claim_nft(
        nft_claim.claim,
        tokenEditionHash
    );

    return (public_nft, claim_future);
}

async function finalize_claim_nft(
    claim: field,
    tokenEditionHash: field,
) {
    let claimedNFT: field = claims_to_nfts.get(claim);
    assert_eq(claimedNFT, tokenEditionHash);

    // Clear the claim
    claims_to_nfts.set(claim, 0field);
}

}
