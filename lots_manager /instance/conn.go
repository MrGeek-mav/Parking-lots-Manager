package instance

import (
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
	err := DB.AutoMigrate(&model.User{}, &model.Lot{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
}
