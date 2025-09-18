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
// import GLSLBackground from '@/utils/GLSLBackground';

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

      {/* Beautiful animated CSS background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(circle at 20% 20%, rgba(41, 98, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(244, 114, 182, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(41, 98, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(244, 114, 182, 0.1) 100%)
          `,
          animation: 'backgroundFlow 20s ease-in-out infinite'
        }}
      />
      <style jsx>{`
        @keyframes backgroundFlow {
          0%, 100% { 
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.1) rotate(2deg);
          }
        }
      `}</style>

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
