package model

import (
	"fmt"

	"gorm.io/gorm"
)

type Lot struct {
	gorm.Model
	Name   string    `json:"name" gorm:"unique;not null"`
	Status LotStatus `json:"status" gorm:"not null;default:0"`
}

func (l *Lot) ToString() string {
	return fmt.Sprintf("Lot ID: %d, Name: %s, Status: %d", l.ID, l.Name, l.Status)
}
