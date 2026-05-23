'use client';
import { useRouter } from 'next/navigation';

export default function Home({ showBack = true, title = "Ayam Kalintang" }) {
    const router = useRouter();
    return (
        <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm h-24 shrink-0">
            <div className="w-40">
                {showBack && (
                    <button
                        onClick={() => router.back()}
                        className="flex items-center"
                    >
                        Back
                    </button>
                )}
            </div>
            <h1>{title}</h1>
        </header>
    );
}
