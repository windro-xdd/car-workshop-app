# Car Workshop App - Project Instructions

Read this file completely before making any changes. It contains the full project context.

## Overview

Kripa Car Care Workshop management app. Electron desktop app with React frontend, Prisma ORM, and SQLite database. The app manages inventory (items/parts), invoices with GST calculations, reporting/exports, user authentication, and database backups.

- **Stack**: Electron 40 + React 19 + TypeScript + Tailwind CSS 3 + Prisma 5 + SQLite + Zustand
- **Design**: Minimalist corporate SaaS. Blue brand palette (`brand-50` through `brand-700` in tailwind config). Sidebar navigation layout. No emoji anywhere in code or UI.
- **Version**: 1.1.0
- **Packaging**: Electron Forge with webpack plugin, Squirrel.Windows installer

---

## File Structure

```
car-workshop-app/
  package.json
  forge.config.js              # Electron Forge config (packaging, asar, afterCopy hook)
  webpack.main.config.js       # Main process webpack (Prisma externalized)
  webpack.renderer.config.js   # Renderer process webpack
  webpack.rules.js             # Shared webpack rules
  tsconfig.json
  tailwind.config.js           # Custom brand colors defined here
  postcss.config.js
  .env                         # DATABASE_URL="file:./data/workshop.db" (gitignored)
  .gitignore
  prisma/
    schema.prisma              # DB schema (6 models)
    data/
      workshop.db              # SQLite database file (bundled as extraResource)
  src/
    main.ts                    # Electron main process (766 lines) - ALL IPC handlers, DB init, window
    preload.ts                 # IPC bridge via contextBridge (96 lines)
    renderer.tsx               # React entry point (renders App)
    App.tsx                    # Root component - sidebar nav, page routing, auth gate (175 lines)
    index.html                 # HTML shell
    index.css                  # Tailwind imports + custom styles
    types/
      index.ts                 # TypeScript interfaces (User, Item, Invoice, LineItem, GstConfig)
    renderer/
      pages/
        LoginPage.tsx          # Login/Register forms with auth
        InventoryPage.tsx      # Item CRUD + bulk upload
        InvoicePage.tsx        # Invoice creation, list, amendments, PDF preview
        SettingsPage.tsx       # GST config, backup/restore, user management
        ReportingPage.tsx      # Revenue, items, invoice reports with export
      components/
        Alert.tsx              # Alert/notification banner
        AmendmentForm.tsx      # Invoice amendment creation form
        AmendmentList.tsx      # List of amendments for an invoice
        BackupManager.tsx      # Quick backup + Save As + restore + delete
        BulkUploadInventory.tsx # CSV/Excel/JSON bulk item import
        Button.tsx             # Reusable button component
        FormInput.tsx          # Reusable form input with label/error
        InvoiceForm.tsx        # Invoice creation form with line items
        InvoicePDFPreview.tsx  # A4 PDF preview with save/print actions
        InvoiceSummary.tsx     # Invoice detail view with totals
        InvoiceTable.tsx       # Invoice list table with actions
        ItemForm.tsx           # Item create/edit form
        ItemTable.tsx          # Inventory table with search/filter
        LoadingSpinner.tsx     # Loading indicator
        Modal.tsx              # Reusable modal dialog
        ModalProvider.tsx      # Modal context provider
        SearchableSelect.tsx   # Dropdown with search filtering
        Toast.tsx              # Toast notification component
        ToastProvider.tsx      # Toast context provider (uses sonner)
      store/
        userStore.ts           # Zustand store for auth state
        itemStore.ts           # Zustand store for inventory
        invoiceStore.ts        # Zustand store for invoices
      utils/
        pdfGenerator.ts        # PDFKit-based invoice PDF generation
        reportExport.ts        # CSV, Excel (xlsx), PDF report exports
        invoiceUtils.ts        # Invoice number generation, calculation helpers
      hooks/                   # Custom React hooks (if any)
      styles/                  # Additional styles (if any)
  .github/
    workflows/
      release.yml              # Windows build CI - triggers on release publish
      ci.yml                   # General CI pipeline
  tests/                       # Test files
  scripts/                     # Debug/utility scripts (DO NOT commit)
```

---

## Database

### Schema (prisma/schema.prisma)

Provider: SQLite. 6 models:

**User** (`users` table)
- id (cuid), email (unique), password (bcrypt hash), name, role (admin/manager/staff), isActive, createdAt, updatedAt
- Has many: Invoice

**Item** (`items` table)
- id (cuid), code (unique), name, category, unitPrice (Float), createdAt, updatedAt
- Has many: LineItem

**Invoice** (`invoices` table)
- id (cuid), invoiceNumber (unique), invoiceDate, customerName, customerPhone?, customerEmail?
- grossAmount, gstAmount, netTotal, gstPercentage (default 18.0)
- status (Draft/Final/Cancelled), isAmendment, originalInvoiceId?, notes?
- userId (FK -> User)
- Has many: LineItem

**LineItem** (`line_items` table)
- id (cuid), invoiceId (FK -> Invoice, CASCADE delete), itemId (FK -> Item), quantity, unitPrice, lineTotal

**GstConfig** (`gst_config` table)
- id (cuid), rate (default 18.0), isActive

**Backup** (`backups` table)
- id (cuid), filePath, size (Int), createdAt

### DATABASE_URL

The `.env` file (gitignored) must contain:
```
DATABASE_URL="file:./data/workshop.db"
```
This is relative to `prisma/schema.prisma`, so the actual file is `prisma/data/workshop.db`.

---

## Database Path Resolution (CRITICAL for packaged app)

The app uses different DB paths depending on whether it is running in dev or packaged mode. This is in `src/main.ts`:

```typescript
function getDbPath(): string {
  if (app.isPackaged) {
    // Packaged: writable location outside the asar
    return path.join(app.getPath('userData'), 'workshop.db');
  }
  // Dev: project root
  return path.join(app.getAppPath(), 'prisma', 'data', 'workshop.db');
}

function getSeedDbPath(): string {
  return path.join(process.resourcesPath, 'workshop.db');
}

function ensureDatabase(): void {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    if (app.isPackaged) {
      // Copy seed DB from extraResource to userData
      const seedPath = getSeedDbPath();
      if (fs.existsSync(seedPath)) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.copyFileSync(seedPath, dbPath);
      }
    } else {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
  }
}
```

**Key points:**
- `app.getAppPath()` in packaged mode points INSIDE the `.asar` archive (read-only). NEVER write there.
- `app.getPath('userData')` is writable: `C:\Users\<user>\AppData\Roaming\car-workshop-app\` on Windows.
- `process.resourcesPath` is where `extraResource` files are placed by Electron Forge.
- On first launch, the seed DB is copied from resources to userData.

The PrismaClient is initialized with an explicit datasource URL:
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${getDbPath()}`,
    },
  },
});
```

---

## Prisma Bundling (CRITICAL for packaged app)

Prisma's native query engine (`.node` file) cannot be bundled inside an asar. The solution has 4 parts:

### 1. Webpack externalization (webpack.main.config.js)
```javascript
externals: {
  '@prisma/client': 'commonjs @prisma/client',
}
```
This makes webpack emit `require('@prisma/client')` instead of bundling it.

### 2. afterCopy hook (forge.config.js)
The `copyPrismaModules` function copies two directories from `node_modules` into the packaged app:
- `@prisma/client` -- the public API package
- `.prisma/client` -- the generated client + native query engine binary (`.node` file)

These get copied to `{buildPath}/node_modules/`. The webpack bundle at `.webpack/main/index.js` does `require('@prisma/client')`, and Node's module resolution walks up to find it.

### 3. Asar unpack (forge.config.js)
```javascript
asar: {
  unpack: '**/*.node',
}
```
This extracts all `.node` native binaries from the asar so they can be loaded by `dlopen`.

### 4. Fuses (forge.config.js)
```javascript
EnableEmbeddedAsarIntegrityValidation: false,
OnlyLoadAppFromAsar: false,
```
These must be `false` for the unpacked native modules to load.

### If "Cannot find module '@prisma/client'" occurs:
1. Verify `node_modules/@prisma/client` and `node_modules/.prisma/client` exist (run `npx prisma generate`)
2. Check that `copyPrismaModules` in `forge.config.js` runs without errors during `npm run make`
3. The `require()` path: `.webpack/main/index.js` -> walks up -> `node_modules/@prisma/client`
4. Make sure the platform-specific query engine exists in `.prisma/client/` (e.g., `query_engine-windows.dll.node` for Windows)

---

## IPC Channels

All communication between renderer and main process goes through IPC. Here is every channel:

| Channel | Direction | Description |
|---------|-----------|-------------|
| `get-items` | renderer -> main | Fetch all inventory items |
| `create-item` | renderer -> main | Create new item (code, name, category, unitPrice) |
| `update-item` | renderer -> main | Update existing item by id |
| `delete-item` | renderer -> main | Delete item (checks LineItem usage first) |
| `bulk-import-items` | renderer -> main | Bulk import items from parsed file data |
| `get-invoices` | renderer -> main | Fetch all invoices with lineItems |
| `create-invoice` | renderer -> main | Create invoice with line items |
| `delete-invoice` | renderer -> main | Delete invoice (deletes lineItems first) |
| `create-amendment` | renderer -> main | Create amendment invoice linked to original |
| `list-amendments-for-invoice` | renderer -> main | Get all amendments for an invoice |
| `get-gst-config` | renderer -> main | Get current GST configuration |
| `update-gst-config` | renderer -> main | Update or create GST config (upsert) |
| `generate-invoice-pdf` | renderer -> main | Generate PDF and save to Documents |
| `save-invoice-pdf` | renderer -> main | Generate PDF with Save As dialog |
| `print-invoice-pdf` | renderer -> main | Generate PDF, save, then print |
| `create-backup` | renderer -> main | Create DB backup (quick or custom location) |
| `list-backups` | renderer -> main | List all backups in Documents/Workshop Backups |
| `restore-backup` | renderer -> main | Restore DB from backup file (disconnect/reconnect Prisma) |
| `delete-backup` | renderer -> main | Delete a backup file |
| `register-user` | renderer -> main | Register new user (bcrypt hash password) |
| `login-user` | renderer -> main | Login with email/password |
| `get-users` | renderer -> main | List all users (excludes password) |

Every handler returns `{ success: boolean, data?: T, error?: string }`.

---

## State Management

Uses Zustand stores in `src/renderer/store/`:

- **userStore.ts**: `currentUser`, `isAuthenticated`, `login()`, `logout()`, `register()`
- **itemStore.ts**: `items`, `fetchItems()`, `createItem()`, `updateItem()`, `deleteItem()`
- **invoiceStore.ts**: `invoices`, `fetchInvoices()`, `createInvoice()`, `deleteInvoice()`

All stores call `window.electronAPI.*` methods which invoke IPC channels.

---

## Authentication

- Local auth only (bcrypt via `bcryptjs` package)
- Login page shown when `!isAuthenticated` in App.tsx
- No session tokens -- state is in Zustand (resets on app restart, user must login again)
- New installs have NO users -- must register first
- Passwords hashed with `bcrypt.hash(password, 10)`

---

## TypeScript Types (src/types/index.ts)

```typescript
interface User {
  id: string; email: string; name: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean; createdAt: Date; updatedAt: Date;
}

interface CreateUserInput { email: string; password: string; name: string; role?: 'admin' | 'manager' | 'staff'; }
interface LoginInput { email: string; password: string; }

interface Item {
  id: string; code: string; name: string; category: string;
  unitPrice: number; createdAt: Date; updatedAt: Date;
}

interface CreateItemInput { code: string; name: string; category: string; unitPrice: number; }
interface UpdateItemInput { id: string; code?: string; name?: string; category?: string; unitPrice?: number; }

interface Invoice {
  id: string; invoiceNumber: string; invoiceDate: Date;
  customerName: string; customerPhone?: string | null; customerEmail?: string | null;
  grossAmount: number; gstAmount: number; netTotal: number; gstPercentage: number;
  status: 'Draft' | 'Final' | 'Cancelled';
  isAmendment: boolean; originalInvoiceId?: string; notes?: string;
  userId: string; lineItems?: LineItem[];
  createdAt: Date; updatedAt: Date;
}

interface LineItem {
  id: string; invoiceId: string; itemId: string;
  quantity: number; unitPrice: number; lineTotal: number;
}

interface GstConfig { id: string; rate: number; isActive: boolean; }
```

---

## PDF Generation

Uses PDFKit (not browser-based). Generated in main process via `src/renderer/utils/pdfGenerator.ts`.

- `generateInvoicePDF(invoice, items)` returns a Buffer
- `savePDFToFile(buffer, filePath)` writes to disk
- Printing on Windows uses: `powershell -Command Start-Process -FilePath "path" -Verb Print`

---

## Report Exports

`src/renderer/utils/reportExport.ts` handles multi-format exports:
- CSV (via papaparse)
- Excel (via xlsx library)
- PDF (via PDFKit)

---

## Build & Run

### Development
```bash
# 1. Create .env file
echo 'DATABASE_URL="file:./data/workshop.db"' > .env

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Create/migrate database
npx prisma db push

# 5. Start dev server
npm start
```
Dev server runs on port 3001 (webpack dev server for renderer).

### Package for Windows
```bash
npx prisma generate
npx prisma db push       # Ensure seed DB exists at prisma/data/workshop.db
npm run make
```
Output: `out/make/squirrel.windows/x64/car-workshop-app-{version}.Setup.exe`

### CI/CD (`.github/workflows/release.yml`)
Triggers on GitHub release publish. Runs on `windows-latest`:
1. Checkout code
2. Setup Node.js 20
3. `npm ci`
4. `npx prisma generate`
5. `npx prisma db push` (creates seed DB)
6. `npm run make`
7. Upload `.exe` and `.nupkg` to release

---

## Electron Window Configuration

```typescript
mainWindow = new BrowserWindow({
  width: 1200, height: 800,
  autoHideMenuBar: true,
  webPreferences: {
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    contextIsolation: true,
    sandbox: true,
  },
});
Menu.setApplicationMenu(null);  // No native menu bar
```

### Squirrel Startup
The Windows installer uses Squirrel. This check MUST remain near the top of main.ts:
```typescript
if (require('electron-squirrel-startup')) {
  app.quit();
}
```
It handles install/uninstall/update events silently.

---

## Known Issues & Solutions

### 1. "Cannot find module '@prisma/client'" in packaged app
See "Prisma Bundling" section above. The afterCopy hook must successfully copy both `@prisma/client` and `.prisma/client` into the packaged app's node_modules.

### 2. Foreign key constraint when deleting items
Items used in invoices cannot be deleted. The `delete-item` handler checks `prisma.lineItem.count({ where: { itemId } })` first and returns a descriptive error if count > 0.

### 3. Backup ENOENT error
Backups use `getDbPath()` to find the source DB. If the path is wrong (e.g., pointing inside the asar), it will fail. Always use the dynamic `getDbPath()` function.

### 4. Restore disconnects Prisma
Restoring a backup replaces the DB file. The handler calls `prisma.$disconnect()` before replacing, then `prisma.$connect()` after. Without this, Prisma holds a lock on the old file.

### 5. App data location on Windows
Packaged app data (including the DB) lives at:
`C:\Users\<username>\AppData\Roaming\car-workshop-app\workshop.db`

### 6. Do NOT use @timfish/forge-externals-plugin
This plugin is incompatible with Electron Forge v7.11.x. It crashes with `existingIgnoreFn is not a function`. The afterCopy hook approach in forge.config.js replaces it.

---

## Dependencies (key ones)

### Runtime
- `@prisma/client` + `prisma` -- ORM with SQLite
- `bcryptjs` -- Password hashing (pure JS, no native build needed)
- `electron-squirrel-startup` -- Windows installer events
- `pdfkit` -- PDF generation
- `pdfjs-dist` -- PDF rendering in preview
- `papaparse` -- CSV parsing
- `xlsx` -- Excel file reading/writing
- `react` + `react-dom` -- UI framework
- `react-hook-form` -- Form handling
- `react-datepicker` -- Date picker component
- `sonner` -- Toast notifications
- `zustand` -- State management
- `zod` -- Schema validation
- `@tanstack/react-table` -- Table component
- `dotenv` -- Environment variable loading

### Dev
- `electron` 40.6.0
- `@electron-forge/*` -- Packaging toolchain
- `typescript`, `ts-loader` -- TypeScript compilation
- `tailwindcss`, `postcss`, `autoprefixer` -- CSS
- `jest`, `ts-jest`, `@testing-library/react` -- Testing

---

## Rules

- Do NOT use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Do NOT add emoji to code or UI text
- Do NOT re-add the native Electron menu bar
- Do NOT open DevTools in production (`mainWindow.webContents.openDevTools()`)
- Do NOT write mutable data inside `app.getAppPath()` -- it is read-only in packaged mode
- Do NOT delete the `electron-squirrel-startup` check
- Do NOT commit the `scripts/` directory
- Do NOT commit `.env` files
- Do NOT install `@timfish/forge-externals-plugin` -- it is incompatible

---

## Git

- **Branch**: `dev`
- **Remote**: `origin` -> `https://github.com/windro-xdd/car-workshop-app.git`
- **Current version**: 1.1.0
- **Release**: https://github.com/windro-xdd/car-workshop-app/releases/tag/v1.1.0
