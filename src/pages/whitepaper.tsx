// src/pages/whitepaper.tsx

import { NextSeo } from 'next-seo';
import type { NextPageWithLayout } from '@/types';
import Layout from '@/layouts/_layout';
import ReactMarkdown from 'react-markdown';

const markdownContent = `


# zKontract: A Zero-Knowledge Bounty Board on Aleo

> _A whitepaper by VenomLabs_

## Table of Contents
- [Abstract](#abstract)
- [Introduction](#introduction)
- [Key Features](#key-features)
  - [Privacy-Preserving Bounties](#1-privacy-preserving-bounties)
  - [Zero-Knowledge Proof-Based Transactions](#2-zero-knowledge-proof-based-transactions)
  - [Decentralized Moderation and Reputation System](#3-decentralized-moderation-and-reputation-system)
  - [Escrow and Dispute Resolution](#4-escrow-and-dispute-resolution)
  - [Seamless User Experience](#5-seamless-user-experience)
- [Technical Architecture](#technical-architecture)
- [Use Cases](#use-cases)
- [Roadmap](#roadmap)
- [Conclusion](#conclusion)
- [Acknowledgments](#acknowledgments)
- [Contribute](#contribute)

## Abstract
zKontract is an open-source, decentralized bounty board built on the Aleo blockchain, leveraging zero-knowledge proofs to provide privacy-preserving Web3 development tasks and incentives. The platform enables individuals and organizations to post bounties while allowing developers to submit proposals, complete tasks, and receive payments in a trust-minimized manner. zKontract enhances security, transparency, and anonymity in bounty-driven development, setting a new standard for private and verifiable work contracts in Web3.

## Introduction
Traditional bounty boards are often centralized, expose user data, and rely on trust-based intermediaries. zKontract solves this by leveraging Aleo’s zero-knowledge cryptography to ensure:
- Private yet verifiable transactions
- Decentralized moderation and governance
- Immutable, censorship-resistant bounty postings
- Secure and anonymous work submissions

## Key Features

### 1. Privacy-Preserving Bounties
Bounty details, including task requirements and identities, remain encrypted and only accessible to the relevant parties. This ensures user privacy while retaining verifiability.

### 2. Zero-Knowledge Proof-Based Transactions
Using Aleo’s zk-SNARKs, bounty posters and solvers can interact without exposing transaction metadata. Proposals, payments, and decisions are provable without revealing sensitive details.

### 3. Decentralized Moderation and Reputation System
zKontract introduces a **planned** reputation system that enables community-driven moderation. Users gain influence based on successful completions and peer feedback.

### 4. Escrow and Dispute Resolution
Rewards are held in smart contract-based escrow. A future update will introduce decentralized dispute resolution with weighted voting based on reputation scores.

### 5. Seamless User Experience
Despite its cryptographic backbone, zKontract is designed for usability:
- Simple bounty and proposal workflows
- Public and private reward options
- Planned integrated messaging
- Status update notifications

## Technical Architecture

### 1. Smart Contracts on Aleo
zKontract’s logic lives in Aleo’s private smart contracts:
- Bounty creation, modification, and closure
- Proposal submission and acceptance
- Encrypted reward disbursement logic

### 2. Encrypted File Storage
Proposal attachments are stored via **Amazon S3** using presigned URLs. (Future iterations will support private S3 ACLs and encrypted metadata access.)

### 3. User Authentication and Identity Abstraction
Users interact with zKontract using Aleo wallet addresses. More abstracted identity support (aliases, SSO layers) is planned.

### 4. Reputation and Governance
Reputation and moderation features are on the roadmap. Governance will eventually shift to a DAO model, with platform contributors and power users gaining greater say in moderation and protocol upgrades.

## Use Cases

### 1. Open-Source Development Funding
DAOs and teams can privately fund contributors without revealing internal project details.

### 2. Web3 Bug Bounties
Security researchers can prove exploit knowledge via ZK proofs without disclosing full details until payment is secured.

### 3. Private Contract Work
Freelancers and startups can interact without fear of idea theft or data leaks.

## Roadmap

### Phase 1: MVP Development & Testing ✅
- Aleo testnet deployment
- Bounty/proposal submission
- S3-based file upload support

### Phase 2: Mainnet Deployment & Reputation System 🛠️ (in progress)
- Launch on Aleo mainnet
- Implement basic reputation tracking
- Add enhanced moderation tools

### Phase 3: DAO Governance & Ecosystem Growth 🧠
- Transition to decentralized governance
- Token incentives
- Third-party integrations & analytics

## Conclusion
zKontract merges **privacy, decentralization, and usability** into a new framework for trust-minimized bounty workflows. Built entirely open-source and powered by Aleo’s ZK tech, it gives both bounty posters and developers complete control, anonymity, and security.

## Acknowledgments
zKontract is a community-driven project maintained by VenomLabs. Special thanks to the Aleo community and all contributors who support privacy-focused tools.

## Contribute
Want to help shape the future of private bounties?
- [GitHub](https://github.com/mikenike360/zkontract)
- Open-source contributions welcome
- Reach out via [contact@venomlabs.xyz](mailto:contact@venomlabs.xyz)
`;

const WhitePaperPage: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="zKontract Whitepaper"
        description="zKontract: A Zero-Knowledge Bounty Board on Aleo"
      />

      <main className="flex flex-col items-center  justify-center px-4 py-8 mt-20 text-primary-content">
        <section className="w-full max-w-4xl text-primary-content">
        <article className="prose max-w-none text-primary-content [&_*]:text-primary-content">

            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </article>
        </section>
      </main>
    </>
  );
};

WhitePaperPage.getLayout = (page) => <Layout>{page}</Layout>;

export default WhitePaperPage;
