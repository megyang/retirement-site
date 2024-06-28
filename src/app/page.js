import React from 'react';
import SocialSecurityCalculator from "@/app/ss/SocialSecurityCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import Header from "@/app/components/Header";
import NavBar from "@/app/components/NavBar";
import ModalProviders from "@/app/providers/ModalProviders";
import RothConversionCalculator from "@/app/roth/RothConversionCalculator";

// will not be recached and will always be up to date
export const revalidate = 0;

export default function Page() {
    return (
        <main className="flex min-h-screen flex-col">
            <SupabaseProvider>
                <UserProvider>
                    <ModalProviders />
                    <Header />
                    <div className="flex flex-1 mt-16">
                        <NavBar />
                        <div className="flex-1 flex justify-center items-center">
                            <div className="p-4 w-11/12 max-w-screen-lg">
                                <SocialSecurityCalculator />
                            </div>
                        </div>
                    </div>
                </UserProvider>
            </SupabaseProvider>
        </main>
    );
}
