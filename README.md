# 🚗 Kripa Car Care Workshop Management System

A production-ready, desktop-based workshop invoice and reporting management system built with Electron, React, TypeScript, and SQLite.

## 📋 Features

### Phase 1: Item Inventory Management ✅
- **Add, Edit, Delete Items** - Manage workshop inventory with code, name, category, and unit price
- **Item Categories** - Organize services (e.g., General Service, Oil Change, Repair)
- **Real-time Database** - SQLite database with Prisma ORM for reliable data persistence
- **Type-Safe Codebase** - Full TypeScript support with strict mode enabled

### Phase 2: Invoice Generation (Upcoming)
- Customer information management
- Line item selection from inventory
- Automatic GST calculation (configurable percentage)
- Invoice numbering (Format: INV-YYYY/MMD0-XXX)
- Save and retrieve invoices

### Phase 3: PDF Export (Upcoming)
- Professional PDF generation
- Invoice templates with company branding
- PDF preview in application

### Phase 4: Amendments & Backup (Upcoming)
- Invoice amendment workflow
- Data backup/restore functionality

### Phase 5: Daily Reports (Upcoming)
- Financial reporting by date range
- Daily cumulative totals
- Report export (CSV, PDF)

## 🛠️ Tech Stack

**100% Free & Open Source**

| Layer | Technology | Version |
|-------|-----------|---------|
| **Desktop Framework** | Electron | 27+ |
| **UI Framework** | React | 18.2.0 |
| **Language** | TypeScript | 5.3.0 |
| **Styling** | Tailwind CSS | 3.3.6 |
| **State Management** | Zustand | Latest |
| **Database** | SQLite | Latest |
| **ORM** | Prisma | 5.6.0 |
| **Build Tool** | Webpack | 5+ |
| **Development** | Node.js | 18+ |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/windro-xdd/car-workshop-app.git
cd car-workshop-app

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run package
```

### Development

Start the development server with hot reload:
```bash
npm start
```

This starts:
- Webpack dev server on `http://localhost:3001`
- Electron application window
- Hot reload on file changes

### Building

Create a packaged executable:
```bash
npm run package
```

Output: `./out/car-workshop-app-linux-x64/` (or your platform)

## 📁 Project Structure

```
car-workshop-app/
├── src/
│   ├── main.ts                    # Electron main process & IPC handlers
│   ├── renderer.tsx               # React entry point
│   ├── preload.ts                 # IPC security bridge
│   ├── renderer/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   └── store/                 # Zustand state management
│   └── types/                     # TypeScript type definitions
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── data/workshop.db           # SQLite database
│   └── migrations/                # Database migrations
├── .github/workflows/
│   └── ci.yml                     # GitHub Actions CI/CD
├── webpack.*.config.js            # Webpack configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── package.json                   # Dependencies
```

## 🗄️ Database Schema

### Models

**Item**
- `id`: Unique identifier
- `code`: Item code (unique)
- `name`: Item name
- `category`: Service category
- `unitPrice`: Price per unit

**Invoice**
- `id`: Invoice ID
- `invoiceNumber`: Format INV-YYYY/MMD0-XXX
- `customerName`: Customer name
- `customerPhone`: Phone number
- `customerAddress`: Address
- `gstAmount`: Calculated GST
- `totalAmount`: Invoice total
- `status`: Draft, Final, Amended
- `createdAt`: Creation timestamp

**LineItem**
- `invoiceId`: Reference to Invoice
- `itemId`: Reference to Item
- `quantity`: Quantity ordered
- `unitPrice`: Price per unit
- `lineTotal`: quantity × unitPrice

**GstConfig**
- `rate`: GST percentage (default 18%)
- `isActive`: Whether GST is applied

**Backup**
- `filePath`: Path to backup file
- `size`: Backup size in bytes
- `createdAt`: Backup timestamp

## 🔌 IPC Handlers (Electron Main Process)

### Item Management
```typescript
// Get all items
window.electronAPI.getItems() → { success: boolean, data: Item[] }

// Create item
window.electronAPI.createItem(input) → { success: boolean, data: Item }

// Update item
window.electronAPI.updateItem(input) → { success: boolean, data: Item }

// Delete item
window.electronAPI.deleteItem(id) → { success: boolean }
```

## 📦 Git Workflow

### Branch Strategy

- **main** - Legacy (legacy initial commit)
- **dev** - Development branch (base for all feature work)
- **prod** - Production branch (requires PR from dev)
- **feat/*** - Feature branches (e.g., `feat/invoice-generation`)
- **fix/*** - Bug fix branches (e.g., `fix/gst-calculation`)

### Branch Protection Rules

✅ **prod** branch:
- Requires 1 PR approval
- No force push allowed
- No deletion allowed

✅ **dev** branch:
- Requires 1 PR approval
- No force push allowed
- No deletion allowed

### Workflow

1. Create feature branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature
   ```

2. Commit with conventional commits:
   ```bash
   git commit -m "feat: add invoice generation"
   git commit -m "fix: correct GST calculation"
   git commit -m "chore: update dependencies"
   ```

3. Push and create PR to `dev`:
   ```bash
   git push origin feat/your-feature
   # Create PR on GitHub from feat/your-feature → dev
   ```

4. Once merged to `dev`, create PR to `prod`:
   ```bash
   # Create PR on GitHub from dev → prod
   ```

## 🔄 CI/CD Pipeline

GitHub Actions runs on every push and PR:

### Jobs

1. **build-and-test** (Node 18.x, 20.x)
   - Install dependencies
   - Generate Prisma client
   - Build application
   - Run linting & tests
   - Upload artifacts

2. **code-quality**
   - TypeScript type checking
   - Code formatting check

3. **deploy-to-prod** (runs on prod push)
   - Build for production
   - Create release artifacts

## 🛡️ Type Safety

- **TypeScript strict mode** enabled
- **No type suppression** (`as any`, `@ts-ignore` forbidden)
- **Full type coverage** for all modules
- **Electron IPC** fully typed with `contextBridge`

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
chore: routine tasks (deps, config)
ci: CI/CD changes
docs: documentation updates
test: add or update tests
```

Example:
```
feat: implement invoice generation with GST calculation

- Added InvoicePage component
- Implemented invoice IPC handlers
- Created invoice number formatter
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m "feat: description"`
4. Push to branch: `git push origin feat/my-feature`
5. Create PR on GitHub

## 📄 License

Open Source. See LICENSE file for details.

## 🚗 About Kripa Car Care

Kripa Car Care is a professional automotive workshop management system designed to streamline operations with:
- Professional invoice generation
- Real-time inventory tracking
- Daily financial reporting
- Offline-first architecture (no cloud dependency)

---

**Repository**: https://github.com/windro-xdd/car-workshop-app
**Issues**: https://github.com/windro-xdd/car-workshop-app/issues
