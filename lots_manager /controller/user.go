package controller

import (
	"encoding/json"
	"net/http"

	"github.com/MrGeek-mav/Parking-lots-Manager/instance"
	"github.com/MrGeek-mav/Parking-lots-Manager/model"
)

func CreateUser(w http.ResponseWriter, r *http.Request) {

	var user model.User

	err := json.NewDecoder(r.Body).Decode(&user)

	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	result := instance.DB.Create(user)
	defer r.Body.Close()

	if result.Error != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)

}

func GetUsers(w http.ResponseWriter, r *http.Request) {

	var user model.User
	queryParams := r.URL.Query()
	username := queryParams.Get("username")

	if username != "" {
		result := instance.DB.Where("Username = ?", username).First(&user)
		if result.Error != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
	} else {
		result := instance.DB.Find(&user)
		if result.Error != nil {
			http.Error(w, "Failed to retrieve users", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
