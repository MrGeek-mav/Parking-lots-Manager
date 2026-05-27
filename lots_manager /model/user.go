package model

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `json:"username" gorm:"unique;not null"`
	Password string `json:"password" gorm:"size:6;not null"`
	Role     role   `json:"role" gorm:"not null;default:1"`
}
