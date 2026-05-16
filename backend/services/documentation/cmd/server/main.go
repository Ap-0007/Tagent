package main

import (
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8086"
	}

	log.Printf("Tagent Documentation Service starting on port %s", port)
	// TODO: Initialize report templates
	// TODO: Start incident report generator
	// TODO: Start HTTP server
}
