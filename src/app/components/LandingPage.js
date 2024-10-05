"use client";
import { useUser } from "@/app/hooks/useUser";
import useAuthModal from "@/app/hooks/useAuthModal";
import { useRouter } from "next/navigation";

const LandingPage = () => {
    const { user } = useUser();
    const { onOpen, setView } = useAuthModal();
    const router = useRouter();

    const handleSignUp = () => {
        setView('sign_up');
        onOpen();
    };

    const handleLogIn = () => {
        setView('sign_in');
        onOpen();
    };

    const handleNavigate = (path) => {
        router.push(path);
    };

    return (
        <div className="mx-auto text-center">
            <h1 className="text-2xl font-bold mb-10">Welcome to Savewell Finance</h1>
            {!user ? (
                <div>
                    <p className="mb-4 text-md">Please create an account or log in.</p>
                    <div className="flex justify-center space-x-4 mb-10">
                        <button
                            onClick={handleSignUp}
                            className="flex items-center px-8 py-4 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
                        >
                            Sign up
                        </button>
                        <button
                            onClick={handleLogIn}
                            className="flex items-center px-8 py-4 bg-green-500 text-white rounded-full shadow hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
                        >
                            Log in
                        </button>

                    </div>
                </div>
            ) : (
                <div>
                    <p className="text-md mb-4">You are logged in!</p>
                    <div className="flex justify-center space-x-4 mb-4">
                        <button
                            onClick={() => handleNavigate('/ss')}
                            className="px-6 py-3 text-black rounded border border-black"
                        >
                            Social Security Calculator
                        </button>
                        <button
                            onClick={() => handleNavigate('/roth')}
                            className="px-6 py-3 text-black rounded border border-black">
                            Roth Conversion Calculator
                        </button>
                    </div>
                </div>
            )}
            <div className="mb-16">
                <p className="mb-4 text-md">
                    For tutorials, you can visit our
                    <a href="https://www.youtube.com/channel/UCR4cz1d-uRtWErPHXeuyejA" target="_blank" className="text-blue-500 underline ml-1">YouTube channel</a>.
                </p>
                <div className="flex justify-center mb-4">
                    <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/_HqjYLkm0_8"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube Video Preview"
                    ></iframe>
                </div>

                <p className="mb-2 text-md">
                    Reach out to us any time at <a href="mailto:support@savewellfinance.com" className="text-blue-500 underline">support@savewellfinance.com</a>.
                </p>
                <p className="text-md mb-2">Sincerely,</p>
                <p className="text-md">Nick, John, & Megan</p>

                <footer className="mt-3 text-center text-sm text-gray-600">
                    <div className="flex justify-center space-x-4">
                        <a href="/privacy" className="hover:underline">Privacy Policy</a>
                        <a href="/terms" className="hover:underline">Terms of Use</a>
                    </div>
                </footer>

            </div>


        </div>
    );
};

export default LandingPage;
