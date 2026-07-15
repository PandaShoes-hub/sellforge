import { useRef, useState } from "react";

type Props = {
  image?: string | null;
  title: string;
  price?: string | null;
  color?: string;
  downloadLabel: string;
  tagline: string;
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    const isLastLine = index === maxLines - 1 && words.length > 0;
    const output =
      isLastLine && ctx.measureText(line).width > maxWidth
        ? `${line.slice(0, Math.max(0, line.length - 3))}...`
        : line;

    ctx.fillText(output, x, y + index * lineHeight);
  });
}

async function loadImage(source: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = source;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image failed to load"));
  });

  return image;
}

export default function CreativePreview({
  image,
  title,
  price,
  color = "#5B3DF5",
  downloadLabel,
  tagline,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    const canvas = canvasRef.current;

    if (!canvas || downloading) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    setDownloading(true);

    try {
      canvas.width = 1080;
      canvas.height = 1080;

      const background = ctx.createLinearGradient(0, 0, 1080, 1080);
      background.addColorStop(0, color);
      background.addColorStop(0.62, "#34208a");
      background.addColorStop(1, "#171026");

      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const glow = ctx.createRadialGradient(
        850,
        160,
        20,
        850,
        160,
        420,
      );
      glow.addColorStop(0, "rgba(255,255,255,0.28)");
      glow.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      roundedRect(ctx, 72, 64, 250, 58, 29);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 27px Arial";
      ctx.fillText("SELLFORGE AI", 100, 102);

      ctx.fillStyle = "#ffffff";
      roundedRect(ctx, 70, 150, 940, 650, 42);
      ctx.fill();

      if (image) {
        try {
          const productImage = await loadImage(image);
          const maxWidth = 800;
          const maxHeight = 560;
          const ratio = Math.min(
            maxWidth / productImage.width,
            maxHeight / productImage.height,
          );
          const width = productImage.width * ratio;
          const height = productImage.height * ratio;

          ctx.drawImage(
            productImage,
            (1080 - width) / 2,
            190 + (560 - height) / 2,
            width,
            height,
          );
        } catch {
          ctx.fillStyle = "#f1efff";
          roundedRect(ctx, 300, 300, 480, 300, 28);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.font = "800 96px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            title.slice(0, 1).toUpperCase() || "S",
            540,
            490,
          );
          ctx.textAlign = "start";
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 58px Arial";
      drawWrappedText(ctx, title, 78, 880, 680, 68, 2);

      if (price) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 66px Arial";
        ctx.textAlign = "right";
        ctx.fillText(price, 1002, 930);
        ctx.textAlign = "start";
      }

      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = "500 28px Arial";
      drawWrappedText(ctx, tagline, 78, 1010, 920, 34, 1);

      const link = document.createElement("a");
      const safeTitle =
        title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() || "sellforge-creative";

      link.download = `${safeTitle}-sellforge.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="lp-creative-preview">
      <div
        className="lp-creative-card"
        style={{
          background: `linear-gradient(135deg, ${color}, #20104f)`,
        }}
      >
        <div className="lp-creative-brand">
          <span>SellForge AI</span>
          <strong>IA</strong>
        </div>

        <div className="lp-creative-media">
          {image ? (
            <img src={image} alt={title} />
          ) : (
            <div className="lp-image-placeholder" aria-hidden="true">
              {title.slice(0, 1).toUpperCase() || "S"}
            </div>
          )}
        </div>

        <div className="lp-creative-copy">
          <div>
            <strong>{title}</strong>
            <small>{tagline}</small>
          </div>

          {price ? <span>{price}</span> : null}
        </div>
      </div>

      <canvas ref={canvasRef} hidden />

      <button
        className="lp-native-button lp-primary"
        type="button"
        onClick={download}
        disabled={downloading}
      >
        {downloading ? "A preparar imagem..." : downloadLabel}
      </button>
    </div>
  );
}