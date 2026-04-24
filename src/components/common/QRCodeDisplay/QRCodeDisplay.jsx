import { QRCodeSVG } from "qrcode.react";
import "./QRCodeDisplay.css";

/**
 * Componente QRCodeDisplay
 * Renderiza QR Code SVG localmente via qrcode.react
 * Reutilizável, sem dependência de API externa
 * 
 * @param {Object} props
 * @param {string} props.url - Conteúdo a codificar (URL, código PIX, etc.)
 * @param {number} props.tamanho - Tamanho em px (padrão: 200)
 * @param {boolean} props.exibirUrl - Mostrar URL abaixo do QR (padrão: false)
 * @param {string} props.titulo - Título acima do QR (opcional)
 */
export default function QRCodeDisplay({ url, tamanho = 200, exibirUrl = false, titulo = null }) {
  if (!url) return null;
  
  return (
    <div className="qr-display-container">
      {titulo && <p className="qr-titulo">{titulo}</p>}
      <div className="qr-wrapper">
        <QRCodeSVG
          value={url}
          size={tamanho}
          bgColor="#111111"
          fgColor="#c9a84c"
          level="M"
          includeMargin={true}
        />
      </div>
      {exibirUrl && (
        <p className="qr-url" title={url}>
          {url.length > 50 ? `${url.substring(0, 47)}...` : url}
        </p>
      )}
    </div>
  );
}
