import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import Layout from '@/layouts/_layout';
import Button from '@/components/ui/button';
import { ImageSlider } from '@/components/ui/image-slider';
import useSWR from 'swr';
import { TESTNETBETA_API_URL, getHeight, getMintBlock, getSettingsStatus } from '@/aleo/rpc';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { getSettingsFromNumber } from '@/lib/util';
import { useRouter } from 'next/router';


type SectionProps = {
  title: string;
  bgColor: string;
  sectionWidth?: string;
};

export function Section({
  title,
  bgColor,
  children,
  sectionWidth,
}: React.PropsWithChildren<SectionProps>) {
  return (
    <div className="mb-3">
      <div className={`rounded-lg ${bgColor}`}>
        <div className="relative flex items-center justify-between gap-4 p-4">
          <div className={`items-center ltr:mr-6 rtl:ml-6 ${sectionWidth}`}>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:text-sm">
                {title}
              </span>
              <span className="mt-1 hidden text-xs tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                {children}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_IMAGES = [
        '/contract.jpg'
  ];
  

const MainPage: NextPageWithLayout = () => {
  const { wallet, publicKey, requestRecords } = useWallet();
  const { data: settingsNum, error, isLoading } = useSWR('getSettingsStatus', () => getSettingsStatus(TESTNETBETA_API_URL));
  const { data: height, error: heightError, isLoading: heightIsLoading } = useSWR('height', () => getHeight(TESTNETBETA_API_URL));
  const { data: mintBlock, error: mintBlockError, isLoading: mintBlockIsLoading } = useSWR('getMintBlock', () => getMintBlock(TESTNETBETA_API_URL));
  const router = useRouter();


  const handleButtonClick = async () => {
    try {
      if (!publicKey) throw new WalletNotConnectedError();
      router.push('/board'); // Redirect to the board page
    } catch (error) {
      // Display an error message if the wallet is not connected
      alert('Please connect your wallet to proceed.');
    }
  };

  let timeToMint = 0;
  if (height && mintBlock) {
    timeToMint = (mintBlock.block - height) * 15_000; // 15 seconds per block
  }

  let sliderImages = DEFAULT_IMAGES;

  return (
    <>
      <NextSeo
        title="zKontract | Zero Knowledge Bounty Board"
        description="Hire and Work Anomymously"
      />
      <div className="mx-auto max-w-md px-4 mt-12 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-14 text-lg font-medium uppercase text-center tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl">
          zKontract
        </h2>
        {timeToMint > 0 && (
          <div className='flex justify-center mb-6'>

          </div>
        )}
        <ImageSlider images={sliderImages} interval={5000} />
        {settingsNum !== undefined && (
          <div className='flex justify-center my-8'>
            <Button
              className="text-xl shadow-card dark:bg-gray-700"
              size="large"
              disabled={!publicKey}
              onClick={handleButtonClick}
            >
              ENTER APP
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

MainPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default MainPage;