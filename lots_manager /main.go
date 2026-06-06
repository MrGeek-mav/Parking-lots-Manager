package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/MrGeek-mav/Parking-lots-Manager/controller"
	"github.com/MrGeek-mav/Parking-lots-Manager/instance"
	"github.com/MrGeek-mav/Parking-lots-Manager/model"
	"github.com/MrGeek-mav/Parking-lots-Manager/service"
	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		panic("Error loading .env file")
	}

	instance.Connect()
	instance.Migrate()

	mux := http.NewServeMux()

	// Users
	mux.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			controller.GetUsers(w, r)
		case http.MethodPost:
			controller.CreateUser(w, r)
		default:
			http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/users/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			controller.FindUser(w, r)
		case http.MethodDelete:
			controller.RemoveUser(w, r)
		default:
			http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		}
	})

	// Lots
	mux.HandleFunc("/lots/realtime", controller.GetLotsRealTime)
	mux.HandleFunc("/lots", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			controller.GetLots(w, r)
		default:
			http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/lots/", func(w http.ResponseWriter, r *http.Request) {
		// /lots/{id}/status → PATCH
		// /lots/{id}        → GET
		switch r.Method {
		case http.MethodGet:
			controller.FindLot(w, r)
		case http.MethodPatch:
			controller.UpdateLotStatus(w, r)
		default:
			http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		}
	})

	// Reserves
	mux.HandleFunc("/reserves", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			controller.CreateReserve(w, r)
		default:
			http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		}
	})

	fmt.Println("your server is running in port: " + os.Getenv("SERVER_PORT"))

	if err := http.ListenAndServe(os.Getenv("SERVER_PORT"), mux); err != nil {
		panic(err)
	}

}

func printLots() {

	lots, err := service.GetLotsRealTime()

	if err != nil {
		log.Printf("Erro ao buscar vagas: %v", err)
		return
	}

	for _, lot := range lots {
		fmt.Println(lot.ToString())
	}

}

func createLots() {

	ok := func() {
		fmt.Println("Processo de criação de vagas finalizado.")
	}

	defer ok()

	// 3. Criar o slice que vai armazenar todos os registros temporariamente
	var todosOsLots []model.Lot

	// Gerar registros A1 ... A6
	for i := 1; i <= 6; i++ {
		todosOsLots = append(todosOsLots, model.Lot{
			Name:   fmt.Sprintf("A%d", i),
			Status: model.Available,
		})
	}

	// Gerar registros B1 ... B22
	for i := 1; i <= 22; i++ {
		todosOsLots = append(todosOsLots, model.Lot{
			Name:   fmt.Sprintf("B%d", i),
			Status: model.Available,
		})
	}

	// Gerar registros C1 ... C11
	for i := 1; i <= 11; i++ {
		todosOsLots = append(todosOsLots, model.Lot{
			Name:   fmt.Sprintf("C%d", i),
			Status: model.Available,
		})
	}

	// 4. Inserir TODOS os 39 registros de uma só vez no SQLite
	// O GORM divide em lotes automaticamente se necessário (ex: db.CreateInBatches(todosOsLots, 100))
	err := instance.DB.Create(&todosOsLots).Error
	if err != nil {
		log.Printf("Erro ao inserir os registros (provavelmente já existem): %v", err)
	} else {
		fmt.Printf("Sucesso! %d vagas de estacionamento foram inseridas como FREE.\n", len(todosOsLots))
	}

}
