package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/MrGeek-mav/Parking-lots-Manager/service"
)

// GET /lots?page=1&pageSize=10&status=0
func GetLots(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if pageSize < 1 {
		pageSize = 10
	}
	status, _ := strconv.Atoi(r.URL.Query().Get("status"))

	lots, err := service.GetLots(page, pageSize, status)
	if err != nil {
		http.Error(w, "erro ao listar vagas: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lots)
}

// GET /lots/realtime
func GetLotsRealTime(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	lots, err := service.GetLotsRealTime()
	if err != nil {
		http.Error(w, "erro ao consultar sensores: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lots)
}

// GET /lots/{id}
func FindLot(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	id, err := pathID(r.URL.Path)
	if err != nil {
		http.Error(w, "id inválido", http.StatusBadRequest)
		return
	}

	lot, err := service.FindLot(id)
	if err != nil {
		http.Error(w, "vaga não encontrada", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lot)
}

// PATCH /lots/{id}/status   body: {"status": 1}
func UpdateLotStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// espera path do tipo /lots/3/status — extrai o segmento numérico
	id, err := pathID(r.URL.Path)
	if err != nil {
		http.Error(w, "id inválido", http.StatusBadRequest)
		return
	}

	var body struct {
		Status int `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "corpo inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := service.UpdateLotStatus(id, body.Status); err != nil {
		http.Error(w, "erro ao actualizar vaga: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
