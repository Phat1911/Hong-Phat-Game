'use client';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Gamepad2, Trophy, MessageCircle, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Hong Phat Games
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/games" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <Gamepad2 className="w-5 h-5" />
              <span className="hidden sm:inline">Games</span>
            </Link>
            <Link href="/ranking" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <Trophy className="w-5 h-5" />
              <span className="hidden sm:inline">Ranking</span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/messages" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Messages</span>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">{user?.username}</span>
                  <button
                    onClick={logout}
                    className="p-2 text-white/70 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary flex items-center gap-2">
                <User className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
