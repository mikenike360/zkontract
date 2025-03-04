import { useWindowScroll } from '@/lib/hooks/use-window-scroll';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import Button from '@/components/ui/button';
import { HomeIcon } from '@/components/icons/home';
import { Twitter } from '@/components/icons/twitter';
import { Discord } from '@/components/icons/discord';
import { useTheme } from 'next-themes'; // Use Next Themes hook

require('@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css');

// Define the list of DaisyUI themes you want to offer
const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
];

// ThemeSelector component using Next Themes
function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  // Use a mount flag to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="select select-bordered max-w-xs"
    >
      {themes.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  );
}

function HeaderRightArea() {
  return (
    <div className="relative order-last flex shrink-0 items-center gap-3 sm:gap-6 lg:gap-8 btn-primary-content text-primary">
      {/* Use the updated ThemeSelector */}
      <ThemeSelector />
      <WalletMultiButton />
    </div>
  );
}

export function Header() {
  const windowScroll = useWindowScroll();
  const isMounted = useIsMounted();

  return (
    <nav
      className={`fixed top-0 z-30 flex w-full items-center justify-between h-16 px-4 sm:h-24 sm:px-6 lg:px-8 xl:px-10 3xl:px-12 ${
        isMounted && windowScroll.y > 10
          ? 'h-16 shadow-card backdrop-blur sm:h-20'
          : 'h-16 sm:h-24'
      }`}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 3xl:px-12">
        {process.env.URL && (
          <a className="mx-2 bg-base-300 bg-opacity-20 rounded-full p-2" href={`${process.env.URL}`}>
            <HomeIcon />
          </a>
        )}
        {process.env.TWITTER && (
          <a className="mx-2 bg-base-300 bg-opacity-20 rounded-full p-2" href={`${process.env.TWITTER}`}>
            <Twitter width="18" height="18" />
          </a>
        )}
        {process.env.DISCORD && (
          <a className="mx-2 bg-base-300 bg-opacity-20 rounded-full p-2" href={`${process.env.DISCORD}`}>
            <Discord width="18" height="18" />
          </a>
        )}
      </div>
      <HeaderRightArea />
    </nav>
  );
}

interface LayoutProps {}

export default function Layout({
  children,
}: React.PropsWithChildren<LayoutProps>) {
  return (
    // Use DaisyUI tokens for the background and text color
    <div className="bg-base-100 text-base-content flex min-h-screen flex-col">
      <Header />
      <main className="mb-12 flex flex-grow flex-col pt-4 sm:pt-12 bg-primary">
        {children}
      </main>
    </div>
  );
}
