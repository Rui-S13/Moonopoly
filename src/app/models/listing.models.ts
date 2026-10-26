export type Coordinates = [latitude: number, longitude: number];
export type ListingType = 'sale' | 'rent';
export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface Listing {
  id: number;
  description: string | null;
  type: ListingType;
  price: number;
  status: ListingStatus;
  center: Coordinates;
  widthKm: number;
  heightKm: number;
  imageUrl?: string | null;
  publishedAt: string;
  ownerId: string;
};

export interface TerrainInfo {
  region: string;
  earthFacing: boolean;
  likelyWaterIce: boolean;
};