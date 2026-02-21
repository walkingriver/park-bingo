export interface Park {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
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
  isActive?: boolean;
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
