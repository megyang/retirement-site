import RothConversionCalculator from "@/app/roth/RothConversionCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import ModalProviders from "@/app/providers/ModalProviders";
import Header from "@/app/Header";
import SocialSecurityCalculator from "@/app/calculator/SocialSecurityCalculator";

export default function Page() {
    return (
        <main>
            <div>
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
