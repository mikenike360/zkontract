import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { CURRENT_NETWORK } from '@/types';

// Dynamically import GLSLBackground (no SSR)
const GLSLBackground = dynamic(() => import('../utils/GLSLBackground'), {
  ssr: false,
});

const MainPage: NextPageWithLayout = () => {
  const { publicKey } = useWallet();
  const router = useRouter();

  const handleButtonClick = async () => {
    try {
      if (!publicKey) {
        throw new WalletNotConnectedError();
      }
      router.push('/board');
    } catch (error) {
      alert('Please click on Select Wallet and connect your wallet to proceed.');
    }
  };

  return (
    <>
      <NextSeo
        title="zKontract | Zero Knowledge Bounty Board"
        description="Hire and Work Anonymously"
      />

      {/* Render the GLSL background behind everything */}
      <GLSLBackground />

      {/* Main Hero Section */}
      <div className="fixed inset-0 bg-primary bg-opacity-80 z-10 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-5xl font-extrabold text-center tracking-tight text-primary-content sm:text-6xl">
          zKontract
        </h1>
        <p className="mt-4 text-lg text-center text-primary-content max-w-lg">
          A Zero Knowledge Bounty Board – Hire and Work Anonymously
        </p>

        <div className="flex flex-col items-center mt-10 space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          {!publicKey ? (
            <Button
              onClick={handleButtonClick}
              className="btn btn-primary px-6 py-3 text-lg font-semibold"
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              onClick={handleButtonClick}
              className="btn btn-primary px-6 py-3 text-lg font-semibold"
            >
              Enter App
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

MainPage.getLayout = (page) => <Layout>{page}</Layout>;
export default MainPage;
