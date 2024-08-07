import { Inter } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import ModalProviders from "@/app/providers/ModalProviders";
import Header from "@/app/components/Header";
import NavBar from "@/app/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Savewell Finance",
  description: "",
};

export default function RootLayout({ children }) {
  return (
      <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
      <SupabaseProvider>
        <UserProvider>
          <ModalProviders />
          <Header />
          <div className="flex">
            <NavBar />
            <div className="ml-48 mt-16 p-4 flex-1 bg-[#f9f9f9]">{children}</div>
          </div>
        </UserProvider>
      </SupabaseProvider>
      </body>
      </html>
  );
}
