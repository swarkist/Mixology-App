import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const COLL = 'favorites';

function docId(userId: string, cocktailId: string) {
  return `${userId}_${cocktailId}`;
}

export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const db = getFirestore();
  const snap = await db.collection(COLL).where('userId', '==', userId).get();
  return snap.docs.map((d: any) => d.get('cocktailId') as string);
}

export async function toggleFavorite(userId: string, cocktailId: string): Promise<boolean> {
  const db = getFirestore();
  const id = docId(userId, cocktailId);
  const ref = db.collection(COLL).doc(id);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.delete();
    return false;
  } else {
    await ref.set({
      userId,
      cocktailId,
      createdAt: Timestamp.now(),
    });
    return true;
  }
}