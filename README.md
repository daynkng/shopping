# Known

Personal shopping that learns from your corrections. The app works without API keys and includes 60 real merchant products, reactive filters, reviewed personal learning, and optional live connections.

## Run

Requires Node 22.9+; there are no package dependencies.

```sh
cd /Users/dayeon/Repository/shopping
npm start
```

Open http://127.0.0.1:4317 and choose a profile. `/demo/maya` and `/demo/jordan` remain shareable links; `/profiles/maya` and `/profiles/jordan` are aliases. `npm run dev` watches the server. `npm test` runs offline tests, and `npm run build` produces the client in `dist/`.

## Four ready shopping cases

1. Maya’s commuter backpack — Seattle, a bike commute, a 16-inch laptop, minimal styling, and a rainy weather scenario.
2. Jordan’s family backpack — Austin, school/work driving, organization, bottles, snacks, and a warmer weather scenario.
3. Maya’s work tote — laptop-aware office carrying, closure, useful organization, and style.
4. Maya’s conference jacket — presentation styling, carry-on travel, packability, and weather considerations.

On first use each example runs the built-in engine and displays eight ranked products from at least eight eligible candidates. The same catalog produces different personalization from the two profiles; rankings are computed, not hardcoded product orders. Users can create more threads or delete threads with Undo. Deleting a thread preserves cart items, saved learning, and activity.

**Built-in shopping is the default and needs no credentials.** It is a deterministic catalog engine, not an external language model. It supports requests and follow-ups about budget, cheaper options, known weights, laptop dimensions, color, weather resistance, jacket size, formal styling, zip-top closure, and references such as “alternatives to the first one.” Unsupported requests ask a short clarification. Connected providers are selected explicitly in Settings and never silently replace or fall back to the built-in engine.

## Reactive filters and correction loop

Filter chips and budget/size controls refresh the latest product set in place, without an Apply button or another full chat exchange. Budget changes are debounced. Request sequencing ignores stale replies when filters change quickly. Failures label the visible products as previous results.

User requirements and inferred filters carry separate provenance. Maya initially receives `✧ AI suggested · Water-resistant only`, inferred from the rainy cycling context. Remove it to expand the candidate set; it stays suppressed through that thread’s follow-ups. Selecting “Don’t auto-apply this in future searches” saves a profile-specific persistent correction. Explicitly adding rain protection overrides that suppression for the current request/thread. Jordan’s policy state is independent.

The rainy-commute memory is never deleted. It can still influence soft ranking. The same suppression policy is included before connected-agent discovery and enforced after output validation. No hidden budget is applied. Unknown measurements cannot satisfy hard requirements. Waterproof and water-resistant are distinct attributes.

## Reviewed learning and Cognee feedback

After an exchange, explicit personal statements can produce a **Remember this?** card with Save/Dismiss. Examples:

- “I prefer zip-top work totes” → a proposed preference.
- “I already have a hiking pack” → a proposed ownership record.
- An explicit dated personal event → a proposed event.
- Rejecting an automatic filter → a policy correction, not deletion of the original preference.

“Under $100 for this purchase” stays thread-only. Whole conversations are not uploaded as memories. Proposed records preserve original wording, profile, thread/message references, type, and capture time. Saving validates approval and ownership, immediately updates local context, and changes future built-in rankings. Dismissed suggestions are not learned.

With a connected Cognee session, Save writes the approved record to that profile’s configured dataset and requests indexing. The app reports “Saved to Cognee · Indexing” only after both requests are accepted. Without a connection, it reports “Saved locally.” Approved local memories expose Sync to Cognee after connecting. Write failures keep the local record and permit retries. Stable IDs, filenames and timestamps avoid duplicate retry writes. Indexing is asynchronous; accepted ingestion does not mean indexing has completed.

Home location and dated weather scenarios appear only in My Context. They remain separate from preferences and calendar events. Source records and the scoped context can be inspected through product evidence and audit details.

## In-app connections

Settings provides Connect/Reconnect/Disconnect for OpenAI, Claude, Grok, Cognee and Superlinked. Agent forms accept an API key/model. Superlinked accepts its key/model. Cognee accepts the official tenant API URL and separate Maya/Jordan dataset UUIDs. Connection creation validates a real request before writing credentials or reporting Connected; Cognee validates retrieval for both datasets. A failed reconnect leaves the previous credential cookie unchanged. Forms clear key fields after submission, and no endpoint returns the keys.

A selected connected agent uses the native provider API and Superlinked hosted reranking; required-service failures are explicit. Built-in shopping remains selectable. Cognee connection is separate from selecting it as the personal-context source and can supply context to either engine. Server-managed credentials remain available through “Use workspace connection.” Explicit session disconnection masks server-managed credentials rather than silently reverting to them.

Credentials are encrypted/authenticated using AES-256-GCM in per-integration HttpOnly, SameSite=Strict session cookies. Deployed cookies are Secure; sessions have an enforced 12-hour maximum and no persistent cookie Max-Age. Authentication binds the integration ID, and tampered/expired cookies require reconnection. Browser shopping storage, analytics, URLs and response JSON do not contain credentials. Official provider hosts are fixed; user-entered Cognee URLs are limited to HTTPS tenant hosts under `.aws.cognee.ai`. Custom service hosts remain operator-managed.

## Operator deployment setup

Import `daynkng/shopping` into Vercel using the repository root. `vercel.json` serves `dist/` and deploys the root `api/` functions. Do not rewrite API requests to HTML. Follow-ups use the stateless backend even in built-in mode; no external service is called in the default sample-context path.

To enable encrypted in-app connections on deployed hosts, set **SESSION_ENCRYPTION_KEY** to 32 random bytes, encoded as base64 or 64 hex characters:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Keep that value private and stable across instances. Rotation invalidates existing credential sessions. Local development generates an ephemeral process key if omitted; restarting the server requires reconnecting. Deployed hosts fail closed if the encryption secret is missing. This is the only required deployment secret for users to connect their own integrations. Built-in shopping still works without it.

Optional server-managed variables are documented in `.env.example`: native agent keys/models; `SUPERLINKED_API_KEY`, base URL and scoring model; and `CONTEXT_SOURCE=sample|cognee` plus Cognee Cloud key, tenant URL and dataset IDs. UI messages do not expose hosting instructions. Set deployment traffic and vendor spend limits appropriate for sharing paid connections. Profiles are fictional demonstration accounts, not a private multi-user authentication system.

For Cognee setup, set its key and tenant URL locally and run `npm run setup:cognee`. It creates/reuses separate datasets, ingests typed profile/weather/memory records and verifies source-backed CHUNKS retrieval. Copy the resulting IDs into the Settings connection form or server-managed configuration. Identical seed content can be ingested again safely. No datasets are deleted. Selecting Cognee never falls back to sample context if retrieval fails.

## Product provenance

The catalog contains **24 backpacks, 18 work/daily totes and 18 jackets**, representing 60 distinct product models rather than color variants. Brands include Aer, Topo Designs, TOM BIHN, Day Owl, Dagne Dover, ABLE, Caraa, Lo & Sons, Taylor Stitch and Outdoor Research. All records retain merchant/source URLs, capture dates, local photos/original image URLs, variant IDs/prices, and supported attributes. See `CATALOG_SOURCES.md`.

Snapshots were captured November 20, 2026. Price and availability are not live-verified; merchant links confirm final facts. Weather is a fictional dated scenario, not a forecast. Style, organization and roominess are identified editorial classifications. Unknown dimensions/closures/carrying styles remain unknown. A `rain` attribute may refer to documented weather-protective fabric or zippers, with source evidence where available; it is never promoted to waterproof.

Checkout is explicitly simulated. Manual and agent-assisted review create local receipts, not merchant orders or payments. This distinction remains visible at confirmation.

## Activity

The Activity view derives counts from actual local interactions and displays an Amplitude-compatible event log. It is labeled **Stored locally · Amplitude not connected**. There is no Amplitude SDK, network transmission or fabricated conversion rate. Events have stable IDs, timestamps, profile/thread IDs and allowlisted product/filter properties; credentials and raw personal context are excluded. Result-display events are deduplicated across rerenders. Activity and suppression state are isolated by profile.

## Data and APIs

Browser state uses `known-shopping-v4`. Earlier v3 state is preserved; unanswered legacy chats are repaired through the built-in engine and ready examples are populated. New filters update the existing result message and its revision/audit. Approved learning, cart, receipts, events and suppressions persist locally; credential cookies are separate. No cross-device conversation synchronization is included.

- `GET /api/config`: redacted configuration, session status and selected context source.
- `GET/POST /api/connections`: status; validated connect/reconnect; explicit disconnect; Cognee context-source selection.
- `POST /api/search`: profile, provider, query/history, constraints, explicit filter patch, provenance, relevant suppressions and approved learning; returns validated products, updated filters and audit.
- `POST /api/feedback`: reviewed typed record and provenance, with explicit approval; confirms local validation or accepted Cognee ingestion/indexing.
- `POST /api/context`, `/api/preference`: source-backed context browsing and preference pinning.
- `POST /api/connection-test`: real configured connection checks.

Search order is context retrieval + approved learning + suppression policy → selected discovery engine → catalog eligibility → selected ranking engine. Built-in ranking uses transparent attribute/context matching; native providers use validated structured output and Superlinked’s actual raw scores. No provider or external call is claimed in built-in audit steps.

## Verification

`npm test` exercises catalog counts/photos, all four key-free cases, changing results, suppression and explicit overrides, reviewed learning, dataset isolation, native transport contracts, authenticated session encryption, expiry/tampering/disconnection, failed reconnect preservation, secret exclusion, local analytics, migration and response handling. Tests use isolated transports rather than paid credentials.

`npm run test:live -- --provider=openai` explicitly verifies the configured agent, Superlinked, both persona searches and referenced follow-ups. Claude/Grok can be selected similarly. Cognee-mode verification requires indexed datasets. Live service acceptance remains conditional on valid credentials; offline tests do not claim successful vendor calls.

## Editable profiles and preview connections
My Context contains optional gender, height in centimeters, clothing size, and category budgets. Fields begin unset and are stored separately per profile in this browser. Size and budget seed new searches; explicit chat requests and filter edits override them. Height and gender do not establish garment fit. Ranking explanations use sourced product attributes. Activity is under Settings. Unverified integrations display Connected · Demo preview and continue using built-in shopping; live calls still require verified credentials.

Conference presentation requests require tailored styling. Seven Universal Standard blazer models replace casual jackets in the 60-product catalog. Manufacturer size labels are retained; confirm sizing with the merchant. Existing chats are backed up locally and reseeded once for this presentation refresh.
