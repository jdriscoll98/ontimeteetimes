import { Header } from "@/components/header";
import "./globals.css";
import { AppBar } from "@/components/app-bar";
import Main from "@/components/main";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full h-full">
      <body className="w-full h-full">
        <Header />
        <Main>{children}</Main>
        <AppBar />
      </body>
    </html>
  );
}
