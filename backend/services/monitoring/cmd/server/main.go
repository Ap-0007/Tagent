package main

import (
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("Tagent Monitoring Service starting on port %s", port)
	// TODO: Connect to Prometheus
	// TODO: Connect to Loki/Fluent Bit
	// TODO: Start metric collection loop
	// TODO: Start anomaly detection
}
