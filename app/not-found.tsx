"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoveLeft, HelpCircle, LifeBuoy, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs with Theme Colors */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-theme-blob-1 rounded-full blur-[100px] -z-10 animate-blob" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-theme-blob-2 rounded-full blur-[100px] -z-10 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-theme-blob-3 rounded-full blur-[120px] -z-10 animate-blob animation-delay-4000 opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl text-center space-y-10"
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo width={56} height={56} textClassName="text-4xl" />
                </div>

                {/* 404 Visual */}
                <div className="relative inline-block">
                    <motion.h1
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.2
                        }}
                        className="text-[12rem] md:text-[18rem] font-black leading-none tracking-tighter select-none opacity-10"
                    >
                        404
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[200%] w-full"
                    >
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-theme-gradient px-4">
                            Lost in space?
                        </h2>
                    </motion.div>
                </div>

                <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed font-medium">
                    The page you're looking for seems to have vanished into the digital void. Don't worry, even the best explorers lose their way sometimes.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20">
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            Back to Home
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full px-10 h-14 text-lg font-bold transition-all hover:bg-secondary/80 border-2" asChild>
                        <Link href="/help" className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5" />
                            Help Center
                        </Link>
                    </Button>
                </div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm border-t border-border/50"
                >
                    <Link href="/courses" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all justify-center group">
                        <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all group-hover:scale-110">
                            📚
                        </span>
                        <span className="font-semibold">Browse Courses</span>
                    </Link>
                    <Link href="/search" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all justify-center group">
                        <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all group-hover:scale-110">
                            🔍
                        </span>
                        <span className="font-semibold">Search Platform</span>
                    </Link>
                    <Link href="/contact" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all justify-center group">
                        <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all group-hover:scale-110">
                            💬
                        </span>
                        <span className="font-semibold">Contact Support</span>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Footer copyright */}
            <footer className="absolute bottom-8 text-muted-foreground/40 text-xs font-medium tracking-widest uppercase">
                &copy; {new Date().getFullYear()} CourseSphere &bull; Est. 2024
            </footer>
        </div>
    );
}

