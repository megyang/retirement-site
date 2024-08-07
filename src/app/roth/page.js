import RothConversionCalculator from "@/app/roth/RothConversionCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import ModalProviders from "@/app/providers/ModalProviders";
import Header from "@/app/components/Header";
import SocialSecurityCalculator from "@/app/ss/SocialSecurityCalculator";

export default function Page() {
    return (
        <main>
            <div className=" bg-[#f9f9f9]">
                <RothConversionCalculator />
            </div>
        </main>
    );
}
