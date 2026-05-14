# PostgreSQL migrační plán

## Proč PostgreSQL?
- **SQLite** – skvělý na vývoj, ale při velkém počtu současných příhozů (zápisy) vznikají zámky na úrovni celé databáze
- **PostgreSQL** – plnohodnotný DB server, podpora `ENUM`, transakční izolace, lepší výkon při zátěži

## 1. Změna Prisma schématu

### 1.1 Datasource
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.2 ENUM typy (PostgreSQL nativní)
`String` pole, která by měla být `enum`:

```prisma
enum UserRole {
  BUYER
  SELLER
  ADMIN
}

enum AuctionStatus {
  ACTIVE
  ENDED
  CANCELLED
}

enum TransactionStatus {
  PENDING
  COMPLETED
  REFUNDED
}

enum WantedStatus {
  ACTIVE
  FULFILLED
}

enum CardCondition {
  NM  // Near Mint
  LP  // Light Played
  MP  // Medium Played
  HP  // Heavy Played
  PO  // Poor
  D   // Damaged
}

enum NotificationType {
  INFO
  BID
  OUTBID
  WON
  CREDIT
  PAYMENT
  NEW_AUCTION
  WANTED
}
```

### 1.3 Použití enum v modelech

```prisma
model User {
  role              UserRole      @default(BUYER)
  // ...ostatní pole beze změny
}

model Auction {
  status            AuctionStatus @default(ACTIVE)
  // ...ostatní pole beze změny
}

model Transaction {
  status            TransactionStatus @default(PENDING)
  // ...ostatní pole beze změny
}

model WantedCard {
  status            WantedStatus  @default(ACTIVE)
  // ...ostatní pole beze změny
}

model CollectionItem {
  condition         CardCondition @default(NM)
  // ...ostatní pole beze změny
}

model Notification {
  type              NotificationType @default(INFO)
  // ...ostatní pole beze změny
}
```

### 1.4 Fulltext index (volitelné)
Pro lepší vyhledávání aukcí:

```prisma
model Auction {
  // ...stávající pole
  @@index([title, description], type: Gin)
}
```

### 1.5 UUID vs CUID
- Aktuálně: `@default(cuid())`
- Pro PostgreSQL: `@default(uuid())` nebo `@default(cuid())` – obojí funguje
- Doporučení: ponechat `cuid()` – kratší, URL-friendly

## 2. Postup migrace

### 2.1 Nainstalovat PostgreSQL
```bash
# Lokálně (Docker)
docker run --name cardbid-pg -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:16

# VPS
apt install postgresql-16
```

### 2.2 Vytvořit databázi
```sql
CREATE DATABASE cardbid;
CREATE USER cardbid WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE cardbid TO cardbid;
```

### 2.3 Upravit .env
```env
# SQLite (dev)
DATABASE_URL="file:./dev.db"

# PostgreSQL (produkce)
DATABASE_URL="postgresql://cardbid:secret@localhost:5432/cardbid"
```

### 2.4 Spustit migraci
```bash
npx prisma migrate dev --name switch_to_postgresql --create-only
# Zkontrolovat vygenerovaný SQL
npx prisma migrate dev
```

### 2.5 Seed dat
```bash
npx tsx src/seed.ts
```

## 3. Nutné úpravy kódu

### 3.1 Kód používající String → ENUM
Všechna porovnání stringů zůstanou funkční, protože Prisma automaticky převádí enum na string v runtime.

```typescript
// Funguje stejně pro String i Enum
if (user.role === "ADMIN") { ... }
if (auction.status === "ACTIVE") { ... }
```

### 3.2 Session backend
Pro PostgreSQL je vhodné použít **PgBouncer** nebo connection pooling:
```env
DATABASE_URL="postgresql://cardbid:secret@localhost:5432/cardbid?connection_limit=10"
```

### 3.3 Migrační skript
```bash
#!/usr/bin/env bash
# deploy s PostgreSQL migrací
cd server
npx prisma migrate deploy
npx tsx src/seed.ts  # jen první nasazení
```

## 4. Testování

```bash
# Nastavit testy na PostgreSQL
export DATABASE_URL="postgresql://cardbid:secret@localhost:5432/cardbid_test"
npx vitest run
```

## 5. Rollback plán

- Prisma migrace je vždy reverzibilní (každá migrace obsahuje `migration.sql` s SQL)
- Pro urgentní rollback:
  ```bash
  npx prisma migrate reset  # smaže data!
  git checkout <předchozí-schema>
  npx prisma migrate dev
  ```
