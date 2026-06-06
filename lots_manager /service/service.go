package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/MrGeek-mav/Parking-lots-Manager/instance"
	"github.com/MrGeek-mav/Parking-lots-Manager/model"
	dto "github.com/MrGeek-mav/Parking-lots-Manager/service/Dto"
)


type AreaResponse struct {
	Titulo   string      `json:"titulo"`
	Sensores []model.Lot `json:"sensores"`
}

func CreateUser(user *model.User) error {

	result := instance.DB.Create(user)
	if result.Error != nil {
		return result.Error
	}

	return nil

}

func GetUsers(page int, pageSize int) ([]model.User, error) {

	var users []model.User

	offset := (page - 1) * pageSize

	if err := instance.DB.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil

}

func FindUser(id int) (*model.User, error) {

	var user model.User

	if err := instance.DB.First(&user, id).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func FindUserByEmail(email string) (*model.User, error) {

	var user model.User

	if err := instance.DB.Where("Email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil

}

func RemoveUser(id int) error {
	var user model.User

	if err := instance.DB.First(&user, id).Error; err != nil {
		return err
	}

	if err := instance.DB.Model(&user).Update("Is_Active", !user.IsActive).Error; err != nil {
		return err
	}

	return nil

}

func UpdateLotStatus(id int, status int) error {

	var lot model.Lot

	if err := instance.DB.First(&lot, id).Error; err != nil {
		return err
	}

	if err := instance.DB.Model(&lot).Update("Status", status).Error; err != nil {
		return err
	}

	return nil
}

func GetLots(page int, pageSize int, status int) ([]model.Lot, error) {

	var lots []model.Lot

	offset := (page - 1) * pageSize

	if err := instance.DB.Where("Status = ?", status).Offset(offset).Limit(pageSize).Find(&lots).Error; err != nil {
		return nil, err
	}

	return lots, nil
}

func GetLotsRealTime() ([]model.Lot, error) {

	endpointsRaw := os.Getenv("ENDPOINTS")
	if endpointsRaw == "" {
		return nil, fmt.Errorf("variável ENDPOINTS não definida")
	}

	endpoints := strings.Split(strings.TrimSpace(endpointsRaw), ",")

	var wg sync.WaitGroup
	client := &http.Client{Timeout: 3 * time.Second}
	canalResultados := make(chan dto.Result, len(endpoints))

	// 1. Coleta concorrente dos sensores
	for _, url := range endpoints {
		urlLimpa := strings.TrimSpace(url)
		if urlLimpa == "" {
			continue
		}
		if !strings.HasPrefix(urlLimpa, "http://") && !strings.HasPrefix(urlLimpa, "https://") {
			urlLimpa = "http://" + urlLimpa
		}

		wg.Add(1)
		go func(targetURL string) {
			defer wg.Done()
			var res dto.Result
			res.Endpoint = targetURL

			resp, err := client.Get(targetURL)
			if err != nil {
				res.Erro = err
				canalResultados <- res
				return
			}
			defer resp.Body.Close()

			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				res.Erro = err
				canalResultados <- res
				return
			}

			var area dto.AreaResponse
			if err := json.Unmarshal(bodyBytes, &area); err != nil {
				res.Erro = err
				canalResultados <- res
				return
			}

			res.Dados = area
			canalResultados <- res
		}(urlLimpa)
	}

	wg.Wait()
	close(canalResultados)

	// 2. Mapear e aplicar as regras de validação com o Banco de Dados
	var estadoAtualVagas []model.Lot

	for resultado := range canalResultados {
		if resultado.Erro != nil {
			fmt.Printf("[X] Erro ao ler endpoint %s: %v\n", resultado.Endpoint, resultado.Erro)
			continue
		}

		for _, s := range resultado.Dados.Sensores {

			// Converter o status do sensor de string para o enum lotStatus
			var statusDoSensor model.LotStatus
			if s.Status == "Occupied" {
				statusDoSensor = model.Occupied
			} else {
				statusDoSensor = model.Available
			}

			// Criar o objeto em memória baseado no sensor
			vagaEmMemoria := model.Lot{
				Name:   s.Name,
				Status: statusDoSensor,
			}

			// --- REGRA DE NEGÓCIO: Verificar no Banco de Dados ---
			var vagaNoBanco model.Lot
			// Busca no banco o registro que tem o mesmo nome do sensor
			err := instance.DB.Where("name = ?", s.Name).First(&vagaNoBanco).Error

			if err == nil {
				// Se a vaga existe no banco e está como RESERVADA
				if vagaNoBanco.Status == model.Reserved {
					// Se o sensor detetou que está fisicamente ocupada, mantém/coloca como OCUPADA em memória
					if statusDoSensor == model.Occupied {
						vagaEmMemoria.Status = model.Occupied
						fmt.Printf("[VALIDAÇÃO] Vaga %s estava RESERVADA no banco e agora está OCUPADA pelo sensor.\n", s.Name)
					}
				}
			}

			// Adiciona a vaga tratada ao slice final (apenas na memória da aplicação)
			estadoAtualVagas = append(estadoAtualVagas, vagaEmMemoria)
		}
	}

	// Retorna a lista final tratada sem ter feito nenhum db.Save() ou db.Update()
	return estadoAtualVagas, nil

}

func FindLot(id int) (*model.Lot, error) {
	var lot model.Lot

	if err := instance.DB.First(&lot, id).Error; err != nil {
		return nil, err
	}

	return &lot, nil
}

func FindLotByName(name string) (*model.Lot, error) {
	var lot model.Lot
	if err := instance.DB.Where("name = ?", name).First(&lot).Error; err != nil {
		return nil, err
	}
	return &lot, nil
}

func CreateReserve(lotName string, userID int, time int) (*model.Reserve, error) {

	// 1. Verifica se a vaga existe na BD pelo nome
	lot, err := FindLotByName(lotName)
	if err != nil {
		return nil, fmt.Errorf("vaga '%s' não encontrada na base de dados: %w", lotName, err)
	}

	// 2. Consulta o estado real via sensores (endpoints externos)
	vagasReais, err := GetLotsRealTime()
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar sensores: %w", err)
	}

	// 3. Procura a vaga pelo nome nos resultados dos sensores
	var statusSensor model.LotStatus
	encontrada := false
	for _, v := range vagasReais {
		if v.Name == lot.Name {
			statusSensor = v.Status
			encontrada = true
			break
		}
	}

	fmt.Println("vaga econtrada nos sensores:", encontrada, "status do sensor:", statusSensor)

	if !encontrada {
		return nil, fmt.Errorf("vaga '%s' não encontrada nos sensores", lot.Name)
	}

	// 4. Só reserva se o sensor confirmar que está livre
	if statusSensor != model.Available {
		return nil, fmt.Errorf("vaga '%s' não está disponível (estado actual: %d)", lot.Name, statusSensor)
	}

	// 5. Persiste a reserva na BD
	reserve := &model.Reserve{
		LotID:  int(lot.ID),
		UserID: userID,
		Time:   time,
	}

	if err := instance.DB.Create(reserve).Error; err != nil {
		return nil, fmt.Errorf("erro ao guardar reserva: %w", err)
	}

	// 6. Actualiza o status da vaga para RESERVADA
	if err := instance.DB.Model(lot).Update("Status", model.Reserved).Error; err != nil {
		return nil, fmt.Errorf("reserva criada mas erro ao actualizar vaga: %w", err)
	}

	// 7. Devolve a reserva com os dados relacionados carregados
	if err := instance.DB.Preload("Lot").Preload("User").First(reserve, reserve.ID).Error; err != nil {
		return nil, fmt.Errorf("erro ao carregar dados da reserva: %w", err)
	}

	return reserve, nil
}
