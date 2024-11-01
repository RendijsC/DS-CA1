import { Game, GameDeveloper } from '../shared/types';


export const games: Game[] = [
  {
    id: 1,
    title: 'Mario',
    developer: 'Nintendo',
    release_year: 1973,
    description: 'A classic platformer where Mario embarks on a quest to rescue Princess Peach from Bowser in the Mushroom Kingdom.',
    original_language: 'en',
    original_title: 'Mario'
  },
  {
    id: 2,
    title: 'The Legend of Zelda',
    developer: 'Nintendo',
    release_year: 1986,
    description: 'An action-adventure game featuring Link on a quest to save Princess Zelda.',
    original_language: 'en',
    original_title: 'The Legend of Zelda'
  },
  {
    id: 3,
    title: 'Pac-Man',
    developer: 'Atari',
    release_year: 1980,
    description: 'A classic arcade game where Pac-Man navigates mazes, eating pellets while avoiding ghosts.',
    original_language: 'en',
    original_title: 'Pac-Man'
  },
  {
    id: 4,
    title: 'Donkey Kong',
    developer: 'Nintendo',
    release_year: 1981,
    description: 'A platformer where Mario must save Pauline from Donkey Kong by climbing platforms.',
    original_language: 'en',
    original_title: 'Donkey Kong'
  },
  {
    id: 5,
    title: 'Street Fighter II',
    developer: 'Capcom',
    release_year: 1991,
    description: 'A competitive fighting game where players choose characters to battle opponents.',
    original_language: 'en',
    original_title: 'Street Fighter II'
  },
  {
    id: 6,
    title: 'Tetris',
    developer: 'Nintendo',
    release_year: 1984,
    description: 'A puzzle game where players rotate and arrange falling blocks to clear lines.',
    original_language: 'en',
    original_title: 'Tetris'
  }
];


export const gameDevelopers: GameDeveloper[] = [
  {
    gameId: 1,
    developerName: "Shigeru Miyamoto",
    roleName: "Game Designer",
    roleDescription: "Legendary game designer known for Mario, Zelda, and Donkey Kong."
  },
  {
    gameId: 2,
    developerName: "Shigeru Miyamoto",
    roleName: "Game Designer",
    roleDescription: "Created the world of Hyrule and established the Zelda franchise."
  },
  {
    gameId: 3,
    developerName: "Toru Iwatani",
    roleName: "Game Designer",
    roleDescription: "Creator of Pac-Man, one of the most iconic arcade games of all time."
  },
  {
    gameId: 4,
    developerName: "Shigeru Miyamoto",
    roleName: "Game Designer",
    roleDescription: "Also worked on Donkey Kong, another Nintendo classic."
  },
  {
    gameId: 5,
    developerName: "Akira Nishitani",
    roleName: "Game Designer",
    roleDescription: "Key designer behind Street Fighter II, the game that defined the fighting genre."
  },
  {
    gameId: 6,
    developerName: "Alexey Pajitnov",
    roleName: "Game Designer",
    roleDescription: "The mind behind Tetris, a timeless puzzle game."
  }
];