package main

import (
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Tagent Discovery Service starting on port %s", port)
	// TODO: Initialize Kubernetes client
	// TODO: Start resource watcher
	// TODO: Start HTTP server for internal API
}
