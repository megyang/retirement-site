import SocialSecurityCalculator from "@/app/calculator/SocialSecurityCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import Header from "@/app/Header";
import ModalProviders from "@/app/providers/ModalProviders";


export default function Page() {

    return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div>
          <SupabaseProvider>
              <UserProvider>
                  <ModalProviders />
                    <Header />
                    <SocialSecurityCalculator />
                </UserProvider>
          </SupabaseProvider>
      </div>
    </main>
  );
}
