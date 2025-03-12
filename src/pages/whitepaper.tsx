import { NextSeo } from 'next-seo';
import type { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import ReactMarkdown from 'react-markdown';

const markdownContent = `
## Abstract
zKontract is an open-source, decentralized bounty board built on the Aleo blockchain, leveraging zero-knowledge proofs to provide privacy-preserving Web3 development tasks and incentives. The platform enables individuals and organizations to post bounties while allowing developers to submit proposals, complete tasks, and receive payments in a trust-minimized manner. zKontract aims to enhance security, transparency, and anonymity in bounty-driven development, setting a new standard for private and verifiable work contracts in Web3.

## Introduction
Bounty boards have long been a cornerstone of open-source development and freelance marketplaces. However, traditional platforms often suffer from centralization, lack of privacy, and trust issues. zKontract addresses these concerns by leveraging Aleo’s zero-knowledge cryptography to ensure:
- Private yet verifiable transactions
- Decentralized moderation and governance
- Immutable, censorship-resistant bounty postings
- Secure and anonymous work submissions

By utilizing Aleo’s privacy-preserving smart contracts, zKontract enables users to create and fulfill bounties while keeping sensitive data hidden from the public blockchain. Only authorized parties can access task details and verify completion.

## Key Features
### 1. Privacy-Preserving Bounties
zKontract ensures that bounty details, including task requirements, proposer identities, and transaction amounts, remain encrypted and only accessible to relevant parties. This prevents unnecessary data exposure while maintaining verifiability.

### 2. Zero-Knowledge Proof-Based Transactions
Leveraging Aleo’s zero-knowledge proofs, zKontract allows bounty posters and solvers to interact without revealing unnecessary metadata. Payments, contract completions, and proposal statuses can be proven without exposing transaction details.

### 3. Decentralized Moderation and Reputation System
To prevent abuse, zKontract implements a decentralized moderation system where community members with sufficient reputation can flag or remove malicious or fraudulent bounties. The platform will introduce a **reputation-based escalation** system that assigns credibility scores to users based on past interactions and successful completions.

### 4. Escrow and Dispute Resolution
Funds for bounties are held in smart contract-based escrow, ensuring that rewards are only disbursed upon completion verification. If disputes arise, a decentralized arbitration mechanism will allow reputation-weighted voting to determine the resolution.

### 5. Seamless User Experience
Despite leveraging cutting-edge cryptographic technology, zKontract is designed with usability in mind. Features include:
- Intuitive bounty posting and proposal submission workflows
- Support for both public and private bounty rewards
- Integrated messaging and dispute resolution
- Automated notifications for bounty status updates

## Technical Architecture
### 1. Smart Contracts on Aleo
zKontract’s core functionality is built using Aleo’s zero-knowledge smart contracts. These contracts handle:
- Bounty creation, funding, and modification
- Proposal submission and evaluation
- Reward disbursement upon proof of task completion

### 2. Encrypted File Storage
Since Aleo smart contracts do not store large files, zKontract utilizes **Amazon S3** for handling uploaded proposal attachments while keeping access permissions encrypted.

### 3. User Authentication and Identity Abstraction
Users interact with zKontract via Aleo’s private key system, ensuring decentralized authentication. Abstracted wallet integrations provide a seamless experience for users unfamiliar with blockchain complexities.

### 4. Reputation and Governance
Reputation scores are dynamically calculated based on on-chain interactions. Users with higher credibility gain greater influence in dispute resolution and platform governance, reducing reliance on centralized moderators.

## Use Cases
### 1. Open-Source Development Funding
Organizations and DAOs can post development bounties while ensuring contributions remain verifiable but anonymous.

### 2. Web3 Bug Bounties
Security researchers can submit zero-knowledge proofs of vulnerabilities without publicly exposing exploit details.

### 3. Private Contract Work
Businesses can outsource development tasks without leaking confidential project details to competitors.

## Roadmap
### Phase 1: MVP Development & Testing
- Smart contract implementation on Aleo Testnet
- Basic bounty posting and proposal submission
- Escrow and reward distribution mechanisms

### Phase 2: Mainnet Deployment & Feature Expansion
- Full deployment on Aleo mainnet
- Decentralized reputation and moderation
- Enhanced dispute resolution tools

### Phase 3: Governance & Ecosystem Growth
- DAO-driven governance model
- Community incentives for platform participation
- Third-party integrations and API accessibility

## Conclusion
zKontract represents a paradigm shift in bounty-based work by merging the principles of **privacy, decentralization, and verifiability**. Built on Aleo’s zero-knowledge framework, the platform ensures that both bounty issuers and developers can engage in trust-minimized work agreements while preserving privacy. By removing centralized intermediaries, zKontract enables a **truly permissionless and private** bounty board for the Web3 era.

## Acknowledgments
zKontract is an open-source initiative, and contributions from the community are encouraged. Developers, researchers, and security professionals are invited to participate in shaping the future of private bounties on Aleo.
`;

const WhitePaperPage: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="zKontract Whitepaper"
        description="zKontract: A Zero-Knowledge Bounty Board on Aleo"
      />

      <main className="flex flex-col items-center justify-center px-4 py-8">
        <section className="w-full max-w-4xl">
          <div className="mb-8 flex justify-center">
            {/* Replace the src with your actual logo or image path */}
            <img
              src="/path/to/logo.png"
              alt="zKontract Logo"
              className="w-52 sm:w-[400px] xl:w-[450px] 3xl:w-[500px]"
            />
          </div>

          <header className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              zKontract: A Zero-Knowledge Bounty Board on Aleo
            </h1>
          </header>

          <article className="prose dark:prose-dark">
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </article>
        </section>
      </main>
    </>
  );
};

WhitePaperPage.getLayout = (page) => <Layout>{page}</Layout>;

export default WhitePaperPage;
