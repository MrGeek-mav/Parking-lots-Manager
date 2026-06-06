package controller

import (
	"encoding/json"
	"net/http"

	"github.com/MrGeek-mav/Parking-lots-Manager/service"
)

// POST /reserves
// body: {"lot_name": "A1", "user_id": 1, "time": 60}
func CreateReserve(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		LotName string `json:"lot_name"`
		UserID  int    `json:"user_id"`
		Time    int    `json:"time"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "corpo inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	if body.LotName == "" || body.UserID == 0 || body.Time == 0 {
		http.Error(w, "campos obrigatórios: lot_name, user_id, time", http.StatusBadRequest)
		return
	}

	reserve, err := service.CreateReserve(body.LotName, body.UserID, body.Time)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reserve)
}
