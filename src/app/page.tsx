'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PlayIcon, RotateCwIcon } from 'lucide-react';

import { createURLString, randomInteger } from '@/utils';

type Opponent = 'user' | 'computer';

const avatars = [
  '/images/brain.png',
  '/images/cat.png',
  '/images/dog.png',
  '/images/fish.png',
  '/images/ghost.png',
  '/images/monster.png',
  '/images/mummy.png',
  '/images/robot.png',
  '/images/skeleton.png',
  '/images/vampire.png',
  '/images/zombie.png',
];

export default function Home() {
  const router = useRouter();

  const [opponent, setOpponent] = useState<Opponent>('user');
  const [defaultUsername, setDefaultUsername] = useState('');
  const [avatar, setAvatar] = useState<number | null>(null);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const digits = randomInteger(0, 10_000);
    const padded = String(digits).padStart(4, '0');
    setDefaultUsername(`Nickname${padded}`);

    const avatarIndex = randomInteger(0, avatars.length);
    setAvatar(avatarIndex);
  }, []);

  const nextAvatar = (): void => {
    if (avatar === null) return;

    const avatarIndex = (avatar + 1) % avatars.length;

    setAvatar(avatarIndex);
  };

  const startGame = (): void => {
    const username = usernameRef.current!.value || defaultUsername;
    const route = createURLString('/play', { opponent, username, avatar: String(avatar) });

    router.push(route);
  };

  return (
    <div className="grid h-full place-items-center">
      <main className="rounded-lg bg-light-200 p-6 shadow-[8px_8px_0_0_theme(colors.dark.800)] drop-shadow-2xl lg:p-12">
        <div className="grid grid-rows-[1fr_0.2rem_1fr] gap-8 md:grid-cols-[1fr_0.2rem_1fr] md:grid-rows-none md:gap-12">
          <div className="flex flex-col items-center gap-8">
            <div className="relative flex">
              <div className="grid h-44 w-44 place-items-center overflow-hidden rounded-full border-4 border-dark-800 bg-orange-500">
                {avatar !== null ? (
                  <Image
                    src={avatars[avatar]}
                    alt="User avatar"
                    width={240}
                    height={240}
                    priority={true}
                  />
                ) : null}
              </div>

              <div className="absolute left-32 top-32 rotate-180 cursor-pointer rounded-full bg-light-100 p-2 *:stroke-dark-800 hover:scale-110">
                <RotateCwIcon size={30} strokeWidth={3.2} onClick={nextAvatar} />
              </div>
            </div>

            <input
              ref={usernameRef}
              type="text"
              placeholder={defaultUsername}
              className="rounded border-2 border-dark-800 bg-orange-200 p-2 pl-3 text-xl outline-none saturate-50 placeholder:text-dark-800 focus:saturate-100"
            />
          </div>

          <div className="h-[0.2rem] rounded-full bg-dark-800 md:h-auto md:w-[0.2rem]"></div>

          <div className="flex flex-col items-center justify-between">
            <div>
              <h3 className="mb-5 text-2xl">Wybierz przeciwnika</h3>
              <div
                className={`${opponent == 'computer' ? 'after:translate-x-full' : ''} relative grid cursor-pointer grid-cols-2 rounded border-[3px] border-dark-800 text-lg after:absolute after:h-full after:w-1/2 after:bg-dark-800 after:transition-transform after:ease-out`}
              >
                <div
                  className={`${opponent == 'user' ? 'text-light-100' : ''} relative z-[1] px-4 py-2 text-center transition-colors`}
                  onClick={() => setOpponent('user')}
                >
                  Gracz
                </div>
                <div
                  className={`${opponent == 'computer' ? 'text-light-100' : ''} relative z-[1] px-4 py-2 text-center transition-colors`}
                  onClick={() => setOpponent('computer')}
                >
                  Komputer
                </div>
              </div>
            </div>

            <button
              className="mb-2 flex items-center gap-3 rounded-lg bg-orange-300 p-2 px-12 shadow-[0_6px_0_0_theme(colors.dark.800)] *:fill-dark-800 *:stroke-dark-800 hover:brightness-105 active:mb-1 active:shadow-[0_2px_0_0_theme(colors.dark.800)]"
              onClick={startGame}
            >
              <PlayIcon size={20} strokeWidth={5} />
              <span className="text-xl font-semibold">START</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
