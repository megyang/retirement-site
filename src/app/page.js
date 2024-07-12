import React from 'react';
import SocialSecurityCalculator from "@/app/ss/SocialSecurityCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import Header from "@/app/components/Header";
import NavBar from "@/app/components/NavBar";
import ModalProviders from "@/app/providers/ModalProviders";

// will not be recached and will always be up to date
export const revalidate = 0;

export default function Page() {
    return (
        <main>
            <SupabaseProvider>
                <UserProvider>
                    <ModalProviders />
                    <Header />
                    <div>
                        <NavBar />
                        <div>
                            <div>
                                <SocialSecurityCalculator />
                            </div>
                        </div>
                    </div>
                </UserProvider>
            </SupabaseProvider>
        </main>
    );
}
