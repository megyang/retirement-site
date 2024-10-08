"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavBar = () => {
    const pathname = usePathname();

    return (
        <div className="fixed top-16 left-0 h-full w-48 bg-[#8daef266] z-40">
            <nav className="mt-4">
                <ul className="space-y-2">
                    <li>
                        <Link href="/" passHref>
                            <div className={`block px-4 py-2 ${pathname === '/' ? 'font-bold' : ''}`}>
                                Home
                            </div>
                        </Link>
                    </li>

                    <li>
                        <Link href="/ss" passHref>
                            <div className={`block px-4 py-2 ${pathname === '/ss' ? 'font-bold' : ''}`}>
                                Social Security
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/roth" passHref>
                            <div className={`block px-4 py-2 ${pathname === '/roth' ? 'font-bold' : ''}`}>
                                Roth Conversion
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/tutorials" passHref>
                            <div className={`block px-4 py-2 ${pathname === '/tutorials' ? 'font-bold' : ''}`}>
                                Tutorials
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/security" passHref>
                            <div className={`block px-4 py-2 ${pathname === '/security' ? 'font-bold' : ''}`}>
                                Security Policy
                            </div>
                        </Link>
                    </li>

                </ul>
            </nav>
        </div>
    );
};

export default NavBar;