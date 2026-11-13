package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"bksmart-backend/middleware"
	"bksmart-backend/models"

	"github.com/golang-jwt/jwt/v5"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func JSONResponse(w http.ResponseWriter, status int, success bool, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{
		Success: success,
		Message: msg,
		Data:    data,
	})
}

// Health Check
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	JSONResponse(w, http.StatusOK, true, "BKSmart Golang REST API is running successfully", map[string]interface{}{
		"status":      "HEALTHY",
		"timestamp":   time.Now().Format(time.RFC3339),
		"environment": "production-ready",
		"database":    "PostgreSQL 16 Alpine",
		"version":     "1.0.0",
	})
}

// Authentication
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func LoginHandler(jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			JSONResponse(w, http.StatusBadRequest, false, "Invalid JSON payload", nil)
			return
		}

		// Role mapping lookup
		var user models.User
		switch req.Username {
		case "admin":
			user = models.User{ID: "u-1", Username: "admin", Name: "Drs. Bambang Hidayat, M.Kom", Role: models.RoleAdmin, Active: true}
		case "gurubk":
			user = models.User{ID: "u-2", Username: "gurubk", Name: "Siti Rahmawati, S.Pd., Kons.", Role: models.RoleCounselor, Active: true}
		case "walikelas":
			user = models.User{ID: "u-3", Username: "walikelas", Name: "Ahmad Fauzi, S.Pd.", Role: models.RoleTeacher, AssignedClass: "XI RPL 1", Active: true}
		case "siswa":
			user = models.User{ID: "u-4", Username: "siswa", Name: "Rizky Pratama", Role: models.RoleStudent, AssignedClass: "XI RPL 1", Active: true}
		case "kepsek":
			user = models.User{ID: "u-5", Username: "kepsek", Name: "Dr. H. Mulyono, M.Pd.", Role: models.RolePrincipal, Active: true}
		default:
			JSONResponse(w, http.StatusUnauthorized, false, "Invalid credentials", nil)
			return
		}

		// Generate JWT token
		claims := &middleware.Claims{
			UserID:   user.ID,
			Username: user.Username,
			Role:     user.Role,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				Issuer:    "bksmart-auth-service",
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString([]byte(jwtSecret))
		if err != nil {
			JSONResponse(w, http.StatusInternalServerError, false, "Failed to sign token", nil)
			return
		}

		JSONResponse(w, http.StatusOK, true, "Login successful", map[string]interface{}{
			"token": tokenString,
			"user":  user,
		})
	}
}

// Students Handler
func GetStudentsHandler(w http.ResponseWriter, r *http.Request) {
	students := []models.Student{
		{ID: "s-1", NISN: "0067829102", NIS: "2324101", Name: "Rizky Pratama", Gender: "L", ClassName: "XI RPL 1", MajorName: "Rekayasa Perangkat Lunak", AcademicYear: "2024/2025", ParentName: "H. Sudirman", ParentPhone: "0812-9900-1122", Status: "active"},
		{ID: "s-2", NISN: "0071234567", NIS: "2324102", Name: "Anisa Maharani", Gender: "P", ClassName: "XI RPL 1", MajorName: "Rekayasa Perangkat Lunak", AcademicYear: "2024/2025", ParentName: "Bambang Supriyadi", ParentPhone: "0813-4455-6677", Status: "active"},
		{ID: "s-3", NISN: "0069988771", NIS: "2324103", Name: "Dimas Bagus Saputra", Gender: "L", ClassName: "XI RPL 1", MajorName: "Rekayasa Perangkat Lunak", AcademicYear: "2024/2025", ParentName: "Gunawan Saputra", ParentPhone: "0852-6677-8899", Status: "active"},
	}
	JSONResponse(w, http.StatusOK, true, "Students retrieved successfully", students)
}

// Counseling Handler with Privacy Guard
func GetCounselingHandler(w http.ResponseWriter, r *http.Request) {
	claims, _ := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	canViewPrivate := claims != nil && (claims.Role == models.RoleCounselor || claims.Role == models.RoleAdmin)

	sessions := []models.CounselingSession{
		{
			ID:                "cs-1",
			TicketNumber:      "BK-2025-001",
			StudentID:         "s-1",
			StudentName:       "Rizky Pratama",
			StudentClass:      "XI RPL 1",
			CounselorName:     "Siti Rahmawati, S.Pd., Kons.",
			Type:              "individual",
			Domain:            "karier",
			SessionDate:       "2025-02-14",
			SessionTime:       "09:30",
			Location:          "Ruang BK - Konseling Individu 1",
			Status:            "completed",
			ProblemSummary:    "Konsultasi rencana PKL industri dan perguruan tinggi.",
			ConfidentialNotes: "Siswa memiliki bakat programming web, membutuhkan bimbingan beasiswa industri.",
		},
	}

	// Redact confidential notes if role is not authorized
	if !canViewPrivate {
		for i := range sessions {
			sessions[i].ConfidentialNotes = ""
		}
	}

	JSONResponse(w, http.StatusOK, true, "Counseling sessions retrieved", sessions)
}

// Reports Statistics Handler
func GetReportsStatsHandler(w http.ResponseWriter, r *http.Request) {
	stats := map[string]interface{}{
		"totalSessions":   14,
		"activeCases":     2,
		"pendingReferrals": 1,
		"domainDistribution": map[string]int{
			"karier":  5,
			"belajar": 4,
			"pribadi": 3,
			"sosial":  2,
		},
		"programCompletionAvg": 78,
	}
	JSONResponse(w, http.StatusOK, true, "Report statistics generated", stats)
}
