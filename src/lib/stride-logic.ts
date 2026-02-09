/**
 * SuiStride Core Logic - Frontend Implementation
 * 
 * This file implements the "Good Taste" engineering principles:
 * 1. Kalman Filtering for GPS smoothing.
 * 2. Relative Positioning for privacy.
 * 3. Anti-Cheat metrics and Merkle-ready segmentation.
 */

// --- Kalman Filter ---
export class KalmanFilter {
  private Q: number; // Process Noise
  private R: number; // Measurement Noise
  private x: number = 0; // State
  private p: number = 1; // Error Covariance
  private initialized: boolean = false;

  constructor(Q: number = 0.00001, R: number = 0.001) {
    this.Q = Q;
    this.R = R;
  }

  update(measurement: number): number {
    if (!this.initialized) {
      this.x = measurement;
      this.initialized = true;
      return this.x;
    }

    const p_pred = this.p + this.Q;
    const K = p_pred / (p_pred + this.R);
    this.x = this.x + K * (measurement - this.x);
    this.p = (1 - K) * p_pred;
    return this.x;
  }
}

// --- Relative Positioning ---
export interface RelativePoint {
  x: number; // East (meters)
  y: number; // North (meters)
  t: number; // Timestamp (ms)
  v: number; // Speed (m/s)
}

export class StrideTracker {
  private origin: { lat: number; lon: number } | null = null;
  private latFilter = new KalmanFilter();
  private lonFilter = new KalmanFilter();
  private lastPoint: RelativePoint | null = null;

  // Constants for Earth projection
  private static readonly LAT_METERS = 110574;
  private static readonly LON_METERS_BASE = 111320;

  process(lat: number, lon: number, timestamp: number): RelativePoint {
    const fLat = this.latFilter.update(lat);
    const fLon = this.lonFilter.update(lon);

    if (!this.origin) {
      this.origin = { lat: fLat, lon: fLon };
      const point = { x: 0, y: 0, t: timestamp, v: 0 };
      this.lastPoint = point;
      return point;
    }

    const dLat = fLat - this.origin.lat;
    const dLon = fLon - this.origin.lon;

    const y = dLat * StrideTracker.LAT_METERS;
    const x = dLon * StrideTracker.LON_METERS_BASE * Math.cos((this.origin.lat * Math.PI) / 180);

    // We have origin, so we MUST have lastPoint. No stupid checks.
    const last = this.lastPoint!;
    const dx = x - last.x;
    const dy = y - last.y;
    const dt = (timestamp - last.t) / 1000;

    // Avoid division by zero closely
    const v = dt > 0.001 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;

    const point = { x, y, t: timestamp, v };
    this.lastPoint = point;
    return point;
  }

  getOrigin() {
    return this.origin;
  }

  restoreState(origin: { lat: number; lon: number }, lastPoint: RelativePoint) {
    this.origin = origin;
    this.lastPoint = lastPoint;
    // We might want to re-init filters too, but for now assuming they converge fast enough or start fresh is ok.
    // Ideally we persist filter state (P, x etc) but that's overkill.
    this.latFilter = new KalmanFilter(0.00001, 0.001); // Reset filters to avoid huge jumps if time gap is large
    this.lonFilter = new KalmanFilter(0.00001, 0.001);

    // Seed filters with current position?
    // We don't have lat/lon of lastPoint easily unless we back-calculate.
    // Just letting them init on next point is fine.
  }
}

// --- Anti-Cheat & Segmentation ---
export interface RunSegment {
  seq: number;
  start_xy: [number, number];
  end_xy: [number, number];
  avg_speed: number;
  max_speed: number;
  acc_variance: number;
  steps: number;
  session_nonce: string;
}

export class StrideSegmenter {
  private segments: RunSegment[] = [];
  private currentBuffer: RelativePoint[] = [];

  // Aggregators for the current segment
  private stepAccumulator: number = 0;
  private accVarAccumulator: number[] = [];

  private segmentDurationMs: number = 60000; // 1 minute
  private startTime: number = 0;
  private nonce: string;

  constructor(nonce: string) {
    this.nonce = nonce;
  }

  addPoint(point: RelativePoint, stepsInInterval: number, accVar: number) {
    if (this.currentBuffer.length === 0) {
      this.startTime = point.t;
    }

    this.currentBuffer.push(point);
    this.stepAccumulator += stepsInInterval;
    this.accVarAccumulator.push(accVar);

    if (point.t - this.startTime >= this.segmentDurationMs) {
      // Create segment immediately, then reset
      this.finalizeSegment();
    }
  }

  private finalizeSegment() {
    if (this.currentBuffer.length < 2) {
      // Not enough data for a segment, reset accumulators
      this.resetCurrentState();
      return;
    }

    const start = this.currentBuffer[0];
    const end = this.currentBuffer[this.currentBuffer.length - 1];

    const speeds = this.currentBuffer.map(p => p.v);
    const avg_speed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const max_speed = speeds.length > 0 ? Math.max(...speeds) : 0;

    const validAccVars = this.accVarAccumulator.filter(v => !isNaN(v));
    const avg_acc_var = validAccVars.length > 0
      ? validAccVars.reduce((a, b) => a + b, 0) / validAccVars.length
      : 0;

    const segment: RunSegment = {
      seq: this.segments.length + 1,
      start_xy: [start.x, start.y],
      end_xy: [end.x, end.y],
      avg_speed,
      max_speed,
      acc_variance: avg_acc_var,
      steps: this.stepAccumulator,
      session_nonce: this.nonce
    };

    this.segments.push(segment);
    this.resetCurrentState();
  }

  private resetCurrentState() {
    this.currentBuffer = [];
    this.stepAccumulator = 0;
    this.accVarAccumulator = [];
    this.startTime = 0; // Will be set on next addPoint
  }

  getSegments() {
    return this.segments;
  }
}

// --- Hashing & Merkle ---

/**
 * Serializes a segment deterministically into a binary buffer.
 * Layout (Big Endian):
 * [seq (8)][startX (8)][startY (8)][endX (8)][endY (8)]
 * [avgSpeed (8)][maxSpeed (8)][accVar (8)][steps (8)]
 * [nonceLength (4)][nonceBytes...]
 */
function serializeSegment(s: RunSegment): Uint8Array {
  const nonceBytes = new TextEncoder().encode(s.session_nonce);
  // 8 bytes * 9 numbers + 4 bytes length + nonce bytes
  const bufferSize = 72 + 4 + nonceBytes.length;
  const buf = new ArrayBuffer(bufferSize);
  const view = new DataView(buf);
  let offset = 0;

  // Usage: view.setFloat64(byteOffset, value, littleEndian?) -> Default BigEndian
  // usage: view.setBigUint64(byteOffset, value, littleEndian?)

  view.setBigUint64(offset, BigInt(s.seq)); offset += 8;

  view.setFloat64(offset, s.start_xy[0]); offset += 8;
  view.setFloat64(offset, s.start_xy[1]); offset += 8;

  view.setFloat64(offset, s.end_xy[0]); offset += 8;
  view.setFloat64(offset, s.end_xy[1]); offset += 8;

  view.setFloat64(offset, s.avg_speed); offset += 8;
  view.setFloat64(offset, s.max_speed); offset += 8;
  view.setFloat64(offset, s.acc_variance); offset += 8;

  view.setBigUint64(offset, BigInt(Math.floor(s.steps))); offset += 8;

  // Nonce
  view.setUint32(offset, nonceBytes.length); offset += 4;
  new Uint8Array(buf).set(nonceBytes, offset);

  return new Uint8Array(buf);
}

export async function computeMerkleRoot(segments: RunSegment[]): Promise<string> {
  if (segments.length === 0) return "0x0";

  // 1. Hash leaves
  const leafHashes: Uint8Array[] = [];
  for (const s of segments) {
    const data = serializeSegment(s);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
    leafHashes.push(new Uint8Array(hashBuffer));
  }

  let currentLevel = leafHashes;

  // 2. Build tree
  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Concatenate left + right
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const combined = new Uint8Array(left.length + right.length);
        combined.set(left);
        combined.set(right, left.length);

        const hashBuffer = await crypto.subtle.digest('SHA-256', combined as any);
        nextLevel.push(new Uint8Array(hashBuffer));
      } else {
        // Promote single node (odd number of nodes)
        nextLevel.push(currentLevel[i]);
      }
    }
    currentLevel = nextLevel;
  }

  // 3. Convert root to Hex string for Move
  // "0x" + hex string
  return "0x" + Array.from(currentLevel[0])
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
