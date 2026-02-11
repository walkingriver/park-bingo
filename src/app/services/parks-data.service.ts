import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { catchError, forkJoin, map, of, tap, timeout } from 'rxjs';
import { Park, ParkItem } from '../models/park.model';

interface ParksConfig {
  version: string;
  lastUpdated: string;
  parks: ParkMetadata[];
}

interface ParkMetadata {
  id: string;
  name: string;
  shortName: string;
  description: string;
  freeSpace: string;
  icon: string;
  itemsFile: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParksDataService {
  private http = inject(HttpClient);

  // Remote URL - can be updated to point to CDN or different branch
  private readonly REMOTE_BASE_URL =
    'https://raw.githubusercontent.com/walkingriver/park-bingo/main/public/data/';
  private readonly REMOTE_CONFIG_URL = `${this.REMOTE_BASE_URL}parks.json`;

  // Local fallback URLs (bundled with app)
  private readonly LOCAL_CONFIG_URL = 'data/parks.json';
  private readonly LOCAL_PARKS_BASE_URL = 'data/parks/';

  // Cache keys for Capacitor Preferences
  private readonly CACHE_KEY_CONFIG = 'parks-config-cache';
  private readonly CACHE_KEY_PARKS = 'parks-data-cache';
  private readonly CACHE_KEY_VERSION = 'parks-data-version';

  // Network timeout (5 seconds - parks are in remote areas)
  private readonly NETWORK_TIMEOUT = 5000;

  // Signals
  readonly parks = signal<Park[]>([]);
  readonly isLoading = signal(true);
  readonly isOffline = signal(false);
  readonly dataSource = signal<'remote' | 'cache' | 'bundled'>('bundled');
  readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    this.loadParksData();
  }

  async loadParksData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // Try remote first
      const remoteData = await this.loadFromRemote();
      if (remoteData) {
        this.parks.set(remoteData);
        this.dataSource.set('remote');
        this.isOffline.set(false);
        await this.cacheParksData(remoteData);
        this.isLoading.set(false);
        return;
      }
    } catch (error) {
      console.log('Remote load failed, trying cache...', error);
    }

    try {
      // Try cache next
      const cachedData = await this.loadFromCache();
      if (cachedData && cachedData.length > 0) {
        this.parks.set(cachedData);
        this.dataSource.set('cache');
        this.isOffline.set(true);
        this.isLoading.set(false);
        return;
      }
    } catch (error) {
      console.log('Cache load failed, using bundled...', error);
    }

    // Fall back to bundled data
    await this.loadFromBundled();
    this.dataSource.set('bundled');
    this.isLoading.set(false);
  }

  private async loadFromRemote(): Promise<Park[] | null> {
    return new Promise((resolve, reject) => {
      this.http
        .get<ParksConfig>(this.REMOTE_CONFIG_URL)
        .pipe(
          timeout(this.NETWORK_TIMEOUT),
          catchError((error) => {
            console.warn('Failed to load remote config:', error);
            reject(error);
            return of(null);
          })
        )
        .subscribe((config) => {
          if (!config) {
            reject(new Error('No config received'));
            return;
          }

          // Load all park items
          const itemRequests = config.parks.map((park) =>
            this.http
              .get<ParkItem[]>(`${this.REMOTE_BASE_URL}parks/${park.itemsFile}`)
              .pipe(
                timeout(this.NETWORK_TIMEOUT),
                map((items) => this.mapParkMetadataToFull(park, items)),
                catchError(() => {
                  // If individual park fails, try local version
                  return this.http
                    .get<ParkItem[]>(`${this.LOCAL_PARKS_BASE_URL}${park.itemsFile}`)
                    .pipe(
                      map((items) => this.mapParkMetadataToFull(park, items)),
                      catchError(() => of(null))
                    );
                })
              )
          );

          forkJoin(itemRequests).subscribe({
            next: (parks) => {
              const validParks = parks.filter((p): p is Park => p !== null);
              if (validParks.length > 0) {
                this.lastUpdated.set(new Date(config.lastUpdated));
                resolve(validParks);
              } else {
                reject(new Error('No valid parks loaded from remote'));
              }
            },
            error: reject,
          });
        });
    });
  }

  private async loadFromCache(): Promise<Park[] | null> {
    try {
      const { value } = await Preferences.get({ key: this.CACHE_KEY_PARKS });
      if (value) {
        const parsed = JSON.parse(value) as Park[];
        const { value: lastUpdated } = await Preferences.get({ key: this.CACHE_KEY_VERSION });
        if (lastUpdated) {
          this.lastUpdated.set(new Date(lastUpdated));
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
    return null;
  }

  private async loadFromBundled(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<ParkMetadata[]>(this.LOCAL_CONFIG_URL).subscribe({
        next: (parksData) => {
          const itemRequests = parksData.map((park) =>
            this.http.get<ParkItem[]>(`${this.LOCAL_PARKS_BASE_URL}${park.itemsFile}`).pipe(
              map((items) => this.mapParkMetadataToFull(park, items)),
              catchError(() => of(null))
            )
          );

          forkJoin(itemRequests).subscribe({
            next: (parks) => {
              const validParks = parks.filter((p): p is Park => p !== null);
              this.parks.set(validParks);
              this.lastUpdated.set(null); // Bundled has no update date
              resolve();
            },
            error: () => {
              console.error('Failed to load bundled data');
              resolve();
            },
          });
        },
        error: () => {
          console.error('Failed to load bundled config');
          resolve();
        },
      });
    });
  }

  private async cacheParksData(parks: Park[]): Promise<void> {
    try {
      await Preferences.set({
        key: this.CACHE_KEY_PARKS,
        value: JSON.stringify(parks),
      });
      await Preferences.set({
        key: this.CACHE_KEY_VERSION,
        value: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to cache parks data:', error);
    }
  }

  private mapParkMetadataToFull(metadata: ParkMetadata, items: ParkItem[]): Park {
    return {
      id: metadata.id,
      name: metadata.name,
      shortName: metadata.shortName,
      description: metadata.description,
      freeSpace: metadata.freeSpace,
      icon: metadata.icon,
      items: items,
    };
  }

  async refreshData(): Promise<boolean> {
    try {
      this.isLoading.set(true);
      const remoteData = await this.loadFromRemote();
      if (remoteData) {
        this.parks.set(remoteData);
        this.dataSource.set('remote');
        this.isOffline.set(false);
        await this.cacheParksData(remoteData);
        this.isLoading.set(false);
        return true;
      }
    } catch (error) {
      console.warn('Refresh failed:', error);
    }
    this.isLoading.set(false);
    return false;
  }

  async clearCache(): Promise<void> {
    await Preferences.remove({ key: this.CACHE_KEY_PARKS });
    await Preferences.remove({ key: this.CACHE_KEY_VERSION });
    await Preferences.remove({ key: this.CACHE_KEY_CONFIG });
  }
}
