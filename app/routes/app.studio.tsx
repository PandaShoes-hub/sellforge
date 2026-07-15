import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { generateCampaign } from "../services/marketing.server";
import CreativePreview from "../components/studio/CreativePreview";
import { getShopLanguage } from "../i18n.server";

import "../styles/launchpilot.css";

type Language = "pt-PT" | "en-US" | "es-ES" | "fr-FR" | "it-IT" | "de-DE";

type StudioProduct = {
  id: string;
  title: string;
  description: string | null;
  featuredMedia?: {
    preview?: {
      image?: {
        url?: string;
      } | null;
    } | null;
  } | null;
  variants?: {
    nodes?: Array<{
      price?: string;
    }>;
  };
};

const copy = {
  "pt-PT": {
    page: "Criar conteúdo",
    kicker: "Assistente de marketing",
    title: "Cria conteúdo para vender mais",
    description:
      "Escolhe um produto e deixa a SellForge preparar o texto, o título, as hashtags e a imagem.",
    product: "Produto",
    chooseProduct: "Escolhe um produto",
    format: "Onde vais publicar?",
    feed: "Facebook ou Instagram",
    story: "Story",
    reel: "Ideia para Reel",
    goal: "O que queres alcançar?",
    sales: "Vender mais",
    awareness: "Dar a conhecer a marca",
    launch: "Lançar um produto",
    tone: "Como deve ser o tom?",
    friendly: "Simples e próximo",
    premium: "Elegante",
    energetic: "Energético",
    minimal: "Curto e direto",
    generate: "Criar conteúdo",
    generating: "A criar conteúdo...",
    chooseFirst: "Escolhe primeiro um produto.",
    preview: "Pré-visualização",
    previewHint: "Vê como o conteúdo pode ficar antes de o usar.",
    generated: "Conteúdo criado",
    generatedHint: "Já podes copiar, descarregar ou agendar.",
    schedule: "Agendar publicação",
    source: "Criado com",
    caption: "Texto da publicação",
    hashtags: "Hashtags",
    callToAction: "Chamada para ação",
    recent: "Conteúdos recentes",
    recentHint: "Últimos conteúdos criados para esta loja.",
    delete: "Eliminar",
    empty: "Ainda não criaste nenhum conteúdo.",
    imageAlt: "Imagem do produto",
    download: "Descarregar imagem",
    discover: "Descobre mais na nossa loja",
    success: "Conteúdo criado e guardado com sucesso.",
  },
  "en-US": {
    page: "Create content",
    kicker: "Marketing assistant",
    title: "Create content that helps you sell more",
    description:
      "Choose a product and let SellForge prepare the copy, title, hashtags and image.",
    product: "Product",
    chooseProduct: "Choose a product",
    format: "Where will you publish?",
    feed: "Facebook or Instagram",
    story: "Story",
    reel: "Reel idea",
    goal: "What do you want to achieve?",
    sales: "Sell more",
    awareness: "Build brand awareness",
    launch: "Launch a product",
    tone: "What tone should it use?",
    friendly: "Simple and friendly",
    premium: "Elegant",
    energetic: "Energetic",
    minimal: "Short and direct",
    generate: "Create content",
    generating: "Creating content...",
    chooseFirst: "Choose a product first.",
    preview: "Preview",
    previewHint: "See how the content could look before using it.",
    generated: "Content created",
    generatedHint: "You can now copy, download or schedule it.",
    schedule: "Schedule post",
    source: "Created with",
    caption: "Post copy",
    hashtags: "Hashtags",
    callToAction: "Call to action",
    recent: "Recent content",
    recentHint: "Latest content created for this store.",
    delete: "Delete",
    empty: "You have not created any content yet.",
    imageAlt: "Product image",
    download: "Download image",
    discover: "Discover more in our store",
    success: "Content created and saved successfully.",
  },
  "es-ES": {
    page: "Crear contenido",
    kicker: "Asistente de marketing",
    title: "Crea contenido para vender más",
    description:
      "Elige un producto y deja que SellForge prepare el texto, título, hashtags e imagen.",
    product: "Producto",
    chooseProduct: "Elige un producto",
    format: "¿Dónde vas a publicar?",
    feed: "Facebook o Instagram",
    story: "Story",
    reel: "Idea para Reel",
    goal: "¿Qué quieres conseguir?",
    sales: "Vender más",
    awareness: "Dar a conocer la marca",
    launch: "Lanzar un producto",
    tone: "¿Qué tono debe usar?",
    friendly: "Simple y cercano",
    premium: "Elegante",
    energetic: "Enérgico",
    minimal: "Corto y directo",
    generate: "Crear contenido",
    generating: "Creando contenido...",
    chooseFirst: "Elige primero un producto.",
    preview: "Vista previa",
    previewHint: "Mira cómo puede quedar antes de usarlo.",
    generated: "Contenido creado",
    generatedHint: "Ya puedes copiarlo, descargarlo o programarlo.",
    schedule: "Programar publicación",
    source: "Creado con",
    caption: "Texto de la publicación",
    hashtags: "Hashtags",
    callToAction: "Llamada a la acción",
    recent: "Contenido reciente",
    recentHint: "Último contenido creado para esta tienda.",
    delete: "Eliminar",
    empty: "Todavía no has creado contenido.",
    imageAlt: "Imagen del producto",
    download: "Descargar imagen",
    discover: "Descubre más en nuestra tienda",
    success: "Contenido creado y guardado correctamente.",
  },
  "fr-FR": {
    page: "Créer du contenu",
    kicker: "Assistant marketing",
    title: "Créez du contenu pour vendre davantage",
    description:
      "Choisissez un produit et laissez SellForge préparer le texte, le titre, les hashtags et l’image.",
    product: "Produit",
    chooseProduct: "Choisir un produit",
    format: "Où allez-vous publier ?",
    feed: "Facebook ou Instagram",
    story: "Story",
    reel: "Idée de Reel",
    goal: "Quel est votre objectif ?",
    sales: "Vendre davantage",
    awareness: "Faire connaître la marque",
    launch: "Lancer un produit",
    tone: "Quel ton utiliser ?",
    friendly: "Simple et proche",
    premium: "Élégant",
    energetic: "Énergique",
    minimal: "Court et direct",
    generate: "Créer le contenu",
    generating: "Création du contenu...",
    chooseFirst: "Choisissez d’abord un produit.",
    preview: "Aperçu",
    previewHint: "Voyez le rendu avant de l’utiliser.",
    generated: "Contenu créé",
    generatedHint: "Vous pouvez maintenant le copier, le télécharger ou le programmer.",
    schedule: "Programmer la publication",
    source: "Créé avec",
    caption: "Texte de la publication",
    hashtags: "Hashtags",
    callToAction: "Appel à l’action",
    recent: "Contenus récents",
    recentHint: "Derniers contenus créés pour cette boutique.",
    delete: "Supprimer",
    empty: "Aucun contenu créé pour le moment.",
    imageAlt: "Image du produit",
    download: "Télécharger l’image",
    discover: "Découvrez-en plus dans notre boutique",
    success: "Contenu créé et enregistré avec succès.",
  },
  "it-IT": {
    page: "Crea contenuti",
    kicker: "Assistente marketing",
    title: "Crea contenuti per vendere di più",
    description:
      "Scegli un prodotto e lascia che SellForge prepari testo, titolo, hashtag e immagine.",
    product: "Prodotto",
    chooseProduct: "Scegli un prodotto",
    format: "Dove vuoi pubblicare?",
    feed: "Facebook o Instagram",
    story: "Story",
    reel: "Idea per Reel",
    goal: "Cosa vuoi ottenere?",
    sales: "Vendere di più",
    awareness: "Far conoscere il brand",
    launch: "Lanciare un prodotto",
    tone: "Che tono deve usare?",
    friendly: "Semplice e vicino",
    premium: "Elegante",
    energetic: "Energico",
    minimal: "Breve e diretto",
    generate: "Crea contenuto",
    generating: "Creazione contenuto...",
    chooseFirst: "Scegli prima un prodotto.",
    preview: "Anteprima",
    previewHint: "Guarda come può apparire prima di usarlo.",
    generated: "Contenuto creato",
    generatedHint: "Ora puoi copiarlo, scaricarlo o programmarlo.",
    schedule: "Programma pubblicazione",
    source: "Creato con",
    caption: "Testo del post",
    hashtags: "Hashtag",
    callToAction: "Invito all’azione",
    recent: "Contenuti recenti",
    recentHint: "Ultimi contenuti creati per questo negozio.",
    delete: "Elimina",
    empty: "Non hai ancora creato contenuti.",
    imageAlt: "Immagine del prodotto",
    download: "Scarica immagine",
    discover: "Scopri di più nel nostro negozio",
    success: "Contenuto creato e salvato con successo.",
  },
  "de-DE": {
    page: "Inhalte erstellen",
    kicker: "Marketing-Assistent",
    title: "Erstelle Inhalte, die mehr verkaufen",
    description:
      "Wähle ein Produkt und SellForge erstellt Text, Titel, Hashtags und Bild.",
    product: "Produkt",
    chooseProduct: "Produkt auswählen",
    format: "Wo möchtest du veröffentlichen?",
    feed: "Facebook oder Instagram",
    story: "Story",
    reel: "Reel-Idee",
    goal: "Was möchtest du erreichen?",
    sales: "Mehr verkaufen",
    awareness: "Marke bekannter machen",
    launch: "Produkt einführen",
    tone: "Welcher Ton soll verwendet werden?",
    friendly: "Einfach und freundlich",
    premium: "Elegant",
    energetic: "Energiegeladen",
    minimal: "Kurz und direkt",
    generate: "Inhalt erstellen",
    generating: "Inhalt wird erstellt...",
    chooseFirst: "Wähle zuerst ein Produkt.",
    preview: "Vorschau",
    previewHint: "Sieh dir das Ergebnis vor der Nutzung an.",
    generated: "Inhalt erstellt",
    generatedHint: "Du kannst ihn jetzt kopieren, herunterladen oder planen.",
    schedule: "Beitrag planen",
    source: "Erstellt mit",
    caption: "Beitragstext",
    hashtags: "Hashtags",
    callToAction: "Handlungsaufforderung",
    recent: "Letzte Inhalte",
    recentHint: "Zuletzt für diesen Shop erstellte Inhalte.",
    delete: "Löschen",
    empty: "Noch keine Inhalte erstellt.",
    imageAlt: "Produktbild",
    download: "Bild herunterladen",
    discover: "Mehr in unserem Shop entdecken",
    success: "Inhalt erfolgreich erstellt und gespeichert.",
  },
} satisfies Record<Language, Record<string, string>>;

async function getProducts(admin: any) {
  const response = await admin.graphql(`
    #graphql
    query SellForgeStudioProducts {
      products(first: 50, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          title
          description
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          variants(first: 1) {
            nodes {
              price
            }
          }
        }
      }
    }
  `);

  const json: any = await response.json();

  if (json.errors?.length) {
    console.error("SellForgeStudioProducts GraphQL errors:", json.errors);
    throw new Error("Não foi possível carregar os produtos da Shopify.");
  }

  return (json.data?.products?.nodes ?? []) as StudioProduct[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const products = await getProducts(admin);
  const url = new URL(request.url);
  const selected =
    url.searchParams.get("product") ||
    products[0]?.id ||
    "";

  const [settings, campaigns, language] = await Promise.all([
    db.brandSettings.findUnique({
      where: { shop: session.shop },
    }),
    db.campaign.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getShopLanguage(session.shop),
  ]);

  return {
    products,
    selected,
    settings,
    campaigns,
    language,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "generate");

  if (intent === "delete") {
    const id = String(form.get("id") || "");

    if (id) {
      await db.campaign.deleteMany({
        where: {
          id,
          shop: session.shop,
        },
      });
    }

    return {
      ok: true,
      deleted: true,
    };
  }

  const products = await getProducts(admin);
  const productId = String(form.get("productId") || "");
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return {
      ok: false,
      error: "Escolhe primeiro um produto.",
    };
  }

  const settings = await db.brandSettings.findUnique({
    where: { shop: session.shop },
  });

  const generated = await generateCampaign({
    productTitle: product.title,
    productDescription: product.description ?? undefined,
    price: product.variants?.nodes?.[0]?.price
      ? `€${product.variants.nodes[0].price}`
      : undefined,
    tone: String(form.get("tone") || settings?.tone || "friendly"),
    language: settings?.language || "pt-PT",
    goal: String(form.get("goal") || "sales"),
    format: String(form.get("format") || "feed"),
  });

  const campaign = await db.campaign.create({
    data: {
      shop: session.shop,
      productId: product.id,
      productTitle: product.title,
      productImage:
        product.featuredMedia?.preview?.image?.url || null,
      title: generated.title,
      caption: generated.caption,
      hashtags: generated.hashtags,
      callToAction: generated.callToAction,
      format: String(form.get("format") || "feed"),
      source: generated.source,
    },
  });

  return {
    ok: true,
    campaign,
  };
};

export default function Studio() {
  const {
    products,
    selected,
    settings,
    campaigns,
    language,
  } = useLoaderData<typeof loader>();

  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const currentLanguage = language as Language;
  const text = copy[currentLanguage] ?? copy["en-US"];
  const busy = navigation.state !== "idle";

  const generated =
    result && "campaign" in result
      ? result.campaign
      : null;

  const product =
    products.find(
      (item) =>
        item.id === (generated?.productId || selected),
    ) || products[0];

  return (
    <s-page heading={text.page}>
      <div className="lp-page-stack">
        <section className="lp-module-hero">
          <div className="lp-module-icon">C</div>

          <div>
            <p className="lp-eyebrow">{text.kicker}</p>
            <h2 className="lp-module-title">{text.title}</h2>
            <p className="lp-module-description">
              {text.description}
            </p>
          </div>
        </section>

        <div className="lp-studio-grid">
          <section className="lp-panel">
            <Form method="post" className="lp-form">
              <input
                type="hidden"
                name="intent"
                value="generate"
              />

              <label>
                {text.product}
                <select
                  name="productId"
                  defaultValue={selected}
                  required
                >
                  <option value="" disabled>
                    {text.chooseProduct}
                  </option>

                  {products.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lp-two-cols">
                <label>
                  {text.format}
                  <select
                    name="format"
                    defaultValue="feed"
                  >
                    <option value="feed">{text.feed}</option>
                    <option value="story">{text.story}</option>
                    <option value="reel">{text.reel}</option>
                  </select>
                </label>

                <label>
                  {text.goal}
                  <select
                    name="goal"
                    defaultValue="sales"
                  >
                    <option value="sales">{text.sales}</option>
                    <option value="awareness">
                      {text.awareness}
                    </option>
                    <option value="launch">{text.launch}</option>
                  </select>
                </label>
              </div>

              <label>
                {text.tone}
                <select
                  name="tone"
                  defaultValue={
                    settings?.tone || "friendly"
                  }
                >
                  <option value="friendly">
                    {text.friendly}
                  </option>
                  <option value="premium">
                    {text.premium}
                  </option>
                  <option value="energetic">
                    {text.energetic}
                  </option>
                  <option value="minimal">
                    {text.minimal}
                  </option>
                </select>
              </label>

              <button
                className="lp-native-button lp-primary"
                type="submit"
                disabled={busy || products.length === 0}
              >
                {busy ? text.generating : text.generate}
              </button>
            </Form>

            {products.length === 0 ? (
              <p className="lp-error">
                {text.chooseFirst}
              </p>
            ) : null}

            {result &&
            "error" in result &&
            result.error ? (
              <p className="lp-error">{result.error}</p>
            ) : null}

            {result &&
            "ok" in result &&
            result.ok &&
            "campaign" in result ? (
              <p className="lp-success-message">
                {text.success}
              </p>
            ) : null}
          </section>

          <section className="lp-panel">
            <div className="lp-panel-header">
              <div>
                <h3 className="lp-panel-title">
                  {text.preview}
                </h3>
                <p className="lp-panel-subtitle">
                  {text.previewHint}
                </p>
              </div>
            </div>

            <CreativePreview
              image={
                generated?.productImage ||
                product?.featuredMedia?.preview?.image?.url
              }
              title={
                generated?.productTitle ||
                product?.title ||
                text.product
              }
              price={
                product?.variants?.nodes?.[0]?.price
                  ? `€${product.variants.nodes[0].price}`
                  : null
              }
              color={
                settings?.primaryColor || "#5B3DF5"
              }
              downloadLabel={text.download}
              tagline={text.discover}
            />
          </section>
        </div>

        {generated ? (
          <section className="lp-panel lp-generated">
            <div className="lp-generated-head">
              <div>
                <p className="lp-eyebrow">
                  {text.source} {generated.source}
                </p>
                <h3>{generated.title}</h3>
              </div>

              <a
                className="lp-native-button lp-primary"
                href="/app/calendar"
              >
                {text.schedule}
              </a>
            </div>

            <div className="lp-page-stack">
              <div>
                <p className="lp-eyebrow">{text.caption}</p>
                <p>{generated.caption}</p>
              </div>

              <div>
                <p className="lp-eyebrow">{text.hashtags}</p>
                <p className="lp-hashtags">
                  {generated.hashtags}
                </p>
              </div>

              <div>
                <p className="lp-eyebrow">
                  {text.callToAction}
                </p>
                <strong>
                  {generated.callToAction}
                </strong>
              </div>
            </div>
          </section>
        ) : null}

        <section className="lp-panel">
          <div className="lp-panel-header">
            <div>
              <h3 className="lp-panel-title">
                {text.recent}
              </h3>
              <p className="lp-panel-subtitle">
                {text.recentHint}
              </p>
            </div>
          </div>

          <div className="lp-campaign-list">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <article
                  className="lp-campaign-row"
                  key={campaign.id}
                >
                  {campaign.productImage ? (
                    <img
                      src={campaign.productImage}
                      alt={
                        campaign.productTitle ??
                        text.imageAlt
                      }
                    />
                  ) : (
                    <div className="lp-row-placeholder">
                      C
                    </div>
                  )}

                  <div>
                    <strong>{campaign.title}</strong>
                    <span>
                      {campaign.productTitle} ·{" "}
                      {new Date(
                        campaign.createdAt,
                      ).toLocaleDateString(
                        currentLanguage,
                      )}
                    </span>
                  </div>

                  <Form method="post">
                    <input
                      type="hidden"
                      name="intent"
                      value="delete"
                    />
                    <input
                      type="hidden"
                      name="id"
                      value={campaign.id}
                    />
                    <button
                      className="lp-link-button"
                      type="submit"
                    >
                      {text.delete}
                    </button>
                  </Form>
                </article>
              ))
            ) : (
              <p className="lp-muted">{text.empty}</p>
            )}
          </div>
        </section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (args) => {
  return boundary.headers(args);
};