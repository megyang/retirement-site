import React from 'react';
import {MyUserContextProvider} from "@/app/hooks/useUser";
import LandingPage from "@/app/components/LandingPage";

// will not be recached and will always be up to date
export const revalidate = 0;

export default function Page() {

    return (
        <main>
            <MyUserContextProvider>
                <div style={{ width: '100%', height: '100vh'}}>
                    <LandingPage />
                </div>
            </MyUserContextProvider>
        </main>
    );
}