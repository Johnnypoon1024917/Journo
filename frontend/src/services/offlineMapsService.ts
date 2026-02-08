import localforage from 'localforage';
import { OfflineMapTile, OfflineMapRegion, OfflineMapDownloadProgress } from '../types/offline';
import { Place } from '../types/trip';

// Configure localforage instances for map data
const mapTilesStore = localforage.createInstance({
  name: 'journo',
  storeName: 'map_tiles',
});

const mapRegionsStore = localforage.createInstance({
  name: 'journo',
  storeName: 'map_regions',
});

/**
 * Offline Maps Service
 * Handles downloading, caching, and serving map tiles for offline use
 */
class OfflineMapsService {
  private downloadControllers: Map<string, AbortController> = new Map();

  /**
   * Calculate bounds for a trip based on its places
   */
  calculateTripBounds(places: Place[]): {
    north: number;
    south: number;
    east: number;
    west: number;
    center: { lat: number; lng: number };
  } | null {
    const validPlaces = places.filter(p => p.lat && p.lng);
    
    if (validPlaces.length === 0) {
      return null;
    }

    let north = validPlaces[0].lat!;
    let south = validPlaces[0].lat!;
    let east = validPlaces[0].lng!;
    let west = validPlaces[0].lng!;

    validPlaces.forEach(place => {
      if (place.lat! > north) north = place.lat!;
      if (place.lat! < south) south = place.lat!;
      if (place.lng! > east) east = place.lng!;
      if (place.lng! < west) west = place.lng!;
    });

    // Add padding (approximately 10% on each side)
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;

    north += latPadding;
    south -= latPadding;
    east += lngPadding;
    west -= lngPadding;

    const center = {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    };

    return { north, south, east, west, center };
  }

  /**
   * Calculate tile coordinates for a given lat/lng and zoom level
   */
  private latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
    );
    return { x, y };
  }

  /**
   * Get all tile coordinates needed to cover a bounding box
   */
  private getTilesForBounds(
    bounds: { north: number; south: number; east: number; west: number },
    zoom: number
  ): Array<{ x: number; y: number; zoom: number }> {
    const tiles: Array<{ x: number; y: number; zoom: number }> = [];
    
    const nw = this.latLngToTile(bounds.north, bounds.west, zoom);
    const se = this.latLngToTile(bounds.south, bounds.east, zoom);

    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        tiles.push({ x, y, zoom });
      }
    }

    return tiles;
  }

  /**
   * Download map tiles for a trip
   */
  async downloadMapTiles(
    tripId: string,
    tripName: string,
    places: Place[],
    zoomLevels: number[] = [12, 13, 14],
    onProgress?: (progress: OfflineMapDownloadProgress) => void
  ): Promise<OfflineMapRegion> {
    const bounds = this.calculateTripBounds(places);
    
    if (!bounds) {
      throw new Error('No valid places with coordinates found');
    }

    // Calculate all tiles needed
    const allTiles: Array<{ x: number; y: number; zoom: number }> = [];
    zoomLevels.forEach(zoom => {
      const tiles = this.getTilesForBounds(bounds, zoom);
      allTiles.push(...tiles);
    });

    const totalTiles = allTiles.length;
    let downloadedTiles = 0;
    let failedTiles = 0;
    let totalSize = 0;

    // Create abort controller for this download
    const controller = new AbortController();
    this.downloadControllers.set(tripId, controller);

    try {
      // Download tiles in batches to avoid overwhelming the browser
      const batchSize = 10;
      for (let i = 0; i < allTiles.length; i += batchSize) {
        if (controller.signal.aborted) {
          throw new Error('Download cancelled');
        }

        const batch = allTiles.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(tile => this.downloadTile(tile.x, tile.y, tile.zoom, controller.signal))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            downloadedTiles++;
            totalSize += result.value.size;
          } else {
            failedTiles++;
            console.error(`Failed to download tile ${batch[index].x},${batch[index].y},${batch[index].zoom}:`, result.reason);
          }
        });

        // Report progress
        if (onProgress) {
          onProgress({
            trip_id: tripId,
            total_tiles: totalTiles,
            downloaded_tiles: downloadedTiles,
            failed_tiles: failedTiles,
            progress_percent: Math.round((downloadedTiles / totalTiles) * 100),
            status: 'downloading',
          });
        }
      }

      // Create region metadata
      const region: OfflineMapRegion = {
        id: tripId,
        trip_id: tripId,
        name: tripName,
        bounds,
        center: bounds.center,
        zoom_levels: zoomLevels,
        tile_count: downloadedTiles,
        size_bytes: totalSize,
        downloaded_at: new Date().toISOString(),
      };

      await mapRegionsStore.setItem(tripId, region);

      if (onProgress) {
        onProgress({
          trip_id: tripId,
          total_tiles: totalTiles,
          downloaded_tiles: downloadedTiles,
          failed_tiles: failedTiles,
          progress_percent: 100,
          status: 'completed',
        });
      }

      return region;
    } catch (error) {
      if (onProgress) {
        onProgress({
          trip_id: tripId,
          total_tiles: totalTiles,
          downloaded_tiles: downloadedTiles,
          failed_tiles: failedTiles,
          progress_percent: Math.round((downloadedTiles / totalTiles) * 100),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      throw error;
    } finally {
      this.downloadControllers.delete(tripId);
    }
  }

  /**
   * Download a single map tile
   */
  private async downloadTile(x: number, y: number, zoom: number, signal?: AbortSignal): Promise<{ size: number }> {
    // Use OpenStreetMap tiles as a fallback (Google Maps tiles require authentication)
    // In production, you would use Google Maps Static API or a similar service
    const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    
    const tileId = `${zoom}_${x}_${y}`;
    
    try {
      const response = await fetch(url, { signal });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      const tile: OfflineMapTile = {
        id: tileId,
        x,
        y,
        zoom,
        url,
        blob,
        downloaded_at: new Date().toISOString(),
      };

      await mapTilesStore.setItem(tileId, tile);
      
      return { size: blob.size };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw new Error(`Failed to download tile: ${error}`);
    }
  }

  /**
   * Cancel an ongoing download
   */
  cancelDownload(tripId: string): void {
    const controller = this.downloadControllers.get(tripId);
    if (controller) {
      controller.abort();
      this.downloadControllers.delete(tripId);
    }
  }

  /**
   * Get cached tile for offline use
   */
  async getCachedTile(x: number, y: number, zoom: number): Promise<string | null> {
    const tileId = `${zoom}_${x}_${y}`;
    const tile = await mapTilesStore.getItem<OfflineMapTile>(tileId);
    
    if (tile && tile.blob) {
      return URL.createObjectURL(tile.blob);
    }
    
    return null;
  }

  /**
   * Check if offline maps are available for a trip
   */
  async hasOfflineMaps(tripId: string): Promise<boolean> {
    const region = await mapRegionsStore.getItem<OfflineMapRegion>(tripId);
    return region !== null;
  }

  /**
   * Get offline map region for a trip
   */
  async getOfflineMapRegion(tripId: string): Promise<OfflineMapRegion | null> {
    return await mapRegionsStore.getItem<OfflineMapRegion>(tripId);
  }

  /**
   * Get all offline map regions
   */
  async getAllOfflineMapRegions(): Promise<OfflineMapRegion[]> {
    const regions: OfflineMapRegion[] = [];
    await mapRegionsStore.iterate<OfflineMapRegion, void>((region) => {
      regions.push(region);
    });
    return regions.sort((a, b) => 
      new Date(b.downloaded_at).getTime() - new Date(a.downloaded_at).getTime()
    );
  }

  /**
   * Delete offline maps for a trip
   */
  async deleteOfflineMaps(tripId: string): Promise<void> {
    const region = await mapRegionsStore.getItem<OfflineMapRegion>(tripId);
    
    if (!region) {
      return;
    }

    // Delete all tiles for this region
    const tilesToDelete: string[] = [];
    
    for (const zoom of region.zoom_levels) {
      const tiles = this.getTilesForBounds(region.bounds, zoom);
      tiles.forEach(tile => {
        tilesToDelete.push(`${tile.zoom}_${tile.x}_${tile.y}`);
      });
    }

    await Promise.all(
      tilesToDelete.map(tileId => mapTilesStore.removeItem(tileId))
    );

    // Delete region metadata
    await mapRegionsStore.removeItem(tripId);
  }

  /**
   * Get total storage used by offline maps
   */
  async getStorageSize(): Promise<number> {
    let totalSize = 0;
    
    await mapTilesStore.iterate<OfflineMapTile, void>((tile) => {
      if (tile.blob) {
        totalSize += tile.blob.size;
      }
    });
    
    return totalSize;
  }

  /**
   * Clear all offline maps
   */
  async clearAllMaps(): Promise<void> {
    await mapTilesStore.clear();
    await mapRegionsStore.clear();
  }

  /**
   * Update last accessed time for a region
   */
  async updateLastAccessed(tripId: string): Promise<void> {
    const region = await mapRegionsStore.getItem<OfflineMapRegion>(tripId);
    if (region) {
      region.last_accessed = new Date().toISOString();
      await mapRegionsStore.setItem(tripId, region);
    }
  }
}

export const offlineMapsService = new OfflineMapsService();
export default offlineMapsService;
