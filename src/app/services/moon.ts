import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Coordinates, TerrainInfo } from '../models/listing.models';

interface RegionArea {
  name: string;
  south: number;
  north: number;
  west: number;
  east: number;
}

@Injectable({ providedIn: 'root' })
export class MoonService {
  private readonly http = inject(HttpClient);

  private regions: RegionArea[] = [];

  async loadRegions(): Promise<void> {
    this.regions = await firstValueFrom(
      this.http.get<RegionArea[]>('/data/moon-regions.json')
    );
  }

  getTerrainInfo(center: Coordinates): TerrainInfo {
    const [lat, lng] = center;

    return {
      region: this.findRegion(lat, lng),
      earthFacing: lng > -90 && lng < 90,
      likelyWaterIce: Math.abs(lat) >= 85,
    };
  }

  private findRegion(lat: number, lng: number): string {
    const match = this.regions.find(
      (region) =>
        lat >= region.south &&
        lat <= region.north &&
        lng >= region.west &&
        lng <= region.east
    );

    return match ? match.name : 'Lunar Highlands';
  }

  getRegionNames(): string[] {
    return [
      ...this.regions.map((region) => region.name),
      'Lunar Highlands',
      'Far Side Highlands',
    ];
  }
}