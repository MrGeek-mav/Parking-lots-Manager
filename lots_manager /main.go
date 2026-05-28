package main

import (
	"fmt"
	"github.com/MrGeek-mav/Parking-lots-Manager/controller"
	"github.com/MrGeek-mav/Parking-lots-Manager/instance"
	"github.com/joho/godotenv"
	"net/http"
	"os"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		panic("Error loading .env file")
	}

	instance.Connect()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /users", controller.CreateUser)
	mux.HandleFunc("GET /users/", controller.GetUsers)
	mux.HandleFunc("GET /lots/", controller.GetLots)
	mux.HandleFunc("PUT /lots/", controller.UpdateLotStatus)

	if err := http.ListenAndServe(os.Getenv("SERVER_PORT"), mux); err != nil {
		panic(err)
	}

	fmt.Println("your server is running in port: " + os.Getenv("SERVER_PORT"))

}
