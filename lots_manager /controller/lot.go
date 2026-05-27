package controller

import (
	"encoding/json"
	"github.com/MrGeek-mav/Parking-lots-Manager/instance"
	"github.com/MrGeek-mav/Parking-lots-Manager/model"
	"net/http"
)

func UpdateLotStatus(w http.ResponseWriter, r *http.Request) {

	id := r.PathValue("id")
	status := r.PathValue("status")

	var lot model.Lot
	result := instance.DB.First(&lot, id)

	if result.Error != nil {
		http.Error(w, "Lot not found", http.StatusNotFound)
		return
	}

	instance.DB.Model(&lot).Update("Status", status)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lot)

}

func GetLots(w http.ResponseWriter, r *http.Request) {

	var lots []model.Lot
	result := instance.DB.Find(&lots).Where("Status = ?", "Available")
	if result.Error != nil {
		http.Error(w, "Failed to retrieve lots", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lots)
}
