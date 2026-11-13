package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"bksmart-backend/config"
	"bksmart-backend/handlers"
	"bksmart-backend/middleware"
	"bksmart-backend/models"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	cfg := config.LoadConfig()

	router := mux.NewRouter()

	// Public Routes
	router.HandleFunc("/api/health", handlers.HealthCheckHandler).Methods("GET")
	router.HandleFunc("/api/auth/login", handlers.LoginHandler(cfg.JWTSecret)).Methods("POST")

	// Protected Subrouter
	api := router.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	// Students Endpoints
	api.HandleFunc("/students", handlers.GetStudentsHandler).Methods("GET")

	// Counseling Endpoints (With privacy logic)
	api.HandleFunc("/counseling", handlers.GetCounselingHandler).Methods("GET")

	// Reports Statistics
	api.HandleFunc("/reports/statistics", handlers.GetReportsStatsHandler).Methods("GET")

	// Setup CORS for Docker & Web Clients
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8080", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Accept"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	srv := &http.Server{
		Handler:      handler,
		Addr:         ":" + cfg.Port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	fmt.Printf("====================================================\n")
	fmt.Printf(" BKSmart Golang REST API Server Running on Port :%s\n", cfg.Port)
	fmt.Printf(" Database: %s\n", cfg.DatabaseURL)
	fmt.Printf(" Environment: %s\n", cfg.Environment)
	fmt.Printf(" Ready for Docker Desktop Windows\n")
	fmt.Printf("====================================================\n")

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on port :%s: %v\n", cfg.Port, err)
	}
}
