import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { RunSegment, RelativePoint } from './stride-logic';

export interface StrideRun {
    id: string; // UUID
    startTime: number;
    endTime?: number;
    status: 'active' | 'completed';
    totalDistance: number;
    totalSteps: number;
    origin?: { lat: number; lon: number };
}

interface StrideDB extends DBSchema {
    runs: {
        key: string;
        value: StrideRun;
        indexes: { 'by-status': string };
    };
    segments: {
        key: [string, number]; // [runId, seq]
        value: RunSegment & { runId: string };
        indexes: { 'by-run': string };
    };
    points: {
        key: [string, number]; // [runId, timestamp]
        value: RelativePoint & { runId: string };
        indexes: { 'by-run': string };
    };
}

const DB_NAME = 'stride-db';
const DB_VERSION = 1;

export class StrideRepository {
    private dbPromise: Promise<IDBPDatabase<StrideDB>>;

    constructor() {
        this.dbPromise = openDB<StrideDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Runs store
                const runStore = db.createObjectStore('runs', { keyPath: 'id' });
                runStore.createIndex('by-status', 'status');

                // Segments store
                const segStore = db.createObjectStore('segments', { keyPath: ['runId', 'seq'] });
                segStore.createIndex('by-run', 'runId');

                // Points store
                const pointStore = db.createObjectStore('points', { keyPath: ['runId', 't'] });
                pointStore.createIndex('by-run', 'runId');
            },
        });
    }

    async startRun(): Promise<string> {
        const db = await this.dbPromise;
        const runId = crypto.randomUUID();
        const run: StrideRun = {
            id: runId,
            startTime: Date.now(),
            status: 'active',
            totalDistance: 0,
            totalSteps: 0,
        };
        await db.put('runs', run);
        return runId;
    }

    async getActiveRun(): Promise<StrideRun | undefined> {
        const db = await this.dbPromise;
        const activeRuns = await db.getAllFromIndex('runs', 'by-status', 'active');
        // Return the most recent active run if multiple exist (shouldn't happen ideally)
        return activeRuns.sort((a, b) => b.startTime - a.startTime)[0];
    }

    async completeRun(runId: string, totalDistance: number, totalSteps: number) {
        const db = await this.dbPromise;
        const run = await db.get('runs', runId);
        if (run) {
            run.status = 'completed';
            run.endTime = Date.now();
            run.totalDistance = totalDistance;
            run.totalSteps = totalSteps;
            await db.put('runs', run);
        }
    }

    async updateRunStats(runId: string, stats: { distance: number; steps: number }) {
        const db = await this.dbPromise;
        const run = await db.get('runs', runId);
        if (run) {
            run.totalDistance = stats.distance;
            run.totalSteps = stats.steps;
            await db.put('runs', run);
        }
    }

    async setRunOrigin(runId: string, origin: { lat: number; lon: number }) {
        const db = await this.dbPromise;
        const run = await db.get('runs', runId);
        if (run) {
            run.origin = origin;
            await db.put('runs', run);
        }
    }

    async addPoint(runId: string, point: RelativePoint) {
        const db = await this.dbPromise;
        await db.put('points', { ...point, runId });
    }

    async addSegment(runId: string, segment: RunSegment) {
        const db = await this.dbPromise;
        await db.put('segments', { ...segment, runId });
    }

    async getRunPoints(runId: string): Promise<RelativePoint[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex('points', 'by-run', runId);
    }

    async getRunSegments(runId: string): Promise<RunSegment[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex('segments', 'by-run', runId);
    }
}
