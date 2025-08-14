import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const COLL = 'favorites';

function docId(userId: string, cocktailId: string) {
  return `${userId}_${cocktailId}`;
}

export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const db = getFirestore();
  const userIdStr = userId.toString();
  const snap = await db.collection(COLL).where('userId', '==', userIdStr).get();
  return snap.docs.map((d: any) => d.get('cocktailId').toString());
}

export async function toggleFavorite(userId: string, cocktailId: string): Promise<boolean> {
  const db = getFirestore();
  const userIdStr = userId.toString();
  const cocktailIdStr = cocktailId.toString();
  const id = docId(userIdStr, cocktailIdStr);
  const ref = db.collection(COLL).doc(id);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.delete();
    return false;
  } else {
    await ref.set({
      userId: userIdStr,
      cocktailId: cocktailIdStr,
      createdAt: Timestamp.now(),
    });
    return true;
  }
}