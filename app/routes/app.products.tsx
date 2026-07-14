import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getShopLanguage, getTranslations } from "../i18n.server";
import "../styles/launchpilot.css";

type Product = { id:string; title:string; handle:string; status:string; totalInventory:number|null; description:string|null; featuredMedia?:{preview?:{image?:{url?:string;altText?:string|null}|null}|null}|null; variants?:{nodes?:Array<{price?:string;compareAtPrice?:string|null}>} };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(`
    #graphql
    query LaunchPilotProducts {
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        nodes { id title handle status totalInventory description featuredMedia { preview { image { url altText } } } variants(first: 1) { nodes { price compareAtPrice } } }
      }
    }
  `);
  const json:any = await response.json();
  if (json.errors?.length) throw new Error("Não foi possível carregar os produtos da Shopify.");
  return { products:(json.data?.products?.nodes ?? []) as Product[], language:await getShopLanguage(session.shop) };
};

export default function Products() {
  const { products, language } = useLoaderData<typeof loader>();
  const t = getTranslations(language);
  return <s-page heading={String(t("products"))}><s-button slot="primary-action" href="/app/studio">{String(t("create_content"))}</s-button><div className="lp-page-stack"><section className="lp-module-hero"><div className="lp-module-icon">🛍️</div><div><p className="lp-eyebrow">{String(t("catalog"))}</p><h2 className="lp-module-title">{String(t("choose_product"))}</h2><p className="lp-module-description">{String(t("products_desc"))}</p></div></section>{products.length===0?<section className="lp-panel"><p className="lp-muted">Não existem produtos disponíveis nesta loja.</p></section>:<div className="lp-product-grid">{products.map(product=>{const image=product.featuredMedia?.preview?.image?.url;const alt=product.featuredMedia?.preview?.image?.altText??product.title;const variant=product.variants?.nodes?.[0];return <article className="lp-product-card" key={product.id}><div className="lp-product-image">{image?<img src={image} alt={alt}/>:<span>📦</span>}</div><div className="lp-product-body"><div className="lp-product-meta"><span className={`lp-status lp-status-${String(product.status).toLowerCase()}`}>{product.status}</span><span>{product.totalInventory??0} {String(t("in_stock"))}</span></div><h3>{product.title}</h3><p>{product.description?.trim()||String(t("no_description"))}</p><div className="lp-product-footer"><div><strong>{variant?.price?`€${variant.price}`:"—"}</strong>{variant?.compareAtPrice?<span className="lp-compare-price">€{variant.compareAtPrice}</span>:null}</div><Form action="/app/studio" method="get"><input type="hidden" name="product" value={product.id}/><button className="lp-native-button" type="submit">{String(t("use_product"))}</button></Form></div></div></article>})}</div>}</div></s-page>;
}
export const headers:HeadersFunction=(args)=>boundary.headers(args);
