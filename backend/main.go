package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// --- 1. MODEL DATA ---

type Todo struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Completed   bool      `json:"completed"`
	Category    string    `json:"category"`
	Priority    string    `json:"priority"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Model: Kategori
type Category struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
}

var db *gorm.DB

func main() {
	// --- 2. KONEKSI DATABASE ---
	// Pastikan password sesuai punya Anda
	dsn := "host=localhost user=postgres password=kayakaya21 dbname=todo_industrix port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Gagal koneksi ke database!")
	}

	// Auto Migrate: Membuat tabel Todo dan Category
	db.AutoMigrate(&Todo{}, &Category{})

	// Isi Kategori Default jika tabel kosong (Seed Data)
	seedCategories()

	// --- 3. ROUTER ---
	r := gin.Default()
	
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	api := r.Group("/api")
	{
		// Routes Todo
		api.POST("/todos", createTodo)
		api.GET("/todos", getTodos)
		api.PUT("/todos/:id", updateTodo)
		api.DELETE("/todos/:id", deleteTodo)

		// Routes Category
		api.GET("/categories", getCategories)
		api.POST("/categories", createCategory)
		api.DELETE("/categories/:id", deleteCategory)
	}

	r.Run(":8080")
}

// --- Helper: Seed Data ---
func seedCategories() {
	var count int64
	db.Model(&Category{}).Count(&count)
	if count == 0 {
		db.Create(&Category{Name: "Work"})
		db.Create(&Category{Name: "Personal"})
		db.Create(&Category{Name: "Shopping"})
		println("Kategori default berhasil dibuat!")
	}
}

// --- HANDLERS TODO ---

func createTodo(c *gin.Context) {
	var input Todo
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Priority == "" { input.Priority = "medium" }
	if input.Category == "" { input.Category = "General" }
	db.Create(&input)
	c.JSON(http.StatusOK, input)
}

func getTodos(c *gin.Context) {
	var todos []Todo
	var total int64
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	offset := (page - 1) * limit

	query := db.Model(&Todo{})
	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}
	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("completed asc, created_at desc").Find(&todos)

	c.JSON(http.StatusOK, gin.H{"data": todos, "total": total, "page": page, "limit": limit})
}

func updateTodo(c *gin.Context) {
	var todo Todo
	if err := db.First(&todo, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	var input Todo
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Model(&todo).Updates(input)
	c.JSON(http.StatusOK, todo)
}

func deleteTodo(c *gin.Context) {
	var todo Todo
	if err := db.First(&todo, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	db.Delete(&todo)
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// --- HANDLERS CATEGORY ---

func getCategories(c *gin.Context) {
	var categories []Category
	db.Order("id asc").Find(&categories)
	c.JSON(http.StatusOK, categories)
}

func createCategory(c *gin.Context) {
	var input Category
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Create(&input)
	c.JSON(http.StatusOK, input)
}

func deleteCategory(c *gin.Context) {
	var cat Category
	if err := db.First(&cat, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	db.Delete(&cat)
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}