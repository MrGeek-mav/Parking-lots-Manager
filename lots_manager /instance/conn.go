package instance

import (
	"fmt"
	"log"

	"github.com/MrGeek-mav/Parking-lots-Manager/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	database, err := gorm.Open(sqlite.Open("./instance/parking.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	DB = database
}

func Migrate() {
	err := DB.AutoMigrate(&model.User{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Database migrated successfully")
}
