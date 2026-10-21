export type Coordinates = [latitude: number, longitude: number];
export type ListingType = 'sale' | 'rent';
export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface Listing {
  id: number;
  description: string;
  type: ListingType;
  price: number;
  status: ListingStatus;
  center: Coordinates;
  widthKm: number;
  heightKm: number;
  imageUrl?: string;
  publishedAt: string;
  contactEmail: string;
};

export interface TerrainInfo {
  region: string;
  earthFacing: boolean;
  likelyWaterIce: boolean;
};