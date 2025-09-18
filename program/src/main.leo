
import zk_escrow_v3.aleo;

program zkontract_v4.aleo {

    const contract_owner: address = aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec;

    const BOUNTY_STATUS_OPEN: u8 = 0u8;
    const BOUNTY_STATUS_COMPLETED: u8 = 1u8;

    const PROPOSAL_STATUS_PENDING: u8 = 0u8;
    const PROPOSAL_STATUS_ACCEPTED: u8 = 1u8;
    const PROPOSAL_STATUS_DENIED: u8 = 2u8;

    mapping bounty_creator: u64 => address;
    mapping bounty_payment: u64 => u64;
    mapping bounty_status: u64 => u8;
    mapping bounty_escrow_id: u64 => u64; // Maps bounty ID to escrow ID

    mapping proposal_bounty_id: u64 => u64;
    mapping proposal_proposer: u64 => address;
    mapping proposal_status: u64 => u8;

    mapping all_bounties: u64 => bool;
    mapping bounty_output_payment: u64 => u64;
    mapping bounty_output_status: u64 => u8;
    mapping account: address => u64;

    @noupgrade
    async constructor() {
        // The Leo compiler automatically generates the constructor logic.
    }

    // Async function to set bounty details
    async function finalize_post_bounty(
        escrow_future: Future,
        bounty_id: u64,
        creator_address: address,
        payment_amount: u64
    ) {
        escrow_future.await();
        
        assert(!bounty_creator.contains(bounty_id)); // Ensure bounty ID is unique.

        bounty_creator.set(bounty_id, creator_address);
        bounty_payment.set(bounty_id, payment_amount);
        bounty_status.set(bounty_id, BOUNTY_STATUS_OPEN);
        bounty_escrow_id.set(bounty_id, bounty_id); // Use bounty ID as escrow ID

        all_bounties.set(bounty_id, true);
    }

    // Transition to post a bounty
    async transition post_bounty(
        caller: address,
        bounty_id: u64,
        creator_address: address,
        payment_amount: u64
    ) -> Future {
        assert_eq(caller, creator_address); // Ensure the caller is the creator.
        assert(payment_amount > 0u64); // Ensure payment amount is positive
        assert(bounty_id > 0u64); // Ensure bounty ID is positive

        // Create escrow for this bounty - set creator as both sender and temporary recipient
        // When proposal is accepted, we'll create a new escrow with the actual proposer as recipient
        let escrow_future: Future = zk_escrow_v3.aleo/create_escrow(bounty_id, creator_address, payment_amount);
        
        // Return combined future
        return finalize_post_bounty(escrow_future, bounty_id, creator_address, payment_amount);
    }

    async function finalize_view_bounty_by_id(bounty_id: u64) {
        // Ensure the bounty exists
        assert(bounty_creator.contains(bounty_id));

        // Retrieve bounty details
        let payment: u64 = bounty_payment.get(bounty_id);
        let status: u8 = bounty_status.get(bounty_id);

        // Store results in output mappings
        bounty_output_payment.set(bounty_id, payment);
        bounty_output_status.set(bounty_id, status);
    }

    async transition view_bounty_by_id(bounty_id: u64) -> Future {
        // Call the finalize function
        let finalize_future: Future = finalize_view_bounty_by_id(bounty_id);
        return finalize_future;
    }

    // Async function to finalize proposal submission
    async function finalize_submit_proposal(
        composite_proposal_id: u64,
        bounty_id: u64,
        proposer_address: address
    ) {
        assert(bounty_creator.contains(bounty_id)); // Ensure bounty exists.
        assert(!proposal_bounty_id.contains(composite_proposal_id)); // Ensure proposal ID is unique.

        proposal_bounty_id.set(composite_proposal_id, bounty_id);
        proposal_proposer.set(composite_proposal_id, proposer_address);
        proposal_status.set(composite_proposal_id, PROPOSAL_STATUS_PENDING);
    }

    // Transition to submit a proposal
    async transition submit_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64,
        proposer_address: address
    ) -> Future {
        assert_eq(caller, proposer_address); // Ensure the caller is the proposer.
        assert(proposal_id > 0u64); // Ensure proposal ID is positive
        assert(bounty_id > 0u64); // Ensure bounty ID is positive

        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;

        // Call the async function to finalize the proposal submission
        let submit_proposal_future: Future = finalize_submit_proposal(composite_proposal_id, bounty_id, proposer_address);
        return submit_proposal_future;
    }

    // Async function to finalize proposal acceptance
    async function finalize_accept_proposal(
        release_future: Future,
        bounty_id: u64,
        composite_proposal_id: u64
    ) {
        release_future.await();
        
        assert(bounty_creator.contains(bounty_id)); // Ensure bounty exists.
        assert(proposal_bounty_id.contains(composite_proposal_id)); // Ensure proposal exists.
        
        // Check if bounty is still open (not completed)
        assert_eq(bounty_status.get(bounty_id), BOUNTY_STATUS_OPEN);
        
        // Check if proposal is still pending (not already accepted/denied)
        assert_eq(proposal_status.get(composite_proposal_id), PROPOSAL_STATUS_PENDING);

        bounty_status.set(bounty_id, BOUNTY_STATUS_COMPLETED);
        proposal_status.set(composite_proposal_id, PROPOSAL_STATUS_ACCEPTED);
    }

    // Transition to accept a proposal
    async transition accept_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64,
        creator_address: address,
        payment_amount: u64,
        proposer_address: address
    ) -> Future {
        assert_eq(caller, creator_address); // Only the bounty creator can accept proposals
        assert(payment_amount > 0u64); // Ensure payment amount is positive
        assert(bounty_id > 0u64); // Ensure bounty ID is positive
        assert(proposal_id > 0u64); // Ensure proposal ID is positive
        
        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;

        // Release escrow to proposer - only the original sender (creator) can call release
        let release_future: Future = zk_escrow_v3.aleo/release(bounty_id, payment_amount, proposer_address);
        
        // Return combined future
        return finalize_accept_proposal(release_future, bounty_id, composite_proposal_id);
    }

    // Async function to finalize proposal denial
    async function finalize_deny_proposal(
        composite_proposal_id: u64,
        bounty_id: u64,
        caller: address
    ) {
        assert(proposal_bounty_id.contains(composite_proposal_id)); // Ensure the proposal exists.
        
        // Verify caller is the bounty creator
        assert_eq(bounty_creator.get(bounty_id), caller);

        proposal_status.set(composite_proposal_id, PROPOSAL_STATUS_DENIED);
    }

    // Transition function to deny a proposal
    async transition deny_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64
    ) -> Future {
        assert(bounty_id > 0u64); // Ensure bounty ID is positive
        assert(proposal_id > 0u64); // Ensure proposal ID is positive
        
        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;

        let deny_proposal_future: Future = finalize_deny_proposal(composite_proposal_id, bounty_id, caller);
        return deny_proposal_future;
    }


    // Async function to finalize bounty deletion
    async function finalize_delete_bounty(bounty_id: u64, caller: address) {
        assert(bounty_creator.contains(bounty_id)); // Ensure bounty exists.
        
        // Verify caller is the bounty creator
        assert_eq(bounty_creator.get(bounty_id), caller);

        bounty_creator.remove(bounty_id);
        bounty_payment.remove(bounty_id);
        bounty_status.remove(bounty_id);
        bounty_escrow_id.remove(bounty_id);
        all_bounties.remove(bounty_id);
    }

        // Transition to delete a bounty
        async transition delete_bounty(
            caller: address,
            bounty_id: u64
        ) -> Future {
            assert(bounty_id > 0u64); // Ensure bounty ID is positive
            
            let delete_bounty_future: Future = finalize_delete_bounty(bounty_id, caller);
            return delete_bounty_future;
        }


    // Allow bounty creator to cancel escrow and get refund
    async transition cancel_bounty_escrow(
        caller: address,
        bounty_id: u64,
        payment_amount: u64
    ) -> Future {
        assert(bounty_id > 0u64); // Ensure bounty ID is positive
        assert(payment_amount > 0u64); // Ensure payment amount is positive
        
        // Cancel escrow - return funds to the bounty creator
        let cancel_future: Future = zk_escrow_v3.aleo/cancel(bounty_id, payment_amount, caller);
        
        return finalize_cancel_bounty_escrow(cancel_future, bounty_id, caller);
    }

    // Finalize cancel bounty escrow
    async function finalize_cancel_bounty_escrow(
        cancel_future: Future,
        bounty_id: u64,
        caller: address
    ) {
        cancel_future.await();
        
        // Verify caller is the bounty creator
        assert_eq(bounty_creator.get(bounty_id), caller);
        
        // Check if bounty is still open (not completed) - can only cancel open bounties
        assert_eq(bounty_status.get(bounty_id), BOUNTY_STATUS_OPEN);
        
        // Remove bounty from mappings since it's being canceled
        bounty_creator.remove(bounty_id);
        bounty_payment.remove(bounty_id);
        bounty_status.remove(bounty_id);
        bounty_escrow_id.remove(bounty_id);
        all_bounties.remove(bounty_id);
    }
}