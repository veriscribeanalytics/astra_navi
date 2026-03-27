'use client';

import Link from "next/link";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";

interface INavbarProps{}

const navItems = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "about",
    label: "About Us",
    href: "/about",
  },
  {
    id: "chat",
    label: "Chat with AI",
    href: "/chat",
  },
  {
    id: "plans",
    label: "Plans",
    href: "/plans",
  },
];

const Navbar: React.FunctionComponent<INavbarProps> = (props) => {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout, showLoading } = useAuth();
    
    const handleLogout = () => {
        showLoading("Returning to the stars...", 1500);
        setTimeout(() => {
            logout();
            router.push('/login');
        }, 1500);
    };
    
    const isActive = (path:string) => pathname == path;

    return(
        <nav className="fixed top-0 w-full z-[110] bg-background/80 backdrop-blur-md border-b border-secondary/10">
            <div className="flex justify-between items-center px-4 sm:px-8 lg:px-12 py-4 w-full mx-auto">
                <Link
                    href="/"
                    className="flex shrink-0 items-center justify-center text-2xl font-bold tracking-tighter text-primary font-headline"
                >
                    <Image
                        src="/icons/logo.jpeg"
                        alt="Astra Navi Logo"
                        height={32}
                        width={32}
                        className="object-contain mr-2"
                        priority
                    />
                    Astra Navi
                </Link>
                <div className="hidden md:flex items-center space-x-8 font-body font-medium tracking-wide text-sm">
                    {navItems
                        .filter(item => item.id !== 'chat' || isLoggedIn)
                        .map((eachItem) => (
                        <Link
                            key={eachItem.id}
                            href={eachItem.href}
                            className={`transition-all duration-300 ${
                                isActive(eachItem.href) 
                                    ? "text-primary border-b-2 border-secondary pb-1" 
                                    : "text-primary/70 hover:text-primary"
                            }`}
                        >
                            {eachItem.label}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <ThemeToggle />
                    <Button
                        href="/shop"
                        variant="secondary"
                        size="sm"
                        className="hidden sm:inline-flex"
                    >
                        Shop
                    </Button>
                    {!isLoggedIn ? (
                        <Button
                            href="/login"
                            variant="primary"
                            size="md"
                            className="hidden sm:inline-flex"
                        >
                            Login
                        </Button>
                    ) : (
                        <Button
                            onClick={handleLogout}
                            variant="primary"
                            size="md"
                            className="hidden sm:inline-flex bg-red-900 border-red-500/50 hover:bg-red-800"
                        >
                            Logout
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}    

export default Navbar;
