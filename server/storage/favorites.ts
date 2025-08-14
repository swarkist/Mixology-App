import { db } from '../firebase';
import { Timestamp } from 'firebase-admin/firestore';

const COLL = 'favorites';
const key = (userId: string, cocktailId: string) => `${String(userId)}_${String(cocktailId)}`;

export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const snap = await db.collection(COLL).where('userId', '==', String(userId)).get();
  return snap.docs.map((d: any) => String(d.get('cocktailId')));
}

export async function toggleFavorite(userId: string, cocktailId: string): Promise<boolean> {
  const id = key(String(userId), String(cocktailId));
  const ref = db.collection(COLL).doc(id);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.delete();
    return false;
  } else {
    await ref.set({
      userId: String(userId),
      cocktailId: String(cocktailId),
      createdAt: Timestamp.now(),
    });
    return true;
  }
}