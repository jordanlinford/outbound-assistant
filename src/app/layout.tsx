import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Outbound Assistant - AI-Powered Sales Automation",
  description: "Replace expensive BDR hires with AI that handles prospecting, email sequences, follow-ups, and meeting booking. 99% cost savings vs traditional sales teams.",
  icons: {
    icon: '/outbound-assistant-icon.svg',
    shortcut: '/outbound-assistant-icon.svg',
    apple: '/outbound-assistant-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
