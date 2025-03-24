# zKontract

**zKontract** is a decentralized, zero-knowledge-powered bounty board built on the Aleo blockchain. It enables anonymous and verifiable collaboration between bounty posters and developers, using Aleo’s privacy-preserving smart contracts and decentralized file storage.

---

## 🚀 Features

- 🛠 Post & manage bounties anonymously
- 🔐 Submit private proposals using Aleo zk-programs
- 📁 Upload and download attachments via Amazon S3
- 💸 Handle reward payments using private or public Aleo transfers
- 🧾 Accept/deny proposals with full on-chain transparency
- 🔍 Decentralized moderation (coming soon)
- ⚖️ Escrow-based reward system with dispute resolution (coming soon)

---

## ⚙️ Tech Stack

- **Frontend**: React + Next.js + Tailwind CSS
- **Blockchain**: [Aleo](https://aleo.org) zk-programs
- **Wallet**: `aleo-wallet-adapter` integration
- **Storage**: Amazon S3 for off-chain metadata & file uploads
- **Backend API**: Next.js API routes
- **Deployment**: Vercel / Netlify / Self-hosted

---

## 🔧 Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/zkontract.git
   cd zkontract
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables** (`.env.local`)
   ```env
   NEXT_PUBLIC_CONTRACT_ID=zkontract.aleo
   NEXT_PUBLIC_NETWORK=mainnet

   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=...
   AWS_BUCKET_NAME=zkontract
   ```

4. **Run the dev server**
   ```bash
   yarn dev
   ```

---

## 🧠 Architecture

- `/src/pages`: Next.js pages and API endpoints
- `/src/components`: UI components (Dashboard, Proposals, Bounties)
- `/src/utils`: Blockchain + storage helper functions
- `/src/hooks`: Custom React hooks
- `/program`: Aleo smart contracts (off-chain)

---

## ✨ Deployment

This project is ready for Aleo mainnet. To deploy:
- Push to `main` branch
- Deploy on your platform of choice (Vercel, etc.)
- Point domain (e.g. `zkontract.xyz`) to production frontend

---

## 📜 License

This project is open-source under the MIT License. Built with love by [VenomLabs](https://venomlabs.xyz). Contributions welcome.

---

## 🙏 Credits

- Aleo ZK Community
- Contributors & testers during development
- All open-source tools and libraries used

---

## 💰 Support

If you like this project and want to support it:
- Star the repo ⭐
- Share it
- Donate ALEO to: `aleo1xh0ncflwkfzga983lwujsha729c8nwu7phfn8aw7h3gahhj0ms8qytrxec`

---

## 🔗 Links

- [Whitepaper](https://zkontract.app/whitepaper)
- [Privacy Policy](https://zkontract.app/privacy-policy)
- [Terms of Use](https://zkontract.app/terms)
- [Aleo Network](https://aleo.org)
