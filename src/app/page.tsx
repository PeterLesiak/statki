'use client';

import Image, { type StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createURLString } from '@/utils';

interface SelectGameModeProps {
    title: string;
    theme: string;
    picture: StaticImageData | string;
    active?: boolean;
    onClick?: () => void;
}

function SelectGameMode({ title, theme, picture, active, onClick }: SelectGameModeProps) {
    return (
        <div
            className={`group h-[7.3rem] w-52 cursor-pointer overflow-hidden rounded-lg border-4 border-light px-4 shadow transition duration-500 ease-out ${theme} ${active ? '' : '[&:not(:hover)]:saturate-0'}`}
            onClick={onClick}
        >
            <div className="mt-2 text-center text-2xl font-bold text-light transition-transform duration-500 ease-out group-hover:translate-x-[-1rem]">
                {title}
            </div>

            <Image
                src={picture}
                alt="Mode picture"
                width={100}
                height={100}
                className="transition-transform duration-500 ease-out group-hover:translate-x-10"
            />
        </div>
    );
}

export default function Home() {
    const router = useRouter();
    const [mode, setMode] = useState<'user' | 'computer' | null>(null);

    const startGame = () => {
        if (!mode) return;

        const route = createURLString('/play', { mode });

        router.push(route, { scroll: false });
    };

    return (
        <div className="grid h-screen place-content-center">
            <main className="flex flex-col items-center gap-5 rounded border border-light-200 bg-light-100 p-10 shadow-lg">
                <header className="text-4xl font-semibold">Nowa gra</header>
                <h2>Wybierz tryb gry:</h2>

                <section className="flex gap-5">
                    <SelectGameMode
                        title="Gracz"
                        theme="bg-red-500"
                        picture="/images/users.png"
                        active={mode == 'user'}
                        onClick={() => setMode('user')}
                    />
                    <SelectGameMode
                        title="Komputer"
                        theme="bg-blue-500"
                        picture="/images/robot.png"
                        active={mode == 'computer'}
                        onClick={() => setMode('computer')}
                    />
                </section>

                <button
                    onClick={startGame}
                    className={`rounded-2xl border-b-[6px] border-green-600 bg-green-500 px-36 py-2 text-lg font-semibold text-light transition ease-in ${mode ? 'hover:brightness-110' : 'cursor-default saturate-0'}`}
                >
                    START
                </button>
            </main>
        </div>
    );
}
