-- Enable FTS5 and create virtual tables for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS auctions_fts USING fts5(
  title, description, content='Auction', content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
  name, content='Card', content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS auctions_ai AFTER INSERT ON Auction BEGIN
  INSERT INTO auctions_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS cards_ai AFTER INSERT ON Card BEGIN
  INSERT INTO cards_fts(rowid, name) VALUES (new.rowid, new.name);
END;
