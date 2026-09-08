import qz from 'qz-tray';

const STORAGE_KEY = 'encanto_printer_name';
const TICKET_WIDTH = 32; // chars per line, safe for 58mm and 80mm thermal paper

const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_ON = GS + '!' + '\x11';
const DOUBLE_OFF = GS + '!' + '\x00';
const CUT = '\n\n\n' + GS + 'V' + '\x00';

let connecting = null;

export function getSavedPrinter() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function savePrinter(name) {
  if (name) localStorage.setItem(STORAGE_KEY, name);
  else localStorage.removeItem(STORAGE_KEY);
}

export function isConnected() {
  return qz.websocket.isActive();
}

export async function ensureConnected() {
  if (qz.websocket.isActive()) return;
  if (!connecting) {
    connecting = qz.websocket.connect().finally(() => { connecting = null; });
  }
  await connecting;
}

export async function listPrinters() {
  await ensureConnected();
  const found = await qz.printers.find();
  return Array.isArray(found) ? found : [found];
}

function line(char = '-') {
  return char.repeat(TICKET_WIDTH) + '\n';
}

function padLine(left, right) {
  const gap = Math.max(1, TICKET_WIDTH - left.length - right.length);
  return left + ' '.repeat(gap) + right + '\n';
}

// lines: [{ name, unitPrice, quantity, references: string[] }]
function buildSaleTicket({ businessName, moduleName, dateLabel, paymentMethod, lines, total }) {
  let t = INIT;
  t += ALIGN_CENTER;
  t += BOLD_ON + DOUBLE_ON + businessName + '\n' + DOUBLE_OFF + BOLD_OFF;
  t += moduleName + '\n';
  t += dateLabel + '\n';
  t += line();
  t += ALIGN_LEFT;
  lines.forEach(l => {
    t += padLine(`${l.quantity}x ${l.name}`, `$${(l.unitPrice * l.quantity).toLocaleString('es-CO')}`);
    t += `  Ref: ${l.references.join(', ')}\n`;
  });
  t += line();
  t += `Pago: ${paymentMethod}\n`;
  t += ALIGN_CENTER;
  t += BOLD_ON + DOUBLE_ON + `$${Number(total).toLocaleString('es-CO')}` + '\n' + DOUBLE_OFF + BOLD_OFF;
  t += '\n';
  t += 'Gracias por su visita\n';
  t += CUT;
  return t;
}

export async function printSaleTicket(sale) {
  await ensureConnected();

  let printerName = getSavedPrinter();
  if (!printerName) {
    printerName = await qz.printers.getDefault();
  }
  if (!printerName) {
    throw new Error('No hay una impresora configurada. Ábrela desde "Impresora" en el encabezado.');
  }

  const config = qz.configs.create(printerName);
  await qz.print(config, [buildSaleTicket(sale)]);
}
