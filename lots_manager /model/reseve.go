package model

import (
	"gorm.io/gorm"
)

type Reserve struct {
	gorm.Model
	LotID  int  `json:"lot_id" gorm:"not null;column:lot_id"`
	Lot    Lot  `json:"lot" gorm:"foreignKey:LotID"`
	UserID int  `json:"user_id" gorm:"not null;column:user_id"`
	User   User `json:"user" gorm:"foreignKey:UserID"`
	Time   int  `json:"time" gorm:"not null"`
}
