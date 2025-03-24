// src/pages/privacy-policy.tsx

import { NextSeo } from 'next-seo';
import Link from 'next/link';
import Layout from '@/layouts/_layout';
import BackArrow from '@/components/ui/BackArrow';

export default function PrivacyPolicy() {
  return (
    <Layout>
      <NextSeo title="Privacy Policy | zKontract" description="How we handle your data" />
      <div className="max-w-3xl mx-auto px-4 py-20 text-primary-content [&_*]:text-primary-content mt-20">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="mb-4">
          At zKontract, your privacy is important to us. This privacy policy explains what data we
          collect, how we use it, and your rights as a user.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Data We Collect</h2>
        <p className="mb-4">
          We collect minimal data, primarily your public Aleo address to associate proposals and
          bounties. We do not collect personal information such as names, emails, or IP addresses.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Proposal & Bounty Data</h2>
        <p className="mb-4">
          All proposal and bounty data is stored in a decentralized-friendly way (via S3), and you
          have full control to delete your own proposals or bounties at any time.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Cookies & Tracking</h2>
        <p className="mb-4">
          We do not use cookies, trackers, or any third-party analytics that monitor your activity
          on this platform.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Ownership</h2>
        <p className="mb-4">
          All data you submit belongs to you. We provide tools to delete your content at any time.
          Bounty posters can only view proposals submitted to their bounties.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this policy occasionally. Changes will always be reflected on this page.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact</h2>
        <p className="mb-4">
          For any questions, suggestions, or privacy concerns, contact the project owner at{' '}
          <a href="mailto:contact@venomlabs.xyz" className="link link-primary-content">
            contact@venomlabs.xyz
          </a>
          .
        </p>

        <div className="mt-10">
          <BackArrow />
        </div>
      </div>
    </Layout>
  );
}
