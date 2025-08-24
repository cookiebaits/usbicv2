import type { Metadata } from "next";
import { LogoProvider } from "@/app/logoContext";
import { ZelleLogoProvider } from "./zellLogoContext";
import "./globals.css";
import { LogVisit } from "@/components/LogVisit";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Free International Banking",
  description: "Developed by Venhash Solutions",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <body>
        <ZelleLogoProvider>
          <LogoProvider>
            <LogVisit />
            <TopBar>
              <div>Page Not Found</div>
            </TopBar>
          </LogoProvider>
        </ZelleLogoProvider>
      </body>
    </html>
  );
}