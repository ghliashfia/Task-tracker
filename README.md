# Task Tracker — Daftar Tugas & Deadline Kuliah

Aplikasi CRUD satu tabel (`tasks`) dengan **Express.js + SQLite**, tema pink & butter yellow.

## Menjalankan
```bash
npm install
npm start          # http://localhost:3000
```
Database `tasks.db` dibuat otomatis saat server pertama kali jalan.

## Tabel `tasks`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | auto increment |
| title | TEXT | judul tugas (wajib) |
| course | TEXT | mata kuliah |
| description | TEXT | catatan |
| deadline | TEXT | YYYY-MM-DD (wajib) |
| priority | TEXT | rendah / sedang / tinggi |
| done | INTEGER | 0 = belum, 1 = selesai |
| created_at | TEXT | otomatis |

## Endpoint REST
| Method | URL | Fungsi |
|---|---|---|
| GET | /api/tasks?status=belum\|selesai&q=kata | Daftar tugas (filter & cari) |
| GET | /api/tasks/:id | Detail satu tugas |
| POST | /api/tasks | Tambah tugas |
| PUT / PATCH | /api/tasks/:id | Ubah tugas |
| DELETE | /api/tasks/:id | Hapus tugas |

## Desain Figma
Folder `figma/` berisi SVG yang bisa di-drag ke Figma (tiap elemen jadi layer yang bisa diedit):
`task-tracker-desktop.svg`, `task-tracker-mobile.svg`, `task-tracker-modal.svg`, `color-palette.svg`.
Font: **Fredoka** (judul) & **Nunito** (teks) — keduanya ada di Google Fonts / Figma.

## Design tokens
| Nama | Hex |
|---|---|
| Cream (background) | #FFFDE8 |
| Butter 100 | #FDF6CA |
| Butter 300 | #F9E3AA |
| Pink 300 | #F7BBD5 |
| Pink 500 | #F899C1 |
| Ink (teks) | #5A2A41 |
| Ink soft | #8A5A72 |
| Alert | #D6456F |
