package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite" // Driver SQLite murni
	"gorm.io/gorm"
)

// SetupRouter membantu menyiapkan router untuk testing
func setupRouter() *gin.Engine {
	r := gin.Default()
	api := r.Group("/api")
	{
		api.POST("/todos", createTodo)
		api.GET("/todos", getTodos)
		api.PUT("/todos/:id", updateTodo)
		api.DELETE("/todos/:id", deleteTodo)
	}
	return r
}

// SetupTestDB mengganti database asli dengan SQLite (Memory) agar aman
func setupTestDB() {
	var err error
	// Menggunakan database di dalam RAM (Pure Go Version)
	db, err = gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic("Gagal connect ke DB Test")
	}
	db.AutoMigrate(&Todo{}, &Category{})
}

// --- TEST CASE 1: GET TODOS ---
func TestGetTodos(t *testing.T) {
	// 1. Setup
	setupTestDB()
	r := setupRouter()

	// 2. Request
	req, _ := http.NewRequest("GET", "/api/todos", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// 3. Assert (Cek Hasil)
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

// --- TEST CASE 2: CREATE TODO ---
func TestCreateTodo(t *testing.T) {
	setupTestDB()
	r := setupRouter()

	// Data todo baru
	todo := Todo{
		Title:    "Test Unit Testing",
		Category: "Work",
		Priority: "high",
	}
	jsonValue, _ := json.Marshal(todo)

	// Kirim Request POST
	req, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Cek apakah sukses (200 OK)
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Cek apakah data benar-benar tersimpan di body response
	var response Todo
	json.Unmarshal(w.Body.Bytes(), &response)
	if response.Title != "Test Unit Testing" {
		t.Errorf("Expected title 'Test Unit Testing', got %s", response.Title)
	}
}

// --- TEST CASE 3: DELETE TODO ---
func TestDeleteTodo(t *testing.T) {
	setupTestDB()
	r := setupRouter()

	// Buat 1 data dulu untuk dihapus
	dummy := Todo{Title: "To Delete"}
	db.Create(&dummy)

	// Kirim Request DELETE
	req, _ := http.NewRequest("DELETE", "/api/todos/1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Cek status
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}