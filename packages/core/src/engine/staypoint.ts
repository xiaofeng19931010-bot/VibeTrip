export interface GeoPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface StayPoint {
  startTime: number;
  endTime: number;
  latitude: number;
  longitude: number;
  pointCount: number;
  name?: string;
  category?: string;
}

export interface ClusteringConfig {
  distanceThreshold: number;
  timeThreshold: number;
  minStayDuration: number;
}

const DEFAULT_CONFIG: ClusteringConfig = {
  distanceThreshold: 200,
  timeThreshold: 30 * 60 * 1000,
  minStayDuration: 10 * 60 * 1000,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

function calculateCentroid(points: GeoPoint[]): { latitude: number; longitude: number } {
  const sumLat = points.reduce((sum, p) => sum + p.latitude, 0);
  const sumLon = points.reduce((sum, p) => sum + p.longitude, 0);
  return {
    latitude: sumLat / points.length,
    longitude: sumLon / points.length,
  };
}

export function identifyStayPoints(
  rawPoints: GeoPoint[],
  config: Partial<ClusteringConfig> = {}
): StayPoint[] {
  if (rawPoints.length < 2) {
    return [];
  }

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const sortedPoints = [...rawPoints].sort((a, b) => a.timestamp - b.timestamp);

  const stayPoints: StayPoint[] = [];
  let clusterStart = 0;

  for (let i = 1; i < sortedPoints.length; i++) {
    const prevPoint = sortedPoints[i - 1]!;
    const currPoint = sortedPoints[i]!;
    const distance = haversineDistance(
      prevPoint.latitude, prevPoint.longitude,
      currPoint.latitude, currPoint.longitude
    );
    const timeGap = currPoint.timestamp - prevPoint.timestamp;

    if (distance > cfg.distanceThreshold || timeGap > cfg.timeThreshold) {
      if (i - clusterStart > 1) {
        const clusterPoints = sortedPoints.slice(clusterStart, i);
        const firstPoint = clusterPoints[0]!;
        const lastPoint = clusterPoints[clusterPoints.length - 1]!;
        const centroid = calculateCentroid(clusterPoints);
        const duration = lastPoint.timestamp - firstPoint.timestamp;

        if (duration >= cfg.minStayDuration) {
          stayPoints.push({
            startTime: firstPoint.timestamp,
            endTime: lastPoint.timestamp,
            latitude: centroid.latitude,
            longitude: centroid.longitude,
            pointCount: clusterPoints.length,
          });
        }
      }
      clusterStart = i;
    }
  }

  if (sortedPoints.length - clusterStart > 1) {
    const clusterPoints = sortedPoints.slice(clusterStart);
    const firstPoint = clusterPoints[0]!;
    const lastPoint = clusterPoints[clusterPoints.length - 1]!;
    const centroid = calculateCentroid(clusterPoints);
    const duration = lastPoint.timestamp - firstPoint.timestamp;

    if (duration >= cfg.minStayDuration) {
      stayPoints.push({
        startTime: firstPoint.timestamp,
        endTime: lastPoint.timestamp,
        latitude: centroid.latitude,
        longitude: centroid.longitude,
        pointCount: clusterPoints.length,
      });
    }
  }

  return stayPoints;
}

export function matchStayPointsWithItinerary(
  stayPoints: StayPoint[],
  plannedLocations: Array<{ name: string; latitude?: number; longitude?: number }>
): Array<StayPoint & { matchedLocation?: string; matchConfidence: number }> {
  return stayPoints.map(stayPoint => {
    let bestMatch: string | undefined;
    let bestDistance = Infinity;

    for (const location of plannedLocations) {
      if (location.latitude && location.longitude) {
        const distance = haversineDistance(
          stayPoint.latitude, stayPoint.longitude,
          location.latitude, location.longitude
        );

        if (distance < bestDistance && distance < 1000) {
          bestDistance = distance;
          bestMatch = location.name;
        }
      }
    }

    return {
      ...stayPoint,
      matchedLocation: bestMatch,
      matchConfidence: bestMatch ? 1 - (bestDistance / 1000) : 0,
    };
  });
}

export function extractDestinationFromPhotos(
  photoLocations: Array<{ latitude: number; longitude: number; timestamp?: number }>
): { latitude: number; longitude: number; confidence: number } | null {
  if (photoLocations.length === 0) {
    return null;
  }

  const centroid = calculateCentroid(
    photoLocations.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude,
      timestamp: p.timestamp || Date.now(),
    }))
  );

  const avgDistance = photoLocations.reduce((sum, p) => {
    return sum + haversineDistance(centroid.latitude, centroid.longitude, p.latitude, p.longitude);
  }, 0) / photoLocations.length;

  return {
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    confidence: Math.max(0, 1 - (avgDistance / 10000)),
  };
}
