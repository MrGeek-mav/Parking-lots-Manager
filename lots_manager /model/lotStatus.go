package model

type LotStatus int

const (
	Available LotStatus = iota
	Occupied
	Reserved
)
