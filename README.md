# zKontract

**zKontract** is a decentralized, zero-knowledge-powered bounty board **live on Aleo Mainnet**. It enables anonymous and verifiable collaboration between bounty posters and developers, using Aleo's privacy-preserving smart contracts and secure file storage.

---

## 🚀 Features

### ✅ Live on Mainnet
- 🛠 Post & manage bounties anonymously
- 🔐 Submit private proposals using Aleo zk-programs
- 📁 Upload and download attachments via Amazon S3
- 💸 Smart contract escrow for secure reward management
- 🧾 Accept/deny proposals with full on-chain transparency
- 🔒 Wallet-authenticated API security for all operations

### 🛠️ Coming Soon
- 🔍 Reputation system for users
- ⚖️ Enhanced moderation tools
- 📊 User analytics dashboard
- 🏛️ DAO governance

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
   # AWS S3 Configuration (required for file uploads)
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=zkontract
   
   # Contract is configured in src/types/index.ts
   # Current: zkontract_v2.aleo on Mainnet
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

**zKontract is live on Aleo Mainnet!** 🎉

The platform is deployed at [zkontract.app](https://zkontract.app) using:
- **Smart Contract**: `zkontract_v2.aleo` on Aleo Mainnet
- **Frontend**: Vercel
- **Storage**: AWS S3
- **Network**: Aleo Mainnet (`https://mainnet.aleorpc.com`)

To deploy your own instance:
1. Fork this repository
2. Configure AWS S3 credentials in environment variables
3. Deploy to Vercel or your preferred platform
4. Update the contract address in `src/types/index.ts` if using a different contract

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
- Buy me a Coffee: 

---

## 🔗 Links

- [Whitepaper](https://zkontract.app/whitepaper)
- [Privacy Policy](https://zkontract.app/privacy-policy)
- [Terms of Use](https://zkontract.app/terms)
- [Aleo Network](https://aleo.org)
