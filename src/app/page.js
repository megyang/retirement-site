import SocialSecurityCalculator from "@/app/calculator/SocialSecurityCalculator";
import SupabaseProvider from "@/app/providers/SupabaseProvider";
import UserProvider from "@/app/providers/UserProvider";
import Header from "@/app/Header";
import ModalProviders from "@/app/providers/ModalProviders";
import {MyUserContextProvider} from "@/app/hooks/useUser";

//will not be recached and will always be up to date
export const revalidate = 0;
export default function Page() {

    return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div>
          <MyUserContextProvider>
              <SupabaseProvider>
                  <UserProvider>
                      <ModalProviders />
                        <Header />
                        <SocialSecurityCalculator />
                    </UserProvider>
              </SupabaseProvider>
          </MyUserContextProvider>
      </div>
    </main>
  );
}
