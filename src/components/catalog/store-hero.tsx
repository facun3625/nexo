"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { useStoreSettings } from "@/lib/store-settings-context";
import { contrastText } from "@/lib/contrast-color";
import { StoreNav } from "./store-nav";
import { MobileHamburgerMenu } from "./mobile-hamburger-menu";
import { FavoritesNavButton } from "./favorites-nav-button";
import { StoreTopBar } from "./store-top-bar";
import { SiteSearchButton } from "@/components/search/site-search-button";

function Brand({ compact = false, minimal = false, classic = false, plain = false }: { compact?: boolean; minimal?: boolean; classic?: boolean; plain?: boolean }) {
  const { storeName, logoUrl, showNameInHeader, logoHeight } = useStoreSettings();
  const height = compact ? 40 : minimal ? Math.min(logoHeight, 54) : logoHeight;

  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      {logoUrl ? (
        <span
          className={`flex w-auto shrink-0 items-center justify-center overflow-hidden ${minimal || plain ? "rounded-none bg-transparent p-0" : classic && !compact ? "rounded-2xl bg-white p-2" : "rounded-xl bg-white p-1.5"}`}
          style={{ height, maxWidth: height * 3.8 }}
        >
          <Image src={logoUrl} alt={storeName} width={Math.round(height * 3.8)} height={height} className="size-full object-contain" />
        </span>
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center ${minimal || plain ? "size-9 border border-current" : classic && !compact ? "rounded-2xl bg-white text-primary" : "rounded-xl bg-white text-primary"}`}
          style={minimal || plain ? undefined : { height, width: height }}
        >
          <Building2 className={compact || minimal || plain ? "size-5" : "size-8"} />
        </span>
      )}
      {showNameInHeader && (!compact || !logoUrl) && (
        <span className={`${minimal ? "text-lg font-medium tracking-[.04em]" : classic && !compact ? "text-2xl font-bold tracking-tight" : "text-xl font-bold tracking-tight"} truncate text-current`}>
          {storeName}
        </span>
      )}
    </Link>
  );
}

function MobileHeader({ minimal = false, wide = false }: { minimal?: boolean; wide?: boolean }) {
  const { headerBgColor } = useStoreSettings();
  const style = minimal
    ? { backgroundColor: "rgba(255,255,255,.96)", color: "#171717" }
    : { backgroundColor: headerBgColor, color: contrastText(headerBgColor) };

  return (
    <div
      className={`sticky top-0 z-50 flex min-h-16 w-full min-w-0 items-center px-4 backdrop-blur-xl ${wide ? "xl:hidden" : "lg:hidden"} ${minimal ? "border-b shadow-none" : "border-b border-current/10 shadow-sm"}`}
      style={style}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] items-center justify-between gap-3">
        <Brand compact minimal={minimal} classic={!wide && !minimal} plain={wide && !minimal} />
        <div className="flex shrink-0 items-center gap-1">
          <SiteSearchButton iconOnly />
          <FavoritesNavButton iconOnly />
          <AccountMenu overlay iconOnly />
          <MobileHamburgerMenu />
        </div>
      </div>
    </div>
  );
}

export function StoreHero() {
  const { template, headerBgColor, menuBgColor } = useStoreSettings();

  if (template === "moderno") {
    return (
      <>
        <div className="hidden xl:block"><StoreTopBar /></div>
        <header
          className="sticky top-0 z-50 hidden border-b border-white/10 px-6 shadow-[0_8px_30px_rgba(0,0,0,.12)] xl:block"
          style={{ backgroundColor: menuBgColor, color: contrastText(menuBgColor) }}
        >
          <div className="mx-auto flex min-h-[76px] w-full max-w-[1440px] items-center gap-8">
            <Brand plain />
            <div className="ml-auto flex items-center gap-7">
              <StoreNav />
              <div className="flex items-center gap-4 border-l border-current/15 pl-6">
                <SiteSearchButton />
                <FavoritesNavButton />
                <AccountMenu overlay />
              </div>
            </div>
          </div>
        </header>
        <MobileHeader wide />
      </>
    );
  }

  if (template === "minimal") {
    return (
      <>
        <header className="sticky top-0 z-50 hidden border-b bg-white/95 px-6 text-neutral-900 backdrop-blur-xl xl:block">
          <div className="mx-auto flex min-h-[86px] w-full max-w-[1440px] items-center gap-10">
            <Brand minimal />
            <div className="ml-auto flex items-center gap-8">
              <StoreNav />
              <div className="flex items-center gap-5">
                <SiteSearchButton />
                <FavoritesNavButton />
                <AccountMenu overlay />
              </div>
            </div>
          </div>
        </header>
        <MobileHeader minimal wide />
      </>
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <StoreTopBar />
      </div>
      <div
        className="hidden px-5 lg:block lg:px-8"
        style={{ backgroundColor: headerBgColor, color: contrastText(headerBgColor) }}
      >
        <div className="mx-auto flex min-h-24 w-full max-w-[1440px] items-center justify-center py-3.5">
          <Brand classic />
        </div>
      </div>
      <div
        className="sticky top-0 z-50 hidden border-y border-current/10 px-5 shadow-sm backdrop-blur-xl lg:block lg:px-8"
        style={{ backgroundColor: menuBgColor, color: contrastText(menuBgColor) }}
      >
        <div className="mx-auto grid min-h-14 w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_minmax(max-content,1fr)] items-center gap-3">
          <div aria-hidden="true" />
          <StoreNav />
          <div className="flex items-center justify-end gap-5">
            <SiteSearchButton iconOnly />
            <FavoritesNavButton />
            <AccountMenu overlay />
          </div>
        </div>
      </div>
      <MobileHeader />
    </>
  );
}
