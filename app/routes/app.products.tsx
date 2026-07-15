import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { getShopLanguage } from "../i18n.server";

import "../styles/launchpilot.css";

type Language = "pt-PT" | "en-US" | "es-ES" | "fr-FR" | "it-IT" | "de-DE";

type Product = {
  id: string;
  title: string;
  handle: string;
  status: string;
  totalInventory: number | null;
  description: string | null;
  onlineStoreUrl: string | null;
  featuredMedia?: {
    preview?: {
      image?: {
        url?: string;
        altText?: string | null;
      } | null;
    } | null;
  } | null;
  variants?: {
    nodes?: Array<{
      price?: string;
      compareAtPrice?: string | null;
    }>;
  };
};

const copy = {
  "pt-PT": {
    page: "Produtos",
    kicker: "Catálogo da loja",
    title: "Escolhe os produtos que queres promover",
    description:
      "Usa os produtos reais da Shopify para criar anúncios e conteúdos em poucos segundos.",
    createAd: "Criar anúncio",
    createContent: "Criar conteúdo",
    empty: "Ainda não existem produtos disponíveis nesta loja.",
    active: "Pronto para anunciar",
    inactive: "Não está ativo",
    draft: "Rascunho",
    archived: "Arquivado",
    stock: "em stock",
    noStock: "Sem stock",
    noDescription: "Ainda sem descrição.",
    priceUnavailable: "Preço indisponível",
    comparePrice: "Antes",
    viewStore: "Ver na loja",
    available: "Disponível",
    unavailable: "Indisponível",
  },
  "en-US": {
    page: "Products",
    kicker: "Store catalogue",
    title: "Choose the products you want to promote",
    description:
      "Use real Shopify products to create ads and content in seconds.",
    createAd: "Create ad",
    createContent: "Create content",
    empty: "There are no products available in this store yet.",
    active: "Ready to advertise",
    inactive: "Not active",
    draft: "Draft",
    archived: "Archived",
    stock: "in stock",
    noStock: "Out of stock",
    noDescription: "No description yet.",
    priceUnavailable: "Price unavailable",
    comparePrice: "Was",
    viewStore: "View in store",
    available: "Available",
    unavailable: "Unavailable",
  },
  "es-ES": {
    page: "Productos",
    kicker: "Catálogo de la tienda",
    title: "Elige los productos que quieres promocionar",
    description:
      "Usa productos reales de Shopify para crear anuncios y contenido.",
    createAd: "Crear anuncio",
    createContent: "Crear contenido",
    empty: "Todavía no hay productos disponibles.",
    active: "Listo para anunciar",
    inactive: "No está activo",
    draft: "Borrador",
    archived: "Archivado",
    stock: "en stock",
    noStock: "Sin stock",
    noDescription: "Todavía sin descripción.",
    priceUnavailable: "Precio no disponible",
    comparePrice: "Antes",
    viewStore: "Ver en tienda",
    available: "Disponible",
    unavailable: "No disponible",
  },
  "fr-FR": {
    page: "Produits",
    kicker: "Catalogue de la boutique",
    title: "Choisissez les produits à promouvoir",
    description:
      "Utilisez les vrais produits Shopify pour créer des publicités et du contenu.",
    createAd: "Créer une publicité",
    createContent: "Créer du contenu",
    empty: "Aucun produit n’est encore disponible.",
    active: "Prêt à promouvoir",
    inactive: "Non actif",
    draft: "Brouillon",
    archived: "Archivé",
    stock: "en stock",
    noStock: "Rupture de stock",
    noDescription: "Pas encore de description.",
    priceUnavailable: "Prix indisponible",
    comparePrice: "Avant",
    viewStore: "Voir en boutique",
    available: "Disponible",
    unavailable: "Indisponible",
  },
  "it-IT": {
    page: "Prodotti",
    kicker: "Catalogo del negozio",
    title: "Scegli i prodotti da promuovere",
    description:
      "Usa i prodotti reali di Shopify per creare annunci e contenuti.",
    createAd: "Crea annuncio",
    createContent: "Crea contenuto",
    empty: "Non ci sono ancora prodotti disponibili.",
    active: "Pronto da pubblicizzare",
    inactive: "Non attivo",
    draft: "Bozza",
    archived: "Archiviato",
    stock: "disponibili",
    noStock: "Esaurito",
    noDescription: "Nessuna descrizione.",
    priceUnavailable: "Prezzo non disponibile",
    comparePrice: "Prima",
    viewStore: "Vedi nel negozio",
    available: "Disponibile",
    unavailable: "Non disponibile",
  },
  "de-DE": {
    page: "Produkte",
    kicker: "Shop-Katalog",
    title: "Wähle die Produkte aus, die du bewerben möchtest",
    description:
      "Nutze echte Shopify-Produkte, um Anzeigen und Inhalte zu erstellen.",
    createAd: "Anzeige erstellen",
    createContent: "Inhalt erstellen",
    empty: "Noch keine Produkte verfügbar.",
    active: "Bereit für Werbung",
    inactive: "Nicht aktiv",
    draft: "Entwurf",
    archived: "Archiviert",
    stock: "auf Lager",
    noStock: "Nicht auf Lager",
    noDescription: "Noch keine Beschreibung.",
    priceUnavailable: "Preis nicht verfügbar",
    comparePrice: "Vorher",
    viewStore: "Im Shop ansehen",
    available: "Verfügbar",
    unavailable: "Nicht verfügbar",
  },
} satisfies Record<Language, Record<string, string>>;

function formatMoney(value: string | undefined, language: Language) {
  const amount = Number(value);

  if (!value || !Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusLabel(status: string, language: Language) {
  const text = copy[language] ?? copy["en-US"];

  if (status === "ACTIVE") return text.active;
  if (status === "DRAFT") return text.draft;
  if (status === "ARCHIVED") return text.archived;

  return text.inactive;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query SellForgeProducts {
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          title
          handle
          status
          totalInventory
          description
          onlineStoreUrl
          featuredMedia {
            preview {
              image {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            nodes {
              price
              compareAtPrice
            }
          }
        }
      }
    }
  `);

  const json: any = await response.json();

  if (json.errors?.length) {
    console.error("SellForgeProducts GraphQL errors:", json.errors);
    throw new Error("Não foi possível carregar os produtos da Shopify.");
  }

  return {
    products: (json.data?.products?.nodes ?? []) as Product[],
    language: await getShopLanguage(session.shop),
  };
};

export default function Products() {
  const { products, language } = useLoaderData<typeof loader>();
  const currentLanguage = language as Language;
  const text = copy[currentLanguage] ?? copy["en-US"];

  return (
    <s-page heading={text.page}>
      <s-button slot="primary-action" variant="primary" href="/app/ads">
        {text.createAd}
      </s-button>

      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">P</div>

          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">{text.description}</p>
          </div>
        </section>

        {products.length === 0 ? (
          <section className="lp-panel">
            <p className="lp-muted">{text.empty}</p>
          </section>
        ) : (
          <div className="lp-product-grid">
            {products.map((product) => {
              const image = product.featuredMedia?.preview?.image?.url;
              const alt =
                product.featuredMedia?.preview?.image?.altText ??
                product.title;
              const variant = product.variants?.nodes?.[0];
              const price = formatMoney(
                variant?.price,
                currentLanguage,
              );
              const comparePrice = formatMoney(
                variant?.compareAtPrice ?? undefined,
                currentLanguage,
              );
              const stock = product.totalInventory ?? 0;
              const hasStock = stock > 0;
              const isActive = product.status === "ACTIVE";

              return (
                <article className="lp-product-card" key={product.id}>
                  <div className="lp-product-image">
                    {image ? (
                      <img src={image} alt={alt} />
                    ) : (
                      <span>P</span>
                    )}
                  </div>

                  <div className="lp-product-body">
                    <div className="lp-product-meta">
                      <span
                        className={`lp-status lp-status-${String(
                          product.status,
                        ).toLowerCase()}`}
                      >
                        {getStatusLabel(
                          product.status,
                          currentLanguage,
                        )}
                      </span>

                      <span>
                        {hasStock
                          ? `${stock} ${text.stock}`
                          : text.noStock}
                      </span>
                    </div>

                    <h3>{product.title}</h3>

                    <p>
                      {product.description?.trim() ||
                        text.noDescription}
                    </p>

                    <div className="lp-product-footer">
                      <div>
                        <strong>
                          {price ?? text.priceUnavailable}
                        </strong>

                        {comparePrice ? (
                          <span className="lp-compare-price">
                            {text.comparePrice}: {comparePrice}
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={`lp-status ${
                          isActive && hasStock
                            ? "lp-status-active"
                            : ""
                        }`}
                      >
                        {isActive && hasStock
                          ? text.available
                          : text.unavailable}
                      </span>
                    </div>

                    <div className="lp-social-actions">
                      <a
                        className="lp-native-button lp-primary"
                        href={`/app/ads?product=${encodeURIComponent(
                          product.id,
                        )}`}
                      >
                        {text.createAd}
                      </a>

                      <a
                        className="lp-native-button"
                        href={`/app/studio?product=${encodeURIComponent(
                          product.id,
                        )}`}
                      >
                        {text.createContent}
                      </a>

                      {product.onlineStoreUrl ? (
                        <a
                          className="lp-native-button"
                          href={product.onlineStoreUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {text.viewStore}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};