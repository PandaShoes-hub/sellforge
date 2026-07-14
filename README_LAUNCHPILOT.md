# LaunchPilot

Multi-merchant Shopify marketing SaaS starter.

## Included
- Shopify product catalog sync
- AI/template content generation
- Promotional image download
- Campaign storage and scheduling
- Meta Facebook/Instagram OAuth connection
- Merchant-level Autopilot settings
- Meta, Google and TikTok ad campaign draft manager
- Analytics, brand settings and plan storage
- Multi-tenant data isolation by `shop`

## External activation still required
Live publishing, ad creation and paid Shopify subscriptions require the merchant to authorize the relevant platform and require your production apps to be approved by Meta, Google, TikTok and Shopify. Add the credentials in `.env`. Never commit secrets.

## Start
```powershell
cd C:\LaunchPilotAI\launch-pilot
npm install
npx prisma generate
npx prisma migrate dev --name launchpilot_growth
shopify app dev
```
