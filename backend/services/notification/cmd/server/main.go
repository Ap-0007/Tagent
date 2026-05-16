package main

import (
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	log.Printf("Tagent Notification Service starting on port %s", port)
	// TODO: Initialize Slack client
	// TODO: Initialize email client
	// TODO: Start notification queue consumer
}
