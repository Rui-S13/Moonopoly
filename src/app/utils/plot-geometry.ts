import { Coordinates } from '../models/listing.models';

const MOON_RADIUS_KM = 1737.4;

export interface Bounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface Plot {
  center: Coordinates;
  widthKm: number;
  heightKm: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function offsetKm(from: Coordinates, to: Coordinates): { x: number; y: number } {
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLat = lat2 - lat1;
  const dLng = toRad(to[1] - from[1]);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const distance = 2 * MOON_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));

  const bearing = Math.atan2(
    Math.sin(dLng) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng),
  );

  return { x: distance * Math.sin(bearing), y: distance * Math.cos(bearing) };
}

export function plotsOverlap(a: Plot, b: Plot): boolean {
  const { x, y } = offsetKm(a.center, b.center);
  return Math.abs(x) < (a.widthKm + b.widthKm) / 2 && Math.abs(y) < (a.heightKm + b.heightKm) / 2;
}

/** The point reached by moving xKm east and yKm north from `from`. */
export function destination(from: Coordinates, xKm: number, yKm: number): Coordinates {
  const angularDistance = Math.hypot(xKm, yKm) / MOON_RADIUS_KM;
  const bearing = Math.atan2(xKm, yKm);
  const lat1 = toRad(from[0]);
  const lng1 = toRad(from[1]);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [(lat2 * 180) / Math.PI, (((lng2 * 180) / Math.PI + 540) % 360) - 180];
}

export function plotCorners(plot: Plot): Coordinates[] {
  const halfW = plot.widthKm / 2;
  const halfH = plot.heightKm / 2;
  return [
    destination(plot.center, -halfW, -halfH),
    destination(plot.center, halfW, -halfH),
    destination(plot.center, halfW, halfH),
    destination(plot.center, -halfW, halfH),
  ];
}
