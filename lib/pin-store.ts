import fs from 'fs';
import path from 'path';

// ─── Dynamic PIN Storage ─────────────────────────────────────────
// Stores the admin PIN in a JSON file so it can be changed at runtime.
// Falls back to process.env.ADMIN_PIN if the file doesn't exist yet.

const PIN_FILE = path.join(process.cwd(), '.admin-pin.json');

interface PinData {
  pin: string;
  updatedAt: string;
}

/** Read the current admin PIN (file → env fallback) */
export function getAdminPin(): string {
  try {
    if (fs.existsSync(PIN_FILE)) {
      const data: PinData = JSON.parse(fs.readFileSync(PIN_FILE, 'utf-8'));
      if (data.pin && data.pin.length >= 4) return data.pin;
    }
  } catch {
    // Fall through to env
  }
  return process.env.ADMIN_PIN || '123456';
}

/** Update the admin PIN (persists to disk) */
export function setAdminPin(newPin: string): void {
  const data: PinData = {
    pin: newPin,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(PIN_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
