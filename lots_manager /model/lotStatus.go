package model

type lotStatus int

const (
	Available lotStatus = iota
	Occupied
	Reserved
)
