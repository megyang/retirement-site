import React from 'react';
import {createServerComponentClient} from "@supabase/auth-helpers-nextjs";
import {cookies} from "next/headers";

const GetInputs = async () => {
    const supabase = createServerComponentClient({
        cookies: cookies
    })
    return (
        <div>

        </div>
    );
};

export default GetInputs;