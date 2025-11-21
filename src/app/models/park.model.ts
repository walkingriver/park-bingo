export interface Park {
  id: string;
  name: string;
  icon: string;
  freeSpace: string;
  items: ParkItem[];
}

export interface ParkItem {
  id: string;
  name: string;
  type: 'ride' | 'show' | 'character' | 'food' | 'detail' | 'transportation';
  description: string;
  waitTime?: number;
  heightRequirement?: string;
  geniePlusEligible?: boolean;
  bestTime?: string;
  imageUrl?: string;
  categories: string[];
}

export interface BingoCard {
  id: string;
  parkId: string;
  seed: string;
  squares: BingoSquare[][];
  createdAt: Date;
  completedAt?: Date;
  bingos: number;
}

export interface BingoSquare {
  id: string;
  parkItem: ParkItem;
  status: 'unmarked' | 'completed' | 'skipped' | 'in-progress';
  completedAt?: Date;
  proofImageUrl?: string;
}

export const PARKS: Park[] = [
  {
    id: 'mk',
    name: 'Magic Kingdom',
    icon: '🏰',
    freeSpace: 'Cinderella Castle',
    items: [],
  },
  {
    id: 'epcot',
    name: 'EPCOT',
    icon: '🌐',
    freeSpace: 'Spaceship Earth',
    items: [],
  },
  {
    id: 'hs',
    name: 'Hollywood Studios',
    icon: '🎬',
    freeSpace: 'Chinese Theatre',
    items: [],
  },
  {
    id: 'ak',
    name: 'Animal Kingdom',
    icon: '🌴',
    freeSpace: 'Tree of Life',
    items: [],
  },
  {
    id: 'dl',
    name: 'Disneyland',
    icon: '🏰',
    freeSpace: 'Sleeping Beauty Castle',
    items: [],
  },
  {
    id: 'dca',
    name: 'Disney California Adventure',
    icon: '🎢',
    freeSpace: 'Carthay Circle Restaurant',
    items: [],
  },
];
