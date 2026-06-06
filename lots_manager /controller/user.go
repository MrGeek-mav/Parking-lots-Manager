package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/MrGeek-mav/Parking-lots-Manager/model"
	"github.com/MrGeek-mav/Parking-lots-Manager/service"
)

// POST /users
func CreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var user model.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "corpo inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := service.CreateUser(&user); err != nil {
		http.Error(w, "erro ao criar utilizador: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// GET /users?page=1&pageSize=10
func GetUsers(w http.ResponseWriter, r *http.Request) {

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

	users, err := service.GetUsers(page, pageSize)
	if err != nil {
		http.Error(w, "erro ao listar utilizadores: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// GET /users/{id}
func FindUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	id, err := pathID(r.URL.Path)
	if err != nil {
		http.Error(w, "id inválido", http.StatusBadRequest)
		return
	}

	user, err := service.FindUser(id)
	if err != nil {
		http.Error(w, "utilizador não encontrado", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// DELETE /users/{id}  (toggle IsActive)
func RemoveUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}

	id, err := pathID(r.URL.Path)
	if err != nil {
		http.Error(w, "id inválido", http.StatusBadRequest)
		return
	}

	if err := service.RemoveUser(id); err != nil {
		http.Error(w, "erro ao remover utilizador: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
