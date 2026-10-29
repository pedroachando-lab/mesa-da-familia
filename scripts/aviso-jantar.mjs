/* Envia o aviso diário do jantar a todos os telemóveis registados em cada família.
   Corre no GitHub Actions (gratuito). Só envia entre as 12h e as 15h de Lisboa e uma vez por dia. */
import admin from 'firebase-admin';

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.error('Falta o segredo FIREBASE_SERVICE_ACCOUNT.'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const fcm = admin.messaging();

const force = process.env.FORCE === 'true';
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
}).formatToParts(new Date()).map(p => [p.type, p.value]));
const today = `${parts.year}-${parts.month}-${parts.day}`;
const hour = Number(parts.hour);
if (!force && (hour < 12 || hour >= 15)) { console.log(`São ${hour}h em Lisboa: fora da janela do aviso.`); process.exit(0); }

const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const pagesUrl = repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${repo.toLowerCase()}/` : `https://${owner.toLowerCase()}.github.io/${repo}/`;
const appUrl = (process.env.APP_URL || pagesUrl).replace(/\/?$/, '/');
const DEAD = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument']);

const families = await db.collection('families').get();
for (const fam of families.docs) {
  if (!force && fam.get('lastNotified') === today) { console.log(`${fam.id.slice(0, 4)}…: já avisada hoje.`); continue; }
  const tokenDocs = (await fam.ref.collection('tokens').get()).docs.filter(d => d.get('token'));
  if (!tokenDocs.length) continue;

  const plan = await fam.ref.collection('plan').doc(`${today}_jantar`).get();
  const title = plan.exists ? `Jantar de hoje: ${plan.get('title')}` : 'O que vamos jantar hoje?';
  const body = plan.exists
    ? 'Já está escolhido e os ingredientes estão na lista de compras.'
    : 'Ainda ninguém escolheu o jantar. Toque para ver as sugestões.';

  const res = await fcm.sendEachForMulticast({
    tokens: tokenDocs.map(d => d.get('token')),
    webpush: {
      notification: { title, body, icon: `${appUrl}icons/icon-192.png`, badge: `${appUrl}icons/icon-192.png`, tag: `jantar-${today}`, lang: 'pt-PT' },
      fcmOptions: { link: appUrl }
    }
  });
  await Promise.all(res.responses.map((r, i) =>
    !r.success && DEAD.has(r.error?.code) ? tokenDocs[i].ref.delete() : null));
  await fam.ref.set({ lastNotified: today }, { merge: true });
  console.log(`${fam.id.slice(0, 4)}…: ${res.successCount} enviados, ${res.failureCount} falharam.`);
}
