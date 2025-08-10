// server/scripts/backup-firestore.cjs
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret."); 
  process.exit(1);
}
const svc = JSON.parse(raw);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

async function exportAll() {
  const db = admin.firestore();
  const snapshot = await db.listCollections();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
  const outDir = path.join(process.cwd(), "backups", stamp);
  fs.mkdirSync(outDir, { recursive: true });

  for (const col of snapshot) {
    const colName = col.id;
    const docsSnap = await col.get();
    const items = [];
    for (const doc of docsSnap.docs) {
      items.push({ id: doc.id, ...doc.data() });
    }
    const file = path.join(outDir, `${colName}.json`);
    fs.writeFileSync(file, JSON.stringify(items, null, 2));
    console.log(`✔ Exported ${items.length} docs from ${colName} -> ${file}`);
  }
  console.log(`✅ Backup completed: ${outDir}`);
}

exportAll().catch((e) => { console.error(e); process.exit(1); });