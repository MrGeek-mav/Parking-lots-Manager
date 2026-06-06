package controller

import (
	"fmt"
	"strconv"
	"strings"
)

// pathID extrai o último segmento numérico de um path.
// Ex.: "/users/42" → 42
//
//	"/lots/3/status" → 3  (primeiro segmento numérico encontrado)
func pathID(path string) (int, error) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for _, p := range parts {
		if id, err := strconv.Atoi(p); err == nil {
			return id, nil
		}
	}
	return 0, fmt.Errorf("id não encontrado no path: %s", path)
}
