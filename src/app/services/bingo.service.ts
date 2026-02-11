import { Injectable, inject, signal, computed } from '@angular/core';
import { BingoCard, BingoSquare, ParkItem } from '../models/park.model';
import { v4 as uuidv4 } from 'uuid';
import { ParksDataService } from './parks-data.service';

export interface GameStats {
  totalGames: number;
  totalBingos: number;
  gamesPerPark: Record<string, number>;
  bingosPerPark: Record<string, number>;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BingoService {
  private readonly CARD_STORAGE_KEY = 'park-bingo-cards';
  private readonly STATS_KEY = 'park-bingo-stats';

  private parksDataService = inject(ParksDataService);

  readonly currentCard = signal<BingoCard | null>(null);

  // Delegate parks to the parks data service
  readonly parks = this.parksDataService.parks;
  readonly isLoading = this.parksDataService.isLoading;
  readonly isOffline = this.parksDataService.isOffline;
  readonly dataSource = this.parksDataService.dataSource;

  // Statistics signals
  readonly stats = signal<GameStats>({
    totalGames: 0,
    totalBingos: 0,
    gamesPerPark: {},
    bingosPerPark: {},
    currentStreak: 0,
    bestStreak: 0,
  });

  constructor() {
    this.loadSavedCards();
    this.loadStats();
  }

  generateCard(parkId: string): BingoCard {
    const park = this.parks().find((p) => p.id === parkId);
    if (!park) {
      throw new Error('Park not found');
    }

    // Check if park has enough items
    if (park.items.length < 24) {
      throw new Error(`Park ${park.name} doesn't have enough items to generate a bingo card`);
    }

    // Generate a random seed for this card
    const seed = uuidv4();

    // Create a deterministic random number generator based on the seed
    const random = this.createSeededRandom(seed);

    // Get random items from the park (excluding the free space item)
    const availableItems = [...park.items];
    const selectedItems: ParkItem[] = [];

    // We need 24 unique items (25 squares - 1 free space)
    while (selectedItems.length < 24 && availableItems.length > 0) {
      const randomIndex = Math.floor(random() * availableItems.length);
      selectedItems.push(availableItems.splice(randomIndex, 1)[0]);
    }

    // Create the 5x5 grid
    const squares: BingoSquare[][] = [];
    let itemIndex = 0;

    for (let i = 0; i < 5; i++) {
      const row: BingoSquare[] = [];

      for (let j = 0; j < 5; j++) {
        // Center square is the free space
        if (i === 2 && j === 2) {
          row.push({
            id: 'free',
            parkItem: {
              id: 'free',
              name: park.freeSpace,
              type: 'detail',
              description: 'Free space!',
              categories: ['free'],
            },
            status: 'completed',
          });
        } else {
          const item = selectedItems[itemIndex++];
          row.push({
            id: `square-${i}-${j}`,
            parkItem: item,
            status: 'unmarked',
          });
        }
      }

      squares.push(row);
    }

    const card: BingoCard = {
      id: uuidv4(),
      parkId,
      seed,
      squares,
      createdAt: new Date(),
      bingos: 0,
    };

    this.currentCard.set(card);
    this.saveCard(card);
    this.recordNewGame(parkId);

    return card;
  }

  updateSquareStatus(row: number, col: number, status: BingoSquare['status']) {
    const card = this.currentCard();
    if (!card) return;

    const newSquares = card.squares.map((r, i) =>
      i === row
        ? r.map((square, j) =>
            j === col
              ? { ...square, status, completedAt: status === 'completed' ? new Date() : undefined }
              : square
          )
        : r
    );

    const newCard = {
      ...card,
      squares: newSquares,
      bingos: this.countBingos(newSquares),
    };

    this.currentCard.set(newCard);
    this.saveCard(newCard);
  }

  private countBingos(squares: BingoSquare[][]): number {
    let count = 0;
    const size = 5;

    // Check rows
    for (let i = 0; i < size; i++) {
      if (this.isLineComplete(squares[i])) count++;
    }

    // Check columns
    for (let j = 0; j < size; j++) {
      const column = squares.map((row) => row[j]);
      if (this.isLineComplete(column)) count++;
    }

    // Check diagonals
    const diagonal1 = [];
    const diagonal2 = [];
    for (let i = 0; i < size; i++) {
      diagonal1.push(squares[i][i]);
      diagonal2.push(squares[i][size - 1 - i]);
    }

    if (this.isLineComplete(diagonal1)) count++;
    if (this.isLineComplete(diagonal2)) count++;

    return count;
  }

  private isLineComplete(squares: BingoSquare[]): boolean {
    return squares.every((square) => square.status === 'completed');
  }

  private createSeededRandom(seed: string): () => number {
    // Simple seeded random number generator (xorshift)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    let x = hash;
    return () => {
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      return (x >>> 0) / 0x100000000; // Convert to [0, 1)
    };
  }

  private saveCard(card: BingoCard) {
    const cards = this.getSavedCards();
    const existingIndex = cards.findIndex((c) => c.id === card.id);

    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }

    localStorage.setItem(this.CARD_STORAGE_KEY, JSON.stringify(cards));
  }

  private loadSavedCards() {
    const cards = this.getSavedCards();
    if (cards.length > 0) {
      // Load the most recent card
      const sorted = [...cards].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.currentCard.set(sorted[0]);
    }
  }

  private getSavedCards(): BingoCard[] {
    const saved = localStorage.getItem(this.CARD_STORAGE_KEY);
    if (!saved) return [];

    try {
      const cards = JSON.parse(saved) as BingoCard[];
      // Convert string dates back to Date objects
      return cards.map((card) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        completedAt: card.completedAt ? new Date(card.completedAt) : undefined,
        squares: card.squares.map((row) =>
          row.map((square) => ({
            ...square,
            completedAt: square.completedAt ? new Date(square.completedAt) : undefined,
          }))
        ),
      }));
    } catch (e) {
      console.error('Error loading saved cards', e);
      return [];
    }
  }

  // Stats management
  private loadStats() {
    const saved = localStorage.getItem(this.STATS_KEY);
    if (saved) {
      try {
        const stats = JSON.parse(saved) as GameStats;
        this.stats.set(stats);
      } catch (e) {
        console.error('Error loading stats', e);
      }
    }
  }

  private saveStats() {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats()));
  }

  recordNewGame(parkId: string) {
    const current = this.stats();
    const gamesPerPark = { ...current.gamesPerPark };
    gamesPerPark[parkId] = (gamesPerPark[parkId] || 0) + 1;

    this.stats.set({
      ...current,
      totalGames: current.totalGames + 1,
      gamesPerPark,
      lastPlayedAt: new Date().toISOString(),
    });
    this.saveStats();
  }

  recordBingo(parkId: string) {
    const current = this.stats();
    const bingosPerPark = { ...current.bingosPerPark };
    bingosPerPark[parkId] = (bingosPerPark[parkId] || 0) + 1;

    const newStreak = current.currentStreak + 1;
    const bestStreak = Math.max(current.bestStreak, newStreak);

    this.stats.set({
      ...current,
      totalBingos: current.totalBingos + 1,
      bingosPerPark,
      currentStreak: newStreak,
      bestStreak,
    });
    this.saveStats();
  }

  resetStreak() {
    const current = this.stats();
    this.stats.set({
      ...current,
      currentStreak: 0,
    });
    this.saveStats();
  }

  getStats(): GameStats {
    return this.stats();
  }

  clearStats() {
    this.stats.set({
      totalGames: 0,
      totalBingos: 0,
      gamesPerPark: {},
      bingosPerPark: {},
      currentStreak: 0,
      bestStreak: 0,
    });
    localStorage.removeItem(this.STATS_KEY);
  }

  getAllCards(): BingoCard[] {
    return this.getSavedCards();
  }
}
