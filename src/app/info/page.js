"use client"
import React from 'react';
import PostSignUpForm from "@/app/info/PostSignUpForm";
import {MyUserContextProvider} from "@/app/hooks/useUser";

const Page = () => {
    return (
        <div>
            <MyUserContextProvider>
                <PostSignUpForm />
            </MyUserContextProvider>
        </div>
    );
};

export default Page;