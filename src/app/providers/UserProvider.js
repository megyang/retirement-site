"use client";

import {MyUserContextProvider} from "@/app/hooks/useUser";

const UserProvider = ({ children }) => {
    return (
        <MyUserContextProvider>
            {children}
        </MyUserContextProvider>
    );
};

export default UserProvider;
