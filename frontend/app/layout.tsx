import type { Metadata } from "next";
import Script from "next/script";

import "@seed-design/css/all.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "모당 (Modang)",
  description: "모여라 당근으로 — 동네 모임 기반 가게 어워드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-seed
      data-seed-color-mode="light-only"
      data-seed-user-color-scheme="light"
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <Script id="seed-color-scheme" strategy="beforeInteractive">
          {`
            try {
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
              function apply() {
                document.documentElement.dataset.seedUserColorScheme =
                  prefersDark.matches ? 'dark' : 'light';
              }
              if ('addEventListener' in prefersDark) {
                prefersDark.addEventListener('change', apply);
              } else if ('addListener' in prefersDark) {
                prefersDark.addListener(apply);
              }
              apply();
            } catch (e) {}
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
