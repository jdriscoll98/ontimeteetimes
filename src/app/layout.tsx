import { Header } from "@/components/header";
import { AppBar } from "@/components/app-bar";
import Main from "@/components/main";
import "./globals.css";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-screen h-full">
      <body className="w-screen h-full flex flex-col">
        <Header />
        <Main>{children}</Main>
        <AppBar />
      </body>
    </html>
  );
}
