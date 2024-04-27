import { Header } from "@/components/header";
import { AppBar } from "@/components/app-bar";
import Main from "@/components/main";
import "./globals.css";

import { DM_Sans } from 'next/font/google'
 
// If loading a variable font, you don't need to specify the font weight
const dm_sans = DM_Sans({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`w-screen h-full ${dm_sans.className}`}>
      <body className="w-screen h-full flex flex-col bg-bg">
        <Header />
        <Main>{children}</Main>
        <AppBar />
      </body>
    </html>
  );
}
