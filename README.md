# Mesa da Família

App instalável (PWA) para a família escolher o almoço e o jantar e partilhar a lista de compras.

- **Sugestões:** receitas portuguesas por tipo (carne, peixe, vegetariano). Nos dias úteis só se escolhe o jantar, com pratos rápidos. Aos fins de semana e feriados há almoço e jantar, com pratos mais elaborados.
- **Plano:** refeições dos próximos 7 dias.
- **Lista:** em mosaico, ao estilo do Bring. Os ingredientes das refeições escolhidas entram sozinhos e podem ser eliminados. Também se juntam outros produtos.
- **Aviso das 12h:** cada telemóvel recebe uma notificação para escolher o jantar.

Tudo funciona nos planos gratuitos: GitHub Pages (alojamento), GitHub Actions (aviso diário) e Firebase Spark (dados e notificações).

## Como está organizado

| Pasta / ficheiro | Para quê |
| --- | --- |
| `app/` | A app publicada no GitHub Pages |
| `app/firebase-config.js` | Configuração pública do Firebase e chave VAPID |
| `app/sw.js` | Funciona sem rede e recebe as notificações |
| `firestore.rules` | Regras de segurança a colar no Firestore |
| `scripts/aviso-jantar.mjs` | Envia o aviso do jantar |
| `.github/workflows/publicar.yml` | Publica a app em cada alteração |
| `.github/workflows/aviso-jantar.yml` | Corre o aviso todos os dias perto das 12h de Lisboa |

## Configuração

1. **Firebase:** crie um projeto e uma base de dados Firestore, cole as regras de `firestore.rules`, registe uma app Web, gere a chave de notificações Web (VAPID) e transfira a chave privada da conta de serviço.
2. **`app/firebase-config.js`:** cole a configuração da app Web e a chave VAPID.
3. **GitHub, Settings → Pages:** em Source, escolha "GitHub Actions".
4. **GitHub, Settings → Secrets and variables → Actions:** crie o segredo `FIREBASE_SERVICE_ACCOUNT` com o conteúdo completo do ficheiro JSON da conta de serviço.
5. **Primeiro uso:** abra a app, toque em "Criar a família" e partilhe o convite no grupo do WhatsApp.
6. **Teste do aviso:** em Actions → Aviso do jantar → Run workflow, marque "Enviar já".

Os dados de cada família ficam em `families/<código>` no Firestore. O código é aleatório e só é conhecido por quem recebe o convite.
