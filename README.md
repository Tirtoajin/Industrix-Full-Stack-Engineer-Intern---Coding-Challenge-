<div align="center">

# Todo App

</div>

## Project overview
Aplikasi Todo List Full Stack yang dibangun untuk Coding Challenge Full Stack Intern Industrix. Proyek ini menunjukkan arsitektur yang scalable menggunakan Go, React, dan PostgreSQL, dengan fitur kategori dinamis, prioritas, pencarian, pagination, dan UI responsif.

### Fitur Utama
- CRUD Tugas (Create, Read, Update, Delete)
- Manajemen Kategori Dinamis
- Prioritas Tugas (High, Medium, Low)
- Pencarian dan Pagination (Server-Side)
- Desain Responsif (Desktop, Tablet, Mobile)
- Validasi Dua Lapis (Frontend dan Backend)

### Tech Stack
-	**Frontend:** React (Vite), Ant Design, Context API, Axios.
-	**Backend:** Go (Golang), Gin Web Framework, GORM (ORM).
-	**Database:** PostgreSQL (Produksi), SQLite (Testing).

---

## Step-by-step setup and installation instructions 
Ikuti langkah-langkah ini untuk menjalankan proyek secara lokal. Diasumsikan sudah menginstal Go, Node.js, dan PostgreSQL.
### 1. Setup Database
1.  Buka PostgreSQL (pgAdmin atau CLI).
2.	Buat database baru bernama: todo_industrix.
3.	Tidak perlu membuat tabel secara manual; backend akan melakukan migrasi otomatis.

### 2. Setup Backend
```
cd backend
# 1. Install dependencies
go mod tidy
# 2. Jalankan server
go run main.go
```
Server akan berjalan di http://localhost:8080

### 3. Setup Frontend
Buka terminal baru:
```
cd frontend
# 1. Install dependencies
npm install
# 2. Jalankan aplikasi
npm run dev
```
Aplikasi akan terbuka di http://localhost:5173

---

### 4. Menjalankan Unit Test
Proyek ini mencakup unit test backend yang komprehensif menggunakan database in-memory SQLite.
```
cd backend
go test -v
```

---
## Dokumentasi API

### 1. Todos
| Method | Endpoint        | Deskripsi                                               |
|--------|-----------------|-----------------------------------------------------------|
| GET    | /api/todos      | Ambil daftar tugas (pagination + search)                 |
| POST   | /api/todos      | Buat tugas baru                                          |
| PUT    | /api/todos/:id  | Update tugas                                             |
| DELETE | /api/todos/:id  | Hapus tugas                                              |

**Contoh Request (POST /api/todos)**
```
{
  "title": "Selesaikan Coding Challenge",
  "description": "Selesaikan dokumentasi hari ini",
  "category": "Work",
  "priority": "high"
}
```
### 2. Categories
| Method | Endpoint             | Deskripsi                    |
|--------|----------------------|------------------------------|
| GET    | /api/categories      | Ambil semua kategori         |
| POST   | /api/categories      | Tambah kategori baru         |
| DELETE | /api/categories/:id  | Hapus kategori               |

---

##  Brief explanation of technical decisions
### Desain Database
Saya memilih struktur relasional dengan dua tabel utama:
-	todos: Menyimpan data tugas, termasuk prioritas dan timestamp. Diindeks pada id (default) untuk pencarian cepat.
-	categories: Dipisahkan ke tabel tersendiri untuk memungkinkan manajemen dinamis (CRUD) tanpa mengubah skema tabel utama.
-	Pagination: Ditangani secara efisien melalui SQL LIMIT dan OFFSET untuk mengurangi beban server.

### Arsitektur Backend
-	Go + Gin + GORM: Dipilih karena performa tinggi, keamanan tipe data (type safety), dan pengembangan yang cepat.
-	Struktur Berbasis Handler: Menjaga logika tetap sederhana dan mudah dibaca dalam satu file untuk lingkup tantangan ini, sambil tetap memisahkan Model dan Handler.
-	Testing: Menggunakan glebarez/sqlite (Pure Go) untuk unit test guna memastikan kompatibilitas lintas platform (Windows/Mac/Linux) tanpa memerlukan CGO.
  
### Arsitektur Frontend
-	Context API: Digunakan untuk manajemen state global (todos, categories) guna menghindari prop-drilling dan menjaga basis kode tetap bersih.
-	Ant Design: Dimanfaatkan untuk sistem grid dan komponen siap pakai (Table, Modal) untuk memastikan UI yang konsisten dan responsif di berbagai perangkat.


---
<div align="center">
  
# **Technical Questions**

</div>


# 📌Database Design Questions
## 1.What database tables did you create and why?
Tabel todos dan categories, tujuannya adalah membuat dua tabel utama untuk mendukung fungsionalitas aplikasi ini

### ○ Describe each table and its purpose 
#### A. Tabel todos
Ini adalah tabel inti yang menyimpan data tugas.

Kolom & Tujuan:

| Kolom       | Tipe Data           | Deskripsi |
|-------------|----------------------|-----------|
| id          | Integer (PK)         | Pengenal unik untuk setiap tugas |
| title       | String/Varchar       | Menyimpan judul tugas |
| description | Text                 | Detail atau catatan tambahan |
| completed   | Boolean              | Status penyelesaian (true/false) |
| category    | String/Varchar       | Nama kategori terkait tugas (sementara masih string) |
| priority    | String/Varchar       | Prioritas tugas (high, medium, low) |
| created_at  | Timestamp            | Waktu pembuatan tugas |
| updated_at  | Timestamp            | Waktu terakhir tugas diubah |


#### B. Tabel categories
Tabel ini digunakan untuk mengelola daftar kategori secara dinamis.

| Kolom | Tipe Data           | Deskripsi |
|-------|----------------------|-----------|
| id    | Integer (PK)         | Pengenal unik kategori |
| name  | String/Varchar       | Nama kategori (misal: Work, Personal, Shopping) |

### ○ Explain the relationships between tables 
Hubungan antara tabel todos dan categories bersifat One-to-Many (Satu ke Banyak).Satu kategori (misalnya "Work") dapat memiliki banyak tugas (todos). Sebaliknya, satu tugas hanya memiliki satu kategori utama.

### ○ Why did you choose this structure? 
1. Sederhana cepat: Struktur ini sangat efisien untuk aplikasi skala kecil hingga menengah. 
2. Fleksibilitas:  Memisahkan categories ke tabel sendiri memungkinkan pengguna menambah, mengedit, atau menghapus kategori secara dinamis tanpa perlu mengubah struktur tabel utama.

## 2.How did you handle pagination and filtering in the database?

Saya menangani pagination dan filtering langsung di level query database menggunakan GORM, bukan memfilter array di memori aplikasi.

### ○ What queries did you write for filtering and sorting?

#### Filtering 
Saya menggunakan klausa WHERE dengan operator ILIKE (PostgreSQL) untuk pencarian teks yang case-insensitive (tidak peduli huruf besar/kecil).

- **GORM Code**  
  query = query.Where("title ILIKE ?", "%"+search+"%")

- **SQL Equivalen**  
  SELECT * FROM todos WHERE title ILIKE '%kata_kunci%';

#### Sorting (Pengurutan)
Saya mengurutkan data berdasarkan:
1. Status penyelesaian (completed): tugas yang belum selesai ditampilkan di atas  
2. created_at: tugas terbaru muncul lebih dulu

- **GORM Code**  
  query.Order("completed asc, created_at desc")

- **SQL Equivalen**  
  ORDER BY completed ASC, created_at DESC;

### ○ How do you handle pagination efficiently? 
Saya menggunakan teknik **Offset-based Pagination** standar SQL.

1. **Limit** → jumlah item per halaman (contoh: 10)
2. **Offset** → data yang dilewati berdasarkan halaman  
   Rumus:  
   offset = (page - 1) * limit

- **GORM Code**  
  query.Offset(offset).Limit(limit).Find(&todos)

- **SQL Equivalen**  
  SELECT * FROM todos LIMIT 10 OFFSET 20;  
  (contoh untuk halaman 3)


### ○ What indexes (if any) did you add and why?
Menggunakan default, database sudah menyediakan index untuk **Primary Key (id)**.

#### Rekomendasi Index Tambahan
Saya menambahkan index pada kolom **title** untuk optimasi pencarian.

- **SQL**  
  CREATE INDEX idx_todos_title ON todos(title);

- **Alasan**  
  Karena fitur pencarian sering menggunakan kolom title, index ini menghindari full table scan dan mempercepat query secara signifikan terutama jika data bertambah besar.

---

# 📌Technical Decision Questions 

## 1.How did you implement responsive design?

Saya menerapkan desain responsif menggunakan sistem grid dari Ant Design (komponen Row dan Col) serta properti Layout yang fleksibel.

### ○ What breakpoints did you use and why? 
- xs < 576px (HP) (Extra Small, <576px): Digunakan untuk perangkat seluler (HP).
- md ≥ 768px (Tablet) (Medium, ≥768px): Digunakan untuk tablet.
- lg ≥ 992px (Desktop) (Large, ≥992px): Digunakan untuk desktop/laptop.

### ○ How does the UI adapt on different screen sizes? 
- Mobile (xs): Konten mengambil lebar penuh (100%) agar mudah dibaca.
- Desktop (lg): Konten dipusatkan dengan lebar terbatas agar tetap fokus.

### ○ Which Ant Design components helped with responsiveness? 
- Grid System (Row, Col): Untuk mengatur tata letak kolom yang fleksibel.
- Layout, Header, Content: Untuk struktur dasar halaman yang responsif.
- Card: Sebagai wadah konten yang rapi dan adaptif.
- Table: Yang secara otomatis menangani overflow data dengan scrollbar jika diperlukan.


## 2.How did you structure your React components? 

Saya menggunakan pendekatan Context-Provider Pattern untuk memisahkan logic dari tampilan UI.

### ○ Explain your component hierarchy 
- **App (Root):** Komponen paling luar yang berfungsi sebagai titik masuk aplikasi. Tugas utamanya adalah membungkus seluruh aplikasi dengan TodoProvider.
- **TodoProvider (Logic Layer):** Komponen "pembungkus" yang menyimpan semua state global (todos, categories, loading) dan logika fungsi (fetchData, saveTodo, deleteTodo).
- **TodoAppContent (UI):** Komponen child yang berisi elemen-elemen visual seperti Table, Modal, dan Button. Komponen ini tidak memiliki state data sendiri tapi mengambil data dan fungsi yang dibutuhkan dari TodoProvider.

### ○ How did you manage state between components? 
- membuat sebuah Context bernama TodoContext sebagai wadah global.
- Semua data penting disimpan di dalam TodoProvider dan disediakan melalui properti value.
- Komponen UI (TodoAppContent) cukup memanggil useContext(TodoContext) untuk mengakses data atau fungsi tersebut secara langsung.

### ○ How did you handle the filtering and pagination state?
- **Pagination:** State pagination disimpan di dalam TodoProvider (berisi informasi halaman saat ini, jumlah item per halaman, dan total data). Saat pengguna berpindah halaman di tabel, fungsi fetchTodos dipanggil dengan parameter halaman baru, lalu state pagination diperbarui berdasarkan data terbaru dari backend.
- **Filtering (Pencarian):** State searchText disimpan di komponen UI (TodoAppContent) karena bersifat lokal untuk input pencarian. Saat pengguna mengetik, fungsi fetchTodos dipanggil dengan parameter search, yang kemudian dikirim ke backend untuk menyaring data yang ditampilkan.

## 3. What backend architecture did you choose and why?
Menggunakan Monolitic RESTful API dengan Go (Golang), Gin, dan GORM.

### ○ How did you organize your API routes? 
Rute API (dikelompokkan dengan r.Group("/api")):
- /api/todos (CRUD Tugas)
- /api/categories (CRUD Kategori)

### ○ How did you structure your code (controllers, services, etc.)? 
menerapkan Handler-based Structure yang disederhanakan dalam satu file main.go.
- Menggunakan pendekatan handler-based dalam satu file main.go
- **Model:** Definisi struct (Todo, Category) diletakkan di bagian atas file.
- **Config dan Setup:** Koneksi database dan inisialisasi router berada di dalam fungsi main().
- **Handlers:** Fungsi-fungsi logika bisnis (seperti createTodo, getTodos) dipisahkan di bagian bawah sebagai handler untuk setiap rute.

### ○ What error handling approach did you implement? 
menerapkan penanganan error yang konsisten dengan mengembalikan respons JSON standar.
- Setiap operasi database (seperti db.Create, db.First) selalu diikuti dengan pengecekan error (if err != nil).
- Jika terjadi error (misalnya data tidak ditemukan atau input JSON tidak valid), server akan segera merespons dengan kode status HTTP yang sesuai (400 Bad Request, 404 Not Found, 500 Internal Server Error) dan pesan error yang jelas dalam format JSON ({"error": "pesan error"}).


## 4. How did you handle data validation? 

Menggunakan strategi validasi dua lapis (frontend dan backend).
### ○ Where do you validate data (frontend, backend, or both)? 
- Frontend
- Backend

### ○ What validation rules did you implement? 
- Frontend: Required pada input form (contoh: judul wajib diisi)
- Backend: Validasi JSON menggunakan struct tags dan default logic (contoh: prioritas default "medium" jika kosong)

### ○ Why did you choose this approach? 
Pendekatan dua lapis menjaga kenyamanan pengguna sekaligus memastikan database tetap aman dari data tidak valid jika API diakses langsung.

---

# 📌Testing & Quality Questions 
## 1. What did you choose to unit test and why? 
Melakukan unit test pada Handler Backend (createTodo, getTodos, deleteTodo). Karena handler adalah logika dari aplikasi. Memastikan handler menerima input JSON dengan benar, memprosesnya, dan mengembalikan respons HTTP.

### ○ Which functions/methods have tests? 
-	TestGetTodos: Memastikan API bisa mengambil daftar tugas dengan status 200 OK.
-	TestCreateTodo: Memastikan data JSON yang dikirim berhasil disimpan dan dikembalikan dengan benar.
-	TestDeleteTodo: Memastikan fungsi penghapusan data berjalan tanpa error.

### ○ What edge cases did you consider? 
-	Data Valid: Mengirim JSON lengkap dan benar.
-	Database Kosong: Memastikan GET tidak error meskipun belum ada data (harus merespons array kosong, bukan null atau 500).
-	Koneksi Database: Menggunakan SQLite in-memory untuk mensimulasikan database bersih di setiap tes.

### ○ How did you structure your tests? 
menggunakan paket testing bawaan Go dan httptest.
- **Setup:** Inisialisasi router Gin dan database SQLite in-memory.
- **Execution:** Membuat request HTTP palsu (http.NewRequest) ke handler.
- **Assertion:** Membandingkan kode status respons (w.Code) dengan yang diharapkan (200 OK).

## 2. If you had more time, what would you improve or add? 
Saya prioritaskan untuk meningkatkan kualitas, keamanan, dan skalabilitas aplikasi.

### ○ What technical debt would you address?
- Migrasi Database: Saya akan beralih dari db.AutoMigrate GORM ke alat migrasi SQL yang lebih proper seperti golang-migrate agar versi skema database lebih terkontrol.
- Konfigurasi Environment: Memindahkan kredensial database (password, user) dari kode (main.go) ke file .env agar lebih aman dan mudah dikonfigurasi di environment berbeda.

### ○ What features would you add? 
- Autentikasi Pengguna (JWT): Agar setiap pengguna memiliki daftar tugas pribadi mereka sendiri.
-	Filter Lanjutan: Menambahkan endpoint backend untuk memfilter berdasarkan kategori atau status prioritas secara spesifik (misal: ?priority=high).
- Drag & Drop: Di frontend, memungkinkan pengguna menggeser tugas untuk mengubah urutan prioritas secara visual.

### ○ What would you refactor? 
- Struktur Folder Backend: Saya akan memecah file main.go yang monolitik menjadi arsitektur yang lebih modular:
 controllers/: Untuk logika handler.
 models/: Untuk definisi struct database.
 routes/: Untuk definisi URL API.
- Custom Hooks di Frontend: Memindahkan logika fetchTodos dan axios ke dalam custom hook tersendiri (useTodos) agar komponen App.jsx lebih bersih dan hanya fokus pada tampilan.

---

# Project Demo Video

[frontend.webm](https://github.com/user-attachments/assets/6edae896-cdcd-48fd-bea5-629a148d65e8)








