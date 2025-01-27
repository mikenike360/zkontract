import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import glslCanvas component (no SSR)
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

      {/* Main Hero Section: remove the gradient so the GLSL background is visible */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <h1 className="text-5xl font-extrabold text-center tracking-tight text-white sm:text-6xl">
          zKontract
        </h1>
        <p className="mt-4 text-lg text-center text-gray-200 max-w-lg">
          A Zero Knowledge Bounty Board – Hire and Work Anonymously
        </p>

        <div className="flex flex-col items-center mt-10 space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          {!publicKey ? (
            <Button
              className="px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              onClick={handleButtonClick}
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              className="px-6 py-3 text-lg font-semibold bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
              onClick={handleButtonClick}
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
