package main

import (
	"net/http"

	"github.com/MrGeek-mav/Parking-lots-Manager/controller"
	"github.com/MrGeek-mav/Parking-lots-Manager/instance"
)

func main() {

	instance.Connect()
	mux := http.NewServeMux()

	mux.HandleFunc("POST /users", controller.CreateUser)
	mux.HandleFunc("GET /users/", controller.GetUsers)
	mux.HandleFunc("GET /lots/", controller.GetLots)
	mux.HandleFunc("PUT /lots/", controller.UpdateLotStatus)

	if err := http.ListenAndServe(":8080", mux); err != nil {
		panic(err)
	}

}
