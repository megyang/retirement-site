// page.js
import RothConversionCalculator from "@/app/testing/RothConversionCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import ModalProviders from "@/app/providers/ModalProviders";
import Header from "@/app/components/Header";

export default function Page() {
    return (
        <main>
            <div className=" bg-[#f9f9f9]">
                <SupabaseProvider>
                    <UserProvider>
                        <ModalProviders />
                        <Header />
                        <RothConversionCalculator />
                    </UserProvider>
                </SupabaseProvider>
            </div>
        </main>
    );
}
