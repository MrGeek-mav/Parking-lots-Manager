package model

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"unique;not null"`
	Password string `json:"password" gorm:"size:6;not null"`
	Role     role   `json:"role" gorm:"not null;default:1"`
	IsActive bool   `json:"is_active" gorm:"not null;default:true"`
}
