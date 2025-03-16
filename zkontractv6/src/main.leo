program zkontractv7.aleo {

    const contract_owner: address = aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec;

    const BOUNTY_STATUS_OPEN: u8 = 0u8;
    const BOUNTY_STATUS_COMPLETED: u8 = 1u8;

    const PROPOSAL_STATUS_PENDING: u8 = 0u8;
    const PROPOSAL_STATUS_ACCEPTED: u8 = 1u8;
    const PROPOSAL_STATUS_DENIED: u8 = 2u8;

    mapping bounty_creator: u64 => address;
    mapping bounty_payment: u64 => u64;
    mapping bounty_status: u64 => u8;

    mapping proposal_bounty_id: u64 => u64;
    mapping proposal_proposer: u64 => address;
    mapping proposal_status: u64 => u8;

    mapping all_bounties: u64 => bool;
    mapping bounty_output_payment: u64 => u64;
    mapping bounty_output_status: u64 => u8;
    mapping account: address => u64;

    // Mapping to hold escrow funds for each bounty.
    mapping escrow: u64 => u64;

    // Async function to set bounty details and deposit escrow.
    async function finalize_post_bounty(
        bounty_id: u64,
        creator_address: address,
        payment_amount: u64
    ) {
        // Ensure bounty ID is unique.
        assert(!Mapping::contains(bounty_creator, bounty_id));
        
        // Check that the bounty creator has enough funds.
        let creator_balance: u64 = Mapping::get_or_use(account, creator_address, 0u64);
        assert(creator_balance >= payment_amount);

        // Deduct funds from creator and place them in escrow.
        Mapping::set(account, creator_address, creator_balance - payment_amount);
        Mapping::set(escrow, bounty_id, payment_amount);

        Mapping::set(bounty_creator, bounty_id, creator_address);
        Mapping::set(bounty_payment, bounty_id, payment_amount);
        Mapping::set(bounty_status, bounty_id, BOUNTY_STATUS_OPEN);

        Mapping::set(all_bounties, bounty_id, true);
    }

    // Transition to post a bounty with escrow deposit.
    async transition post_bounty(
        caller: address,
        bounty_id: u64,
        creator_address: address,
        payment_amount: u64
    ) -> Future {
        // Ensure the caller is the bounty creator.
        assert_eq(caller, creator_address);
        let post_bounty_future: Future = finalize_post_bounty(bounty_id, creator_address, payment_amount);
        return post_bounty_future;
    }

    async function finalize_view_bounty_by_id(bounty_id: u64) {
        assert(Mapping::contains(bounty_creator, bounty_id));
        let payment: u64 = Mapping::get(bounty_payment, bounty_id);
        let status: u8 = Mapping::get(bounty_status, bounty_id);
        Mapping::set(bounty_output_payment, bounty_id, payment);
        Mapping::set(bounty_output_status, bounty_id, status);
    }

    async transition view_bounty_by_id(bounty_id: u64) -> Future {
        let finalize_future: Future = finalize_view_bounty_by_id(bounty_id);
        return finalize_future;
    }

    async function finalize_submit_proposal(
        composite_proposal_id: u64,
        bounty_id: u64,
        proposer_address: address
    ) {
        // Ensure bounty exists and proposal ID is unique.
        assert(Mapping::contains(bounty_creator, bounty_id));
        assert(!Mapping::contains(proposal_bounty_id, composite_proposal_id));
        Mapping::set(proposal_bounty_id, composite_proposal_id, bounty_id);
        Mapping::set(proposal_proposer, composite_proposal_id, proposer_address);
        Mapping::set(proposal_status, composite_proposal_id, PROPOSAL_STATUS_PENDING);
    }

    async transition submit_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64,
        proposer_address: address
    ) -> Future {
        // Ensure the caller is the proposer.
        assert_eq(caller, proposer_address);
        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;
        let submit_proposal_future: Future = finalize_submit_proposal(composite_proposal_id, bounty_id, proposer_address);
        return submit_proposal_future;
    }

    async function finalize_accept_proposal(
        bounty_id: u64,
        composite_proposal_id: u64
    ) {
        // Ensure bounty and proposal exist.
        assert(Mapping::contains(bounty_creator, bounty_id));
        assert(Mapping::contains(proposal_bounty_id, composite_proposal_id));

        Mapping::set(bounty_status, bounty_id, BOUNTY_STATUS_COMPLETED);
        Mapping::set(proposal_status, composite_proposal_id, PROPOSAL_STATUS_ACCEPTED);

        // Release escrow funds to the accepted proposal's proposer.
        let funds: u64 = Mapping::get(escrow, bounty_id);
        let proposer: address = Mapping::get(proposal_proposer, composite_proposal_id);
        let proposer_balance: u64 = Mapping::get_or_use(account, proposer, 0u64);
        Mapping::set(account, proposer, proposer_balance + funds);
        Mapping::remove(escrow, bounty_id);
    }

    async transition accept_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64,
        creator_address: address
    ) -> Future {
        // Ensure the caller is the bounty creator.
        assert_eq(caller, creator_address);
        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;
        let accept_proposal_future: Future = finalize_accept_proposal(bounty_id, composite_proposal_id);
        return accept_proposal_future;
    }

    async function finalize_deny_proposal(
        composite_proposal_id: u64
    ) {
        // Ensure the proposal exists.
        assert(Mapping::contains(proposal_bounty_id, composite_proposal_id));
        Mapping::set(proposal_status, composite_proposal_id, PROPOSAL_STATUS_DENIED);
    }

    async transition deny_proposal(
        caller: address,
        bounty_id: u64,
        proposal_id: u64
    ) -> Future {
        let composite_proposal_id: u64 = bounty_id * 1000000u64 + proposal_id;
        let deny_proposal_future: Future = finalize_deny_proposal(composite_proposal_id);
        return deny_proposal_future;
    }

    async function finalize_delete_bounty(bounty_id: u64) {
        // Ensure bounty exists.
        assert(Mapping::contains(bounty_creator, bounty_id));
        let creator: address = Mapping::get(bounty_creator, bounty_id);
        // Refund escrow if funds remain (i.e. no accepted proposal).
        if (Mapping::contains(escrow, bounty_id)) {
            let funds: u64 = Mapping::get(escrow, bounty_id);
            let creator_balance: u64 = Mapping::get_or_use(account, creator, 0u64);
            Mapping::set(account, creator, creator_balance + funds);
            Mapping::remove(escrow, bounty_id);
        }
        Mapping::remove(bounty_creator, bounty_id);
        Mapping::remove(bounty_payment, bounty_id);
        Mapping::remove(bounty_status, bounty_id);
    }

    async transition delete_bounty(
        caller: address,
        bounty_id: u64
    ) -> Future {
        let delete_bounty_future: Future = finalize_delete_bounty(bounty_id);
        return delete_bounty_future;
    }
}
