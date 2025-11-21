-- Membuat tabel categories terlebih dahulu karena tidak ada dependency
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Membuat tabel todos
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menambahkan index untuk pencarian yang lebih cepat (Opsional tapi bagus)
CREATE INDEX idx_todos_title ON todos(title);