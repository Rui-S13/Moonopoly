import { Coordinates } from '../models/listing.models';

const KM_PER_DEGREE = 30.3;

export interface Bounds {
  south: number;
  north: number;
  west: number;
  east: number;
};

export function getBounds(center: Coordinates, widthKm: number, heightKm: number): Bounds {
  const [lat, lng] = center;
  const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const halfLat = heightKm / 2 / KM_PER_DEGREE;
  const halfLng = widthKm / 2 / (KM_PER_DEGREE * cos);
  return { south: lat - halfLat, north: lat + halfLat, west: lng - halfLng, east: lng + halfLng };
};

export function plotsOverlap(a: Bounds, b: Bounds): boolean {
  return a.west < b.east && a.east > b.west && a.south < b.north && a.north > b.south;
};