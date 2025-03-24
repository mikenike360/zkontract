// src/pages/terms.tsx

import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';

export default function TermsPage() {
  return (
    <Layout>
      <NextSeo title="Terms of Use | zKontract" description="Platform usage terms and policies" />
      <div className="max-w-3xl mx-auto px-4 py-20 text-primary-content [&_*]:text-primary-content mt-20">
        <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
        <p className="text-sm mb-8 italic">Last Updated: March 2025</p>

        <p className="mb-4">
          Welcome to <strong>zKontract</strong>, a decentralized bounty board built on the Aleo
          blockchain. By using this platform, you agree to the following terms and conditions.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using zKontract, you acknowledge that you have read, understood, and agree
          to be bound by these Terms of Use. If you do not agree with any part of these terms, you
          may not use the platform.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Eligibility</h2>
        <p className="mb-4">
          You must be at least 18 years old to use this platform. By using zKontract, you represent
          that you meet this requirement.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Prohibited Activities</h2>
        <p className="mb-4">You agree <strong>not</strong> to use the platform to:</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Engage in illegal, fraudulent, or malicious activities</li>
          <li>Post or submit content related to hacking, scams, malware, or exploits</li>
          <li>Violate intellectual property rights</li>
          <li>Impersonate others or misrepresent your identity</li>
          <li>Distribute viruses, spam, or harmful code</li>
          <li>Abuse, harass, or threaten others</li>
        </ul>
        <p className="mb-4">
          We reserve the right to remove any content or restrict access for users who violate these
          terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Content Ownership</h2>
        <p className="mb-4">
          You retain ownership of the content you post (bounties, proposals, attachments, etc). By
          submitting content, you grant us permission to display, manage, and store it for the
          purpose of providing the service.
        </p>
        <p className="mb-4">
          We are not responsible for user-generated content or the accuracy, quality, or legality of
          posted bounties or proposals.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Platform Availability</h2>
        <p className="mb-4">
          We do not guarantee uninterrupted availability of the platform. The service is provided
          &quot;as-is&quot; with no warranties or guarantees.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Wallets and Blockchain Interaction</h2>
        <p className="mb-4">
          All blockchain interactions are handled through your connected Aleo wallet. You are solely
          responsible for managing your keys and funds. We do not store or access your wallet
          credentials.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. No Liability</h2>
        <p className="mb-4">
          zKontract and its maintainers are <strong>not liable</strong> for any losses, damages, or
          legal issues arising from use of the platform. Use at your own risk.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right to modify these terms at any time. Changes will be effective once
          posted on this page.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact</h2>
        <p className="mb-4">
          For questions, feedback, or concerns, contact us at:{' '}
          <a
            href="mailto:contact@venomlabs.xyz"
            className="underline underline-offset-2 link link-primary-content"
          >
            contact@venomlabs.xyz
          </a>
        </p>

        <div className="mt-10">
          <BackArrow />
        </div>
      </div>
    </Layout>
  );
}
