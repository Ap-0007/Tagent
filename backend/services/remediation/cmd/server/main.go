package main

import (
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}

	log.Printf("Tagent Remediation Service starting on port %s", port)
	// TODO: Initialize Kubernetes client
	// TODO: Load remediation policies
	// TODO: Start approval queue
	// TODO: Start HTTP server
}
