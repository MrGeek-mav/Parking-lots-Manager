package dto

type AreaResponse struct {
	Titulo   string           `json:"titulo"`
	Sensores []SensorResponse `json:"sensores"`
}
