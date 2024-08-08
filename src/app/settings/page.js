import React from 'react';
import UserInfo from "@/app/settings/UserInfo";
import {MyUserContextProvider} from "@/app/hooks/useUser";

const Page = () => {
    return (
        <div>
            <MyUserContextProvider>
                <UserInfo />
            </MyUserContextProvider>
        </div>
    );
};

export default Page;