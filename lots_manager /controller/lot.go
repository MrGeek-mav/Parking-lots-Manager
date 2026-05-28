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

	status := r.URL.Query().Get("status")

	var lots []model.Lot

	result := instance.DB.Find(&lots).Where("Status = ?", status)
	if result.Error != nil {
		http.Error(w, "Failed to retrieve lots", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lots)
}

func GetLotFromSimulation(w http.ResponseWriter, r *http.Request) {

	urlset := os.Getenv("GATEWAYS_URLS")
	urls := strings.Split(urlset, ",")

}
