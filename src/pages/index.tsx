import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useRouter } from 'next/router';
import { CURRENT_NETWORK } from '@/types';
import AlertModal from '@/components/ui/AlertModal';
import { useAlertModal } from '@/hooks/useAlertModal';
import GLSLBackground from '@/utils/GLSLBackground';

const MainPage: NextPageWithLayout = () => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { alertState, hideAlert, showError } = useAlertModal();

  const handleButtonClick = async () => {
    try {
      if (!publicKey) {
        throw new WalletNotConnectedError();
      }
      router.push('/board');
    } catch (error) {
      showError('Wallet Required', 'Please click on Select Wallet and connect your wallet to proceed.');
    }
  };

  return (
    <>
      <NextSeo
        title="zKontract | Zero Knowledge Bounty Board"
        description="Hire and Work Anonymously"
      />

      {/* GLSL Background */}
      <GLSLBackground />

      {/* Main Hero Section */}
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-5xl font-extrabold text-center tracking-tight text-white sm:text-6xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          zKontract
        </h1>
        <p className="mt-4 text-lg text-center text-white max-w-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
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

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
      />
    </>
  );
};

MainPage.getLayout = (page) => <Layout>{page}</Layout>;
export default MainPage;
