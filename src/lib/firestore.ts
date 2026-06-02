/**
 * Firestore Database Layer
 * Replaces Prisma with Firebase Firestore for all data operations.
 * Collections:
 *   users/{userId}
 *   workspaces/{workspaceId}
 *   workspaces/{workspaceId}/members/{userId}
 *   workspaces/{workspaceId}/channels/{channelId}
 *   workspaces/{workspaceId}/channels/{channelId}/messages/{messageId}
 *   workspaces/{workspaceId}/documents/{docId}
 *   workspaces/{workspaceId}/spreadsheets/{sheetId}
 *   workspaces/{workspaceId}/presentations/{presId}
 *   workspaces/{workspaceId}/tasks/{taskId}
 *   users/{userId}/notifications/{notificationId}
 *   invitations/{invitationId}
 */

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy as fbOrderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  type Firestore,
  type DocumentData,
  type WhereFilterOp,
  type OrderByDirection,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { getFirestoreApp } from './firebase';

// ---- Types for Firestore operations ----

type WhereClause = {
  field: string;
  op: WhereFilterOp;
  value: unknown;
};

type OrderByClause = {
  field: string;
  direction?: OrderByDirection;
};

type FirestoreFindManyParams = {
  where?: Record<string, unknown> | WhereClause[];
  orderBy?: OrderByClause | OrderByClause[];
  skip?: number;
  take?: number;
  startAfterValue?: unknown;
};

type FirestoreFindUniqueParams = {
  where: Record<string, unknown>;
};

// ---- Firestore ID Generation ----

let dbInstance: Firestore | null = null;

function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestoreApp();
  }
  return dbInstance;
}

// Generate a simple ID (like cuid)
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 10);
  return `fs_${timestamp}_${randomPart}${randomPart2}`;
}

// Timestamp helpers
export function now(): ReturnType<typeof serverTimestamp> {
  return serverTimestamp();
}

export function timestampToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  return null;
}

/** Deeply convert Firestore Timestamps to ISO strings in a plain object */
function serializeTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = serializeTimestamps(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map(v =>
        v instanceof Timestamp
          ? v.toDate().toISOString()
          : (v !== null && typeof v === 'object' ? serializeTimestamps(v as Record<string, unknown>) : v)
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---- Firestore Model Factory ----

class FirestoreModel<T extends Record<string, unknown>> {
  private collectionPath: string;
  private idField: string = 'id';

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
  }

  /** Resolve a document reference by a unique field value */
  private async findDocByField(field: string, value: unknown): Promise<{ doc: DocumentSnapshot; id: string } | null> {
    const db = getDb();
    const colRef = collection(db, this.collectionPath);
    const q = query(colRef, where(field, '==', value), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { doc: docSnap, id: docSnap.id };
  }

  /** Convert Firestore doc to plain object with id and serialized timestamps */
  private docToData(docSnap: DocumentSnapshot): T | null {
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    const raw = { id: docSnap.id, ...data } as Record<string, unknown>;
    return serializeTimestamps(raw) as unknown as T;
  }

  /** Apply select filter to pick only specified fields from a result */
  private applySelect(data: T | null, select: Record<string, unknown> | undefined): T | null {
    if (!data || !select) return data;
    const record = data as Record<string, unknown>;
    const selected: Record<string, unknown> = {};
    // If select is { id: true, name: true, ... } keep truthy keys
    for (const [key, val] of Object.entries(select)) {
      if (val && key in record) {
        selected[key] = record[key];
      }
    }
    // Always include id
    if (!selected.id && record.id) selected.id = record.id;
    return selected as unknown as T;
  }

  /** Apply include to fetch related sub-documents */
  private async applyInclude(
    data: T | null,
    include: Record<string, unknown> | undefined
  ): Promise<T | null> {
    if (!data || !include) return data;
    const record = data as Record<string, unknown>;
    for (const [relation, config] of Object.entries(include)) {
      const cfg = config as Record<string, unknown>;
      if (relation === 'members' && this.collectionPath === 'workspaces') {
        // Fetch members for a workspace
        const db = getDb();
        const colRef = collection(db, `workspaces/${record.id}/members`);
        const constraints: any[] = [];
        if (cfg.where) {
          for (const [k, v] of Object.entries(cfg.where as Record<string, unknown>)) {
            if (typeof v === 'object' && v !== null && 'some' in v) {
              // Handle { some: { userId } }
              const some = v as Record<string, unknown>;
              for (const [sk, sv] of Object.entries(some)) {
                constraints.push(where(sk, '==', sv));
              }
            } else {
              constraints.push(where(k, '==', v));
            }
          }
        }
        if (cfg.orderBy) {
          const orders = Array.isArray(cfg.orderBy) ? cfg.orderBy : [cfg.orderBy];
          for (const o of orders) {
            if (o.field !== undefined) {
              constraints.push(fbOrderBy(o.field, o.direction || 'asc'));
            } else {
              const key = Object.keys(o)[0];
              const dir = o[key];
              constraints.push(fbOrderBy(key, dir === 'desc' ? 'desc' : 'asc'));
            }
          }
        }
        const q = query(colRef, ...constraints);
        const snap = await getDocs(q);
        const items: Record<string, unknown>[] = [];
        for (const d of snap.docs) {
          const itemData = serializeTimestamps({ id: d.id, ...d.data() }) as Record<string, unknown>;
          // Handle nested include for user
          if (cfg.select) {
            const sel = cfg.select as Record<string, unknown>;
            // If there's a nested include for 'user'
            if (sel.user) {
              const userCfg = sel.user as Record<string, unknown>;
              if (userCfg.select && itemData.userId) {
                const userDoc = await getDoc(doc(db, `users/${itemData.userId}`));
                if (userDoc.exists()) {
                  const userRecord = { id: userDoc.id, ...userDoc.data() } as Record<string, unknown>;
                  const userSelect = userCfg.select as Record<string, unknown>;
                  const filteredUser: Record<string, unknown> = {};
                  for (const [uk, uv] of Object.entries(userSelect)) {
                    if (uv && uk in userRecord) filteredUser[uk] = userRecord[uk];
                  }
                  filteredUser.id = userDoc.id;
                  itemData.user = filteredUser;
                }
              }
            }
            // Filter member fields
            const filteredItem: Record<string, unknown> = {};
            for (const [sk, sv] of Object.entries(sel)) {
              if (sv && sk !== 'user' && sk in itemData) filteredItem[sk] = itemData[sk];
            }
            filteredItem.id = itemData.id as string;
            if (itemData.user) filteredItem.user = itemData.user;
            items.push(filteredItem);
          } else {
            items.push(itemData);
          }
        }
        record[relation] = items;
      } else if (relation === 'channels' && this.collectionPath === 'workspaces') {
        const db = getDb();
        const colRef = collection(db, `workspaces/${record.id}/channels`);
        const constraints: any[] = [];
        if (cfg.orderBy) {
          const orders = Array.isArray(cfg.orderBy) ? cfg.orderBy : [cfg.orderBy];
          for (const o of orders) {
            if (o.field !== undefined) {
              constraints.push(fbOrderBy(o.field, o.direction || 'asc'));
            } else {
              const key = Object.keys(o)[0];
              const dir = o[key];
              constraints.push(fbOrderBy(key, dir === 'desc' ? 'desc' : 'asc'));
            }
          }
        }
        const q = query(colRef, ...constraints);
        const snap = await getDocs(q);
        const items = snap.docs.map(d => serializeTimestamps({ id: d.id, ...d.data() }));
        record[relation] = items;
      } else if (relation === 'user' && record.userId) {
        const db = getDb();
        const userDoc = await getDoc(doc(db, `users/${record.userId}`));
        if (userDoc.exists()) {
          const userData = serializeTimestamps({ id: userDoc.id, ...userDoc.data() }) as Record<string, unknown>;
          if (cfg.select) {
            const sel = cfg.select as Record<string, unknown>;
            const filtered: Record<string, unknown> = {};
            for (const [uk, uv] of Object.entries(sel)) {
              if (uv && uk in userData) filtered[uk] = userData[uk];
            }
            filtered.id = userDoc.id;
            record[relation] = filtered;
          } else {
            record[relation] = userData;
          }
        } else {
          record[relation] = null;
        }
      } else if (relation === 'creator' && record.createdBy) {
        const db = getDb();
        const userDoc = await getDoc(doc(db, `users/${record.createdBy}`));
        if (userDoc.exists()) {
          const userData = serializeTimestamps({ id: userDoc.id, ...userDoc.data() }) as Record<string, unknown>;
          if (cfg.select) {
            const sel = cfg.select as Record<string, unknown>;
            const filtered: Record<string, unknown> = {};
            for (const [uk, uv] of Object.entries(sel)) {
              if (uv && uk in userData) filtered[uk] = userData[uk];
            }
            filtered.id = userDoc.id;
            record[relation] = filtered;
          } else {
            record[relation] = userData;
          }
        } else {
          record[relation] = null;
        }
      } else if (relation === '_count') {
        // Compute counts from subcollections
        const countCfg = cfg.select as Record<string, unknown> || {};
        const counts: Record<string, unknown> = {};
        const db = getDb();
        for (const [colName, shouldCount] of Object.entries(countCfg)) {
          if (shouldCount) {
            try {
              const colRef = collection(db, `${this.collectionPath}/${record.id}/${colName}`);
              const snap = await getDocs(colRef);
              counts[colName] = snap.size;
            } catch {
              counts[colName] = 0;
            }
          }
        }
        record[relation] = counts;
      }
    }
    return data;
  }

  /** Find unique by id or other field */
  async findUnique(params: FirestoreFindUniqueParams & { select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T | null> {
    const { where: whereClause, select, include: includeClause } = params;
    const entries = Object.entries(whereClause);
    if (entries.length === 0) return null;

    const [field, value] = entries[0];
    let result: T | null = null;

    // If querying by id field directly, use doc reference
    if (field === this.idField && typeof value === 'string') {
      const db = getDb();
      const docRef = doc(db, this.collectionPath, value);
      const docSnap = await getDoc(docRef);
      result = this.docToData(docSnap);
    } else {
      // Otherwise query by the field
      const found = await this.findDocByField(field, value);
      if (found) result = this.docToData(found.doc);
    }

    if (!result) return null;

    // Apply select filter
    result = this.applySelect(result, select);

    // Apply include for relations
    result = await this.applyInclude(result, includeClause);

    return result;
  }

  /** Find first matching document */
  async findFirst(params: FirestoreFindManyParams & FirestoreFindUniqueParams & { select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T | null> {
    if (params.where) {
      const entries = Object.entries(params.where);
      if (entries.length === 1) {
        const result = await this.findUnique({ where: params.where as Record<string, unknown>, select: params.select, include: params.include });
        if (result) return result;
      }
    }

    const db = getDb();
    const colRef = collection(db, this.collectionPath);

    const constraints: any[] = [];
    if (params.where) {
      const entries = Object.entries(params.where);
      for (const [field, value] of entries) {
        if (value !== undefined) constraints.push(where(field, '==', value));
      }
    }
    if (params.orderBy) {
      const orders = Array.isArray(params.orderBy) ? params.orderBy : [params.orderBy];
      for (const o of orders) {
        if (o.field !== undefined) {
          constraints.push(fbOrderBy(o.field, o.direction || 'asc'));
        } else {
          const key = Object.keys(o)[0];
          const dir = o[key];
          constraints.push(fbOrderBy(key, dir === 'desc' ? 'desc' : 'asc'));
        }
      }
    }
    constraints.push(limit(1));

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    let result = this.docToData(snapshot.docs[0]);
    result = this.applySelect(result, params.select);
    result = await this.applyInclude(result, params.include);
    return result;
  }

  /** Find many documents */
  async findMany(params: FirestoreFindManyParams & { select?: Record<string, unknown>; include?: Record<string, unknown>; _count?: Record<string, unknown> } = {}): Promise<T[]> {
    const db = getDb();
    const colRef = collection(db, this.collectionPath);

    const constraints: any[] = [];

    if (params.where) {
      if (Array.isArray(params.where)) {
        for (const clause of params.where) {
          constraints.push(where(clause.field, clause.op, clause.value));
        }
      } else {
        const entries = Object.entries(params.where);
        for (const [field, value] of entries) {
          if (value !== undefined) {
            // Handle Prisma-style relation filters like { members: { some: { userId } } }
            if (typeof value === 'object' && value !== null && !(value instanceof Timestamp)) {
              // Skip relation filters - they'll be handled by the route logic
              continue;
            }
            constraints.push(where(field, '==', value));
          }
        }
      }
    }

    if (params.orderBy) {
      const orders = Array.isArray(params.orderBy) ? params.orderBy : [params.orderBy];
      for (const o of orders) {
        if (o.field !== undefined) {
          constraints.push(fbOrderBy(o.field, o.direction || 'asc'));
        } else {
          // Prisma-style: { createdAt: 'desc' }
          const key = Object.keys(o)[0];
          const dir = o[key];
          constraints.push(fbOrderBy(key, dir === 'desc' ? 'desc' : 'asc'));
        }
      }
    }

    if (params.take) {
      constraints.push(limit(params.take));
    }

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);

    const results: T[] = [];
    for (const docSnap of snapshot.docs) {
      let data = this.docToData(docSnap);
      if (data) {
        data = this.applySelect(data, params.select);
        data = await this.applyInclude(data, params.include);
        if (data) results.push(data);
      }
    }

    return results;
  }

  /** Create a new document */
  async create(params: { data: Record<string, unknown>; select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T> {
    const db = getDb();
    const id = (params.data.id as string) || generateId();
    const docRef = doc(db, this.collectionPath, id);

    const data = {
      ...params.data,
      id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Handle nested creates (e.g., members: { create: {...} }, channels: { create: {...} })
    const nestedCreates: Record<string, { create: Record<string, unknown> } | Record<string, unknown>[]> = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'object' && val !== null && 'create' in (val as any)) {
        nestedCreates[key] = val as any;
        delete (data as any)[key];
      } else if (Array.isArray(val)) {
        const hasCreates = val.some(v => typeof v === 'object' && v !== null && 'create' in v);
        if (hasCreates) {
          nestedCreates[key] = val as any;
          delete (data as any)[key];
        }
      }
    }

    await setDoc(docRef, data);

    // Process nested creates
    for (const [relation, createDef] of Object.entries(nestedCreates)) {
      if (Array.isArray(createDef)) {
        for (const item of createDef) {
          if (item.create) {
            await this.handleNestedCreate(id, relation, item.create as Record<string, unknown>);
          }
        }
      } else if (createDef.create) {
        await this.handleNestedCreate(id, relation, createDef.create as Record<string, unknown>);
      }
    }

    let result = { ...data } as unknown as T;
    result = this.applySelect(result, params.select);
    result = await this.applyInclude(result, params.include);
    return result;
  }

  /** Handle nested create for relations */
  private async handleNestedCreate(parentId: string, relation: string, childData: Record<string, unknown>): Promise<void> {
    const db = getDb();
    const subColPath = `${this.collectionPath}/${parentId}/${relation}`;
    const childId = (childData.id as string) || generateId();
    const childRef = doc(db, subColPath, childId);
    await setDoc(childRef, {
      ...childData,
      id: childId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /** Update a document */
  async update(params: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T> {
    const { where: whereClause, data: updateData, select, include: includeClause } = params;

    let docId: string | null = null;

    if (whereClause[this.idField]) {
      docId = whereClause[this.idField] as string;
    } else {
      const entries = Object.entries(whereClause);
      if (entries.length > 0) {
        const result = await this.findDocByField(entries[0][0], entries[0][1]);
        if (result) docId = result.id;
      }
    }

    if (!docId) {
      throw new Error(`Document not found for where: ${JSON.stringify(whereClause)}`);
    }

    const db = getDb();
    const docRef = doc(db, this.collectionPath, docId);

    const finalData = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, finalData);

    const updated = await getDoc(docRef);
    let result = this.docToData(updated) as T;
    result = this.applySelect(result, select);
    result = await this.applyInclude(result, includeClause);
    return result;
  }

  /** Delete a document */
  async delete(params: { where: Record<string, unknown> }): Promise<T | null> {
    const { where: whereClause } = params;

    let docId: string | null = null;

    if (whereClause[this.idField]) {
      docId = whereClause[this.idField] as string;
    } else {
      const entries = Object.entries(whereClause);
      if (entries.length > 0) {
        const result = await this.findDocByField(entries[0][0], entries[0][1]);
        if (result) docId = result.id;
      }
    }

    if (!docId) return null;

    const db = getDb();
    const docRef = doc(db, this.collectionPath, docId);
    const existing = await getDoc(docRef);
    const data = this.docToData(existing);

    await deleteDoc(docRef);
    return data;
  }

  /** Count documents */
  async count(params: { where?: Record<string, unknown> } = {}): Promise<number> {
    const results = await this.findMany(params);
    return results.length;
  }

  /** Update many documents (Firestore doesn't support batch update by query, so we do it individually) */
  async updateMany(params: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<number> {
    const results = await this.findMany({ where: params.where });
    const db = getDb();

    let count = 0;
    for (const item of results) {
      const itemId = (item as unknown as Record<string, unknown>)[this.idField] as string;
      if (itemId) {
        const docRef = doc(db, this.collectionPath, itemId);
        await updateDoc(docRef, {
          ...params.data,
          updatedAt: Timestamp.now(),
        });
        count++;
      }
    }
    return count;
  }

  /** Delete many documents */
  async deleteMany(params: { where: Record<string, unknown> }): Promise<number> {
    const results = await this.findMany({ where: params.where });
    const db = getDb();

    let count = 0;
    for (const item of results) {
      const itemId = (item as unknown as Record<string, unknown>)[this.idField] as string;
      if (itemId) {
        await deleteDoc(doc(db, this.collectionPath, itemId));
        count++;
      }
    }
    return count;
  }
}

// ---- Subcollection Model Factory ----

class FirestoreSubModel<T extends Record<string, unknown>> {
  private parentCollection: string;
  private parentIdField: string;
  private subCollection: string;
  private idField: string = 'id';

  constructor(parentCollection: string, parentIdField: string, subCollection: string) {
    this.parentCollection = parentCollection;
    this.parentIdField = parentIdField;
    this.subCollection = subCollection;
  }

  private getSubPath(parentId: string): string {
    return `${this.parentCollection}/${parentId}/${this.subCollection}`;
  }

  private docToData(docSnap: DocumentSnapshot): T | null {
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    const raw = { id: docSnap.id, ...data } as Record<string, unknown>;
    return serializeTimestamps(raw) as unknown as T;
  }

  /** Apply select filter to pick only specified fields from a result */
  private applySelect(data: T | null, select: Record<string, unknown> | undefined): T | null {
    if (!data || !select) return data;
    const record = data as Record<string, unknown>;
    const selected: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(select)) {
      if (val && key in record) {
        selected[key] = record[key];
      }
    }
    if (!selected.id && record.id) selected.id = record.id;
    return selected as unknown as T;
  }

  /** Apply include to fetch related documents (shared with FirestoreModel) */
  private async applyIncludeRemote(
    data: T | null,
    include: Record<string, unknown> | undefined
  ): Promise<T | null> {
    if (!data || !include) return data;
    const record = data as Record<string, unknown>;

    for (const [relation, config] of Object.entries(include)) {
      const cfg = config as Record<string, unknown>;

      // Handle user relation on subcollection documents (e.g., member.user)
      if (relation === 'user' && record.userId) {
        const db = getDb();
        const userDoc = await getDoc(doc(db, `users/${record.userId}`));
        if (userDoc.exists()) {
          const userData = serializeTimestamps({ id: userDoc.id, ...userDoc.data() }) as Record<string, unknown>;
          if (cfg.select) {
            const sel = cfg.select as Record<string, unknown>;
            const filtered: Record<string, unknown> = {};
            for (const [uk, uv] of Object.entries(sel)) {
              if (uv && uk in userData) filtered[uk] = userData[uk];
            }
            filtered.id = userDoc.id;
            record[relation] = filtered;
          } else {
            record[relation] = userData;
          }
        } else {
          record[relation] = null;
        }
      }

      // Handle workspace relation
      if (relation === 'workspace' && record.workspaceId) {
        const db = getDb();
        const wsDoc = await getDoc(doc(db, `workspaces/${record.workspaceId}`));
        if (wsDoc.exists()) {
          record[relation] = serializeTimestamps({ id: wsDoc.id, ...wsDoc.data() });
        }
      }
    }
    return data;
  }

  async findUnique(params: { where: Record<string, unknown>; select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T | null> {
    const entries = Object.entries(params.where);
    if (entries.length === 0) return null;
    const [field, value] = entries[0];

    const db = getDb();

    // Handle Prisma-style compound keys like workspaceId_userId
    // The compound key format is: field1_field2 with value { field1, field2 }
    // For members: workspaceId_userId => { workspaceId, userId }
    // In Firestore, members path is workspaces/{workspaceId}/members/{userId}
    if (field.endsWith('_userId') || field.endsWith('_id')) {
      const compoundVal = value as Record<string, unknown>;
      const parentId = compoundVal.workspaceId as string;
      const childId = compoundVal.userId as string;
      if (parentId && childId) {
        const docRef = doc(db, this.getSubPath(parentId), childId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        let result = this.docToData(docSnap);
        result = this.applySelect(result, params.select);
        result = await this.applyIncludeRemote(result, params.include);
        return result;
      }
    }

    if (field === this.idField && typeof value === 'string') {
      return null; // Need parentId for subcollection doc ref
    }

    const parentId = (params.where as any).parentId || (params.where as any).workspaceId;
    if (parentId) {
      const subColRef = collection(db, this.getSubPath(parentId));
      const q = query(subColRef, where(field, '==', value), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      let result = this.docToData(snapshot.docs[0]);
      result = this.applySelect(result, params.select);
      result = await this.applyIncludeRemote(result, params.include);
      return result;
    }

    return null;
  }

  async findMany(params: FirestoreFindManyParams & { parentId?: string; select?: Record<string, unknown>; include?: Record<string, unknown> } = {}): Promise<T[]> {
    const db = getDb();
    const parentId = params.parentId || (params.where as any)?.workspaceId || (params.where as any)?.userId;

    if (!parentId) {
      console.warn(`FirestoreSubModel.findMany: no parentId provided for ${this.parentCollection}/${this.subCollection}`);
      return [];
    }

    const colRef = collection(db, this.getSubPath(parentId));
    const constraints: any[] = [];

    if (params.where) {
      if (Array.isArray(params.where)) {
        for (const clause of params.where) {
          if (clause.field !== 'workspaceId' && clause.field !== 'userId' && clause.field !== 'parentId') {
            constraints.push(where(clause.field, clause.op, clause.value));
          }
        }
      } else {
        const entries = Object.entries(params.where);
        for (const [field, value] of entries) {
          if (value !== undefined && field !== 'workspaceId' && field !== 'userId' && field !== 'parentId') {
            // Skip Prisma-style relation filters
            if (typeof value === 'object' && value !== null && !(value instanceof Timestamp)) continue;
            constraints.push(where(field, '==', value));
          }
        }
      }
    }

    if (params.orderBy) {
      const orders = Array.isArray(params.orderBy) ? params.orderBy : [params.orderBy];
      for (const o of orders) {
        if (o.field !== undefined) {
          constraints.push(fbOrderBy(o.field, o.direction || 'asc'));
        } else {
          const key = Object.keys(o)[0];
          const dir = o[key];
          constraints.push(fbOrderBy(key, dir === 'desc' ? 'desc' : 'asc'));
        }
      }
    }

    if (params.take) {
      constraints.push(limit(params.take));
    }

    let q: Query;
    try {
      q = query(colRef, ...constraints);
    } catch (queryErr) {
      console.error(`FirestoreSubModel.findMany: query construction failed for ${this.parentCollection}/${this.subCollection}`, queryErr);
      return [];
    }

    let snapshot: QuerySnapshot;
    try {
      snapshot = await getDocs(q);
    } catch (queryErr: any) {
      // If the query fails due to missing index or other Firestore errors,
      // fall back to fetching all docs and filtering/ordering in-memory
      console.warn(`FirestoreSubModel.findMany: query execution failed for ${this.parentCollection}/${this.subCollection}, falling back to in-memory`, queryErr?.message || queryErr);
      try {
        const allDocs = await getDocs(colRef);
        let results: T[] = [];
        for (const docSnap of allDocs.docs) {
          let data = this.docToData(docSnap);
          if (data) {
            // Apply any where filters in-memory
            if (params.where) {
              const entries = Object.entries(
                Array.isArray(params.where)
                  ? params.where.reduce((acc: Record<string, unknown>, c: WhereClause) => ({ ...acc, [c.field]: c.value }), {})
                  : params.where
              );
              let match = true;
              for (const [field, value] of entries) {
                if (field === 'workspaceId' || field === 'userId' || field === 'parentId') continue;
                if ((data as any)[field] !== value) { match = false; break; }
              }
              if (!match) continue;
            }
            results.push(data);
          }
        }
        // Apply orderBy in-memory
        if (params.orderBy) {
          const orders = Array.isArray(params.orderBy) ? params.orderBy : [params.orderBy];
          for (const o of orders) {
            const key = (o as any).field || Object.keys(o)[0];
            const dir = (o as any).direction || (o as any)[key] || 'asc';
            results.sort((a: any, b: any) => {
              const aVal = a[key];
              const bVal = b[key];
              if (aVal == null) return 1;
              if (bVal == null) return -1;
              return dir === 'desc' ? bVal.localeCompare?.(aVal) || String(bVal).localeCompare(String(aVal)) : aVal.localeCompare?.(bVal) || String(aVal).localeCompare(String(bVal));
            });
          }
        }
        // Apply take in-memory
        if (params.take && results.length > params.take) {
          results = results.slice(0, params.take);
        }
        // Apply select and include
        results = results.map((data: T) => {
          let d = this.applySelect(data, params.select);
          // We don't await applyIncludeRemote here to keep it sync
          return d;
        }).filter(Boolean) as T[];
        return results;
      } catch (fallbackErr) {
        console.error(`FirestoreSubModel.findMany: fallback also failed for ${this.parentCollection}/${this.subCollection}`, fallbackErr);
        return [];
      }
    }

    const results: T[] = [];
    for (const docSnap of snapshot.docs) {
      let data = this.docToData(docSnap);
      if (data) {
        data = this.applySelect(data, params.select);
        data = await this.applyIncludeRemote(data, params.include);
        if (data) results.push(data);
      }
    }

    return results;
  }

  async create(params: { data: Record<string, unknown>; select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T> {
    const db = getDb();
    const parentId = params.data.workspaceId as string || params.data.userId as string || '';
    if (!parentId) throw new Error(`Cannot create subcollection document without parentId`);

    const id = (params.data.id as string) || generateId();
    const docRef = doc(db, this.getSubPath(parentId), id);

    const data = {
      ...params.data,
      id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(docRef, data);
    let result = { ...data } as unknown as T;
    result = this.applySelect(result, params.select);
    result = await this.applyIncludeRemote(result, params.include);
    return result;
  }

  /** Extract parentId from where clause, including compound keys */
  private extractParentId(whereClause: Record<string, unknown>): string {
    // Direct workspaceId or userId
    let pid = (whereClause as any).workspaceId || (whereClause as any).userId || '';
    if (pid) return pid;

    // Compound key: workspaceId_userId = { workspaceId, userId }
    for (const [key, val] of Object.entries(whereClause)) {
      if (key.endsWith('_userId') || key.endsWith('_id')) {
        const compound = val as Record<string, unknown>;
        pid = compound.workspaceId as string || '';
        if (pid) return pid;
      }
    }

    return '';
  }

  async update(params: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T | null> {
    const { where: whereClause, data: updateData, select, include: includeClause } = params;
    const docId = whereClause[this.idField] as string;
    let foundId = docId;

    if (!foundId) {
      const found = await this.findUnique({ where: whereClause });
      if (!found) throw new Error(`Document not found`);
      foundId = (found as unknown as Record<string, unknown>)[this.idField] as string;
    }

    const parentId = this.extractParentId(whereClause);
    if (!parentId) throw new Error('Cannot update without parentId');

    const db = getDb();
    const docRef = doc(db, this.getSubPath(parentId), foundId);
    await updateDoc(docRef, { ...updateData, updatedAt: Timestamp.now() });

    const updated = await getDoc(docRef);
    let result = this.docToData(updated);
    result = this.applySelect(result, select);
    result = await this.applyIncludeRemote(result, includeClause);
    return result;
  }

  async delete(params: { where: Record<string, unknown> }): Promise<T | null> {
    const docId = params.where[this.idField] as string;
    let foundId = docId;
    if (!foundId) {
      const found = await this.findUnique({ where: params.where });
      if (!found) return null;
      foundId = (found as unknown as Record<string, unknown>)[this.idField] as string;
    }

    const parentId = this.extractParentId(params.where);
    if (!parentId) return null;

    const db = getDb();
    const docRef = doc(db, this.getSubPath(parentId), foundId);
    const existing = await getDoc(docRef);
    const data = this.docToData(existing);

    await deleteDoc(docRef);
    return data;
  }

  async count(params: { where?: Record<string, unknown>; parentId?: string } = {}): Promise<number> {
    const results = await this.findMany(params as any);
    return results.length;
  }

  async updateMany(params: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<number> {
    const results = await this.findMany({ where: params.where });
    const db = getDb();

    let count = 0;
    for (const item of results) {
      const itemRecord = item as unknown as Record<string, unknown>;
      const parentId = this.extractParentId(itemRecord) || (itemRecord.workspaceId as string) || (itemRecord.userId as string);
      const docId = itemRecord[this.idField] as string;
      if (parentId && docId) {
        const docRef = doc(db, this.getSubPath(parentId), docId);
        await updateDoc(docRef, { ...params.data, updatedAt: Timestamp.now() });
        count++;
      }
    }
    return count;
  }

  async deleteMany(params: { where: Record<string, unknown> }): Promise<number> {
    const results = await this.findMany({ where: params.where });
    const db = getDb();

    let count = 0;
    for (const item of results) {
      const itemRecord = item as unknown as Record<string, unknown>;
      const parentId = this.extractParentId(itemRecord) || (itemRecord.workspaceId as string) || (itemRecord.userId as string);
      const docId = itemRecord[this.idField] as string;
      if (parentId && docId) {
        await deleteDoc(doc(db, this.getSubPath(parentId), docId));
        count++;
      }
    }
    return count;
  }
}

// ---- Create Model Instances ----

export const userModel = new FirestoreModel<{
  id: string;
  email: string;
  name: string;
  passwordHash?: string | null;
  avatar?: string | null;
  photoURL?: string | null;
  authProvider: string;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('users');

export const workspaceModel = new FirestoreModel<{
  id: string;
  name: string;
  description: string;
  avatar?: string | null;
  inviteCode: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces');

export const workspaceMemberModel = new FirestoreSubModel<{
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  joinedAt: Timestamp;
}>('workspaces', 'workspaceId', 'members');

export const channelModel = new FirestoreSubModel<{
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  type: string;
  isPrivate: boolean;
  topic?: string | null;
  archived: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces', 'workspaceId', 'channels');

export const messageModel = new FirestoreSubModel<{
  id: string;
  channelId: string;
  workspaceId: string;
  userId: string;
  content: string;
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  parentId?: string | null;
  replyCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces', 'workspaceId', 'channels');

// Messages are stored under workspaces/{workspaceId}/channels/{channelId}/messages
// We need a special sub-sub-collection handler
export function getMessagesRef(workspaceId: string, channelId: string) {
  const db = getDb();
  return collection(db, `workspaces/${workspaceId}/channels/${channelId}/messages`);
}

export async function getMessages(workspaceId: string, channelId: string, opts: {
  orderBy?: OrderByClause[];
  limit?: number;
  startAfterValue?: unknown;
} = {}): Promise<any[]> {
  const db = getDb();
  const messagesRef = getMessagesRef(workspaceId, channelId);
  const constraints: any[] = [];

  if (opts.orderBy) {
    for (const o of opts.orderBy) {
      constraints.push(fbOrderBy(o.field, o.direction || 'asc'));
    }
  }
  if (opts.limit) {
    constraints.push(limit(opts.limit));
  }

  const q = query(messagesRef, ...constraints);
  const snapshot = await getDocs(q);
  const results: any[] = [];
  snapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });
  return results;
}

export async function createMessage(workspaceId: string, channelId: string, data: Record<string, unknown>): Promise<any> {
  const db = getDb();
  const messagesRef = getMessagesRef(workspaceId, channelId);
  const id = generateId();
  const docRef = doc(db, `workspaces/${workspaceId}/channels/${channelId}/messages`, id);
  const messageData = { ...data, id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
  await setDoc(docRef, messageData);
  return messageData;
}

export async function updateMessage(workspaceId: string, channelId: string, messageId: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  const docRef = doc(db, `workspaces/${workspaceId}/channels/${channelId}/messages`, messageId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteMessage(workspaceId: string, channelId: string, messageId: string): Promise<void> {
  const db = getDb();
  const docRef = doc(db, `workspaces/${workspaceId}/channels/${channelId}/messages`, messageId);
  await deleteDoc(docRef);
}

export const documentModel = new FirestoreSubModel<{
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  version: number;
  tags: string;
  folder?: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces', 'workspaceId', 'documents');

export const spreadsheetModel = new FirestoreSubModel<{
  id: string;
  workspaceId: string;
  title: string;
  columns: string;
  rows: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces', 'workspaceId', 'spreadsheets');

export const presentationModel = new FirestoreSubModel<{
  id: string;
  workspaceId: string;
  title: string;
  slides: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces', 'workspaceId', 'presentations');

export const taskModel = new FirestoreSubModel<{
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId?: string | null;
  createdBy: string;
  dueDate?: Timestamp | null;
  tags: string;
  order: number;
  parentId?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('workspaces', 'workspaceId', 'tasks');

export const notificationModel = new FirestoreSubModel<{
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  actorId?: string | null;
  workspaceId?: string | null;
  channelId?: string | null;
  invitationId?: string | null;
  createdAt: Timestamp;
}>('users', 'userId', 'notifications');

export const invitationModel = new FirestoreModel<{
  id: string;
  userId: string;
  invitedBy: string;
  workspaceId: string;
  channelId?: string | null;
  role: string;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>('invitations');

// ---- DB-lite: A simpler API for routes that need quick access ----

export const firestoreDb = {
  user: userModel,
  workspace: workspaceModel,
  workspaceMember: workspaceMemberModel,
  channel: channelModel,
  document: documentModel,
  spreadsheet: spreadsheetModel,
  presentation: presentationModel,
  task: taskModel,
  notification: notificationModel,
  invitation: invitationModel,
  // Special message handling (sub-sub-collection: workspaces/{wid}/channels/{cid}/messages/{mid})
  message: {
    /** Resolve workspaceId + channelId for a message, either from where or by looking it up */
    _resolveParentIds: async (id: string) => {
      // For now, routes must provide workspaceId and channelId in where
      return null;
    },

    findUnique: async (params: any = {}) => {
      const { where, include } = params;
      // Messages are in sub-sub-collections, need workspaceId + channelId
      // If route only passes { id }, we try to find it by querying all channels
      // But that's expensive. For now, routes must provide workspaceId
      if (where.workspaceId && where.channelId && where.id) {
        const db = getDb();
        const docRef = doc(db, `workspaces/${where.workspaceId}/channels/${where.channelId}/messages/${where.id}`);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        let msg: any = { id: snap.id, ...snap.data() };
        msg = serializeTimestamps(msg);

        if (include?.author) {
          const userDoc = await getDoc(doc(db, `users/${msg.userId}`));
          if (userDoc.exists()) {
            const userData = serializeTimestamps({ id: userDoc.id, ...userDoc.data() });
            if (include.author.select) {
              const sel = include.author.select as Record<string, unknown>;
              const filtered: Record<string, unknown> = { id: userDoc.id };
              for (const [k, v] of Object.entries(sel)) {
                if (v && k in userData) filtered[k] = userData[k];
              }
              msg.author = filtered;
            } else {
              msg.author = userData;
            }
          }
        }
        return msg;
      }
      return null;
    },

    findMany: async (params: any = {}) => {
      const { where, orderBy, take, skip, include } = params;
      const wid = where?.workspaceId;
      const cid = where?.channelId;
      if (!wid || !cid) return [];

      const msgs = await getMessages(wid, cid, {
        orderBy: orderBy ? (Array.isArray(orderBy) ? orderBy : [orderBy]).map((o: any) => {
          if (o.field) return o;
          const key = Object.keys(o)[0];
          return { field: key, direction: o[key] === 'desc' ? 'desc' : 'asc' };
        }) : undefined,
        limit: take,
      });

      // Filter in-memory for additional where conditions not supported by query
      let filtered = msgs;
      if (where) {
        for (const [field, value] of Object.entries(where)) {
          if (field !== 'workspaceId' && field !== 'channelId' && value !== undefined) {
            filtered = filtered.filter((m: any) => m[field] === value);
          }
        }
      }

      // Apply include for author
      if (include?.author) {
        const db = getDb();
        filtered = await Promise.all(filtered.map(async (msg: any) => {
          if (msg.userId) {
            const userDoc = await getDoc(doc(db, `users/${msg.userId}`));
            if (userDoc.exists()) {
              const userData = serializeTimestamps({ id: userDoc.id, ...userDoc.data() });
              if (include.author.select) {
                const sel = include.author.select as Record<string, unknown>;
                const filteredUser: Record<string, unknown> = { id: userDoc.id };
                for (const [k, v] of Object.entries(sel)) {
                  if (v && k in userData) filteredUser[k] = userData[k];
                }
                msg.author = filteredUser;
              } else {
                msg.author = userData;
              }
            }
          }
          return msg;
        }));
      }

      return filtered;
    },

    findFirst: async (params: any = {}) => {
      const results = await db.message.findMany({ ...params, take: 1 } as any);
      return results.length > 0 ? results[0] : null;
    },

    count: async (params: any = {}) => {
      const results = await db.message.findMany(params as any);
      return results.length;
    },

    create: async (params: { data: Record<string, unknown> }) => {
      return createMessage(
        params.data.workspaceId as string,
        params.data.channelId as string,
        params.data
      );
    },
    update: async (params: any = {}) => {
      const { where, data, include } = params;
      if (!where?.workspaceId || !where?.channelId || !where?.id) return null;
      await updateMessage(where.workspaceId, where.channelId, where.id, data);

      // Re-fetch with include if needed
      if (include) {
        return db.message.findUnique({ where, include } as any);
      }
      return null;
    },
    delete: async (params: { where: { id: string; workspaceId: string; channelId: string } }) => {
      await deleteMessage(params.where.workspaceId, params.where.channelId, params.where.id);
      return null;
    },
  },
};
