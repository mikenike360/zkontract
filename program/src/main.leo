program zkontractv1.aleo {

    const contract_owner: address = aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec;

    const BOUNTY_STATUS_OPEN: u8 = 0u8;
    const BOUNTY_STATUS_COMPLETED: u8 = 1u8;

    const PROPOSAL_STATUS_PENDING: u8 = 0u8;
    const PROPOSAL_STATUS_ACCEPTED: u8 = 1u8;

    mapping bounty_creator: u64 => address;
    mapping bounty_payment: u64 => u64;
    mapping bounty_status: u64 => u8;

    mapping proposal_bounty_id: u64 => u64;
    mapping proposal_proposer: u64 => address;
    mapping proposal_status: u64 => u8;

    // Async function to set bounty details
    async function finalize_post_bounty(
        bounty_id: u64,
        creator_address: address,
        payment_amount: u64
    ) {
        assert(!bounty_creator.contains(bounty_id)); // Ensure bounty ID is unique.
        bounty_creator.set(bounty_id, creator_address);
        bounty_payment.set(bounty_id, payment_amount);
        bounty_status.set(bounty_id, BOUNTY_STATUS_OPEN);
    }

    // Transition to post a bounty
    async transition post_bounty(
        caller: address,
        bounty_id: u64,
        creator_address: address,
        payment_amount: u64
    ) -> Future {
        assert_eq(caller, creator_address); // Ensure the caller is the creator.

        // Call the async function to finalize posting the bounty
        let post_bounty_future: Future = finalize_post_bounty(bounty_id, creator_address, payment_amount);
        return post_bounty_future;
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

        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;

        // Call the async function to finalize the proposal submission
        let submit_proposal_future: Future = finalize_submit_proposal(composite_proposal_id, bounty_id, proposer_address);
        return submit_proposal_future;
    }

    // Async function to finalize proposal acceptance
    async function finalize_accept_proposal(
        bounty_id: u64,
        composite_proposal_id: u64
    ) {
        assert(bounty_creator.contains(bounty_id)); // Ensure bounty exists.
        assert(proposal_bounty_id.contains(composite_proposal_id)); // Ensure proposal exists.

        bounty_status.set(bounty_id, BOUNTY_STATUS_COMPLETED);
        proposal_status.set(composite_proposal_id, PROPOSAL_STATUS_ACCEPTED);
    }

    // Transition to accept a proposal
    async transition accept_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64,
        creator_address: address
    ) -> Future {
        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;

        // Call the async function to finalize the proposal acceptance
        let accept_proposal_future: Future = finalize_accept_proposal(bounty_id, composite_proposal_id);
        return accept_proposal_future;
    }

    // Async function to finalize bounty deletion
    async function finalize_delete_bounty(bounty_id: u64) {
        assert(bounty_creator.contains(bounty_id)); // Ensure bounty exists.

        bounty_creator.remove(bounty_id);
        bounty_payment.remove(bounty_id);
        bounty_status.remove(bounty_id);
    }

        // Transition to delete a bounty
        async transition delete_bounty(
            caller: address,
            bounty_id: u64
        ) -> Future {
            let delete_bounty_future: Future = finalize_delete_bounty(bounty_id);
            return delete_bounty_future;
        }

    

}
