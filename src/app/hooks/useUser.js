"use client"
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSessionContext, useUser as useSupaUser } from "@supabase/auth-helpers-react";

export const UserContext = createContext(undefined);

export const MyUserContextProvider = (props) => {
    const { session, isLoading: isLoadingUser, supabaseClient: supabase } = useSessionContext();
    const user = useSupaUser();
    const accessToken = session?.access_token ?? null;
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [subscription, setSubscription] = useState(null);

    // Memoize getUserDetails and getSubscription using useCallback
    const getUserDetails = useCallback(() => {
        return supabase.from('users').select('*').single();
    }, [supabase]); // Dependency on 'supabase' is stable and should be included

    const getSubscription = useCallback(() => {
        return supabase.from('subscriptions')
            .select('*, prices(*, products(*))')
            .in('status', ['trialing', 'active'])
            .single();
    }, [supabase]); // Dependency on 'supabase' is stable and should be included

    useEffect(() => {
        if (user && !isLoadingData && !userDetails && !subscription) {
            setIsLoadingData(true);
            Promise.allSettled([getUserDetails(), getSubscription()]).then((results) => {
                const userDetailsResult = results[0];
                const subscriptionResult = results[1];

                if (userDetailsResult.status === "fulfilled") {
                    setUserDetails(userDetailsResult.value.data);
                }
                if (subscriptionResult.status === "fulfilled") {
                    setSubscription(subscriptionResult.value.data);
                }
                setIsLoadingData(false);
            });
        } else if (!user && !isLoadingUser && !isLoadingData) {
            setUserDetails(null);
            setSubscription(null);
        }
    }, [user, isLoadingUser, supabase, getUserDetails, getSubscription, isLoadingData, userDetails, subscription]); // Now including all dependencies

    const value = {
        accessToken,
        user,
        userDetails,
        isLoading: isLoadingUser || isLoadingData,
        subscription
    };

    return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a MyUserContextProvider');
    }
    return context;
}
