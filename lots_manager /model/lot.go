package model

import (
	"gorm.io/gorm"
)

type Lot struct {
	gorm.Model
	Name   string    `json:"name" gorm:"unique;not null"`
	Status lotStatus `json:"status" gorm:"not null;default:0"`
}
