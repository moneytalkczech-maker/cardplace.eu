import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "CardPortal <noreply@cardportal.eu>";

function linkify(auctionId: string) {
  return `${process.env.CORS_ORIGIN}/auctions/${auctionId}`;
}

export async function sendOutbidEmail(to: string, username: string, auctionTitle: string, auctionId: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `🔨 Někdo tě přeplatil — "${auctionTitle}"`,
    html: `<p>Ahoj ${username},</p><p>Někdo tě přeplatil v aukci <b>"${auctionTitle}"</b>.</p><p><a href="${linkify(auctionId)}">Přihodit znovu →</a></p>`,
  });
}

export async function sendWonEmail(to: string, username: string, auctionTitle: string, auctionId: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `🎉 Vyhrál jsi aukci — "${auctionTitle}"`,
    html: `<p>Ahoj ${username},</p><p>Vyhrál jsi aukci <b>"${auctionTitle}"</b>!</p><p><a href="${linkify(auctionId)}">Zaplatit →</a></p>`,
  });
}

export async function sendSoldEmail(to: string, username: string, auctionTitle: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `💰 Aukce prodána — "${auctionTitle}"`,
    html: `<p>Ahoj ${username},</p><p>Tvoje aukce <b>"${auctionTitle}"</b> byla prodána.</p>`,
  });
}

export async function sendPaymentReceivedEmail(to: string, username: string, auctionTitle: string, auctionId: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM, to,
    subject: `✅ Platba potvrzena — "${auctionTitle}"`,
    html: `<p>Ahoj ${username},</p><p>Platba za aukci <b>"${auctionTitle}"</b> byla potvrzena.</p><p><a href="${linkify(auctionId)}">Detail →</a></p>`,
  });
}

export async function sendWelcomeEmail(to: string, username: string) {
  if (!resend) return;
  const base = process.env.CORS_ORIGIN || "https://cardportal.eu";
  await resend.emails.send({
    from: FROM, to,
    subject: "Vítej v CardPortal.eu!",
    html: `
      <p>Ahoj ${username},</p>
      <p>Vítej v CardPortal.eu — první CZ/SK platformě pro sběratele trading cards.</p>
      <p>Teď můžeš:</p>
      <ul>
        <li>📸 <a href="${base}/scan">Naskenovat kartu AI skenerem</a></li>
        <li>🔨 <a href="${base}/auctions">Prohlédnout aktivní aukce</a></li>
        <li>➕ <a href="${base}/auctions/create">Vytvořit svoji aukci</a></li>
      </ul>
      <p>Tým CardPortal.eu</p>
    `,
  });
}