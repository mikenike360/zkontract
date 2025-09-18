// _app.tsx
import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import { useState } from 'react';
import Head from 'next/head';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ThemeProvider } from 'next-themes';

// Import Aleo Wallet Adapter dependencies
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from '@demox-labs/aleo-wallet-adapter-base';
import { 
  LeoWalletAdapter, 
  PuzzleWalletAdapter,
  FoxWalletAdapter,
  SoterWalletAdapter 
} from 'aleo-adapters';

// Import global styles and wallet modal styles
import 'swiper/css';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';

import { CURRENT_NETWORK, CURRENT_RPC_URL } from '@/types';

// Initialize the wallet adapters outside the component
const wallets = [
  new LeoWalletAdapter({
    appName: 'zKontract',
  }),
  new PuzzleWalletAdapter({
    programIdPermissions: {
      [WalletAdapterNetwork.MainnetBeta]: ['zkontract_v4.aleo', 'zk_escrow_v3.aleo'],
      [WalletAdapterNetwork.TestnetBeta]: ['zkontract_v4.aleo', 'zk_escrow_v3.aleo']
    },
    appName: 'zKontract',
    appDescription: 'A decentralized bounty platform on Aleo blockchain',
    appIconUrl: '/favicon.ico'
  }),
  new FoxWalletAdapter({
    appName: 'zKontract',
  }),
  new SoterWalletAdapter({
    appName: 'zKontract',
  })
];

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.UponRequest}
            network={WalletAdapterNetwork.TestnetBeta}
            autoConnect
            
          >
            <WalletModalProvider>
              <ThemeProvider attribute="data-theme" enableSystem={true} defaultTheme="dark">
                {getLayout(<Component {...pageProps} />)}
              </ThemeProvider>
            </WalletModalProvider>
          </WalletProvider>
        </Hydrate>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;
