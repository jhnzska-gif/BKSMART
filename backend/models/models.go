package models

import "time"

type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleCounselor UserRole = "counselor"
	RoleTeacher   UserRole = "teacher"
	RoleStudent   UserRole = "student"
	RolePrincipal UserRole = "principal"
)

type User struct {
	ID            string    `json:"id"`
	Username      string    `json:"username"`
	PasswordHash  string    `json:"-"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Role          UserRole  `json:"role"`
	NipOrNisn     string    `json:"nipOrNisn,omitempty"`
	Phone         string    `json:"phone,omitempty"`
	AssignedClass string    `json:"assignedClass,omitempty"`
	Active        bool      `json:"active"`
	CreatedAt     time.Time `json:"createdAt"`
}

type Student struct {
	ID           string `json:"id"`
	NISN         string `json:"nisn"`
	NIS          string `json:"nis"`
	Name         string `json:"name"`
	Gender       string `json:"gender"`
	ClassID      string `json:"classId"`
	ClassName    string `json:"className"`
	MajorID      string `json:"majorId"`
	MajorName    string `json:"majorName"`
	AcademicYear string `json:"academicYear"`
	ParentName   string `json:"parentName"`
	ParentPhone  string `json:"parentPhone"`
	StudentPhone string `json:"studentPhone"`
	Address      string `json:"address"`
	Status       string `json:"status"`
}

type CounselingSession struct {
	ID                string    `json:"id"`
	TicketNumber      string    `json:"ticketNumber"`
	StudentID         string    `json:"studentId"`
	StudentName       string    `json:"studentName"`
	StudentClass      string    `json:"studentClass"`
	CounselorID       string    `json:"counselorId"`
	CounselorName     string    `json:"counselorName"`
	Type              string    `json:"type"`   // individual, group, classical, home_visit
	Domain            string    `json:"domain"` // pribadi, sosial, belajar, karier
	SessionDate       string    `json:"sessionDate"`
	SessionTime       string    `json:"sessionTime"`
	Location          string    `json:"location"`
	Status            string    `json:"status"`
	ProblemSummary    string    `json:"problemSummary"`
	ConfidentialNotes string    `json:"confidentialNotes,omitempty"` // Filtered for unauthorized roles!
	ActionPlan        string    `json:"actionPlan,omitempty"`
	OutcomeSummary    string    `json:"outcomeSummary,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
}

type Referral struct {
	ID                    string    `json:"id"`
	ReferralNumber        string    `json:"referralNumber"`
	StudentID             string    `json:"studentId"`
	StudentName           string    `json:"studentName"`
	StudentClass          string    `json:"studentClass"`
	ReferredByTeacherID   string    `json:"referredByTeacherId"`
	ReferredByTeacherName string    `json:"referredByTeacherName"`
	CounselorID           string    `json:"counselorId,omitempty"`
	CounselorName         string    `json:"counselorName,omitempty"`
	Reason                string    `json:"reason"`
	Indicators            []string  `json:"indicators"`
	Urgency               string    `json:"urgency"`
	Status                string    `json:"status"`
	CounselorFeedback     string    `json:"counselorFeedback,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
}

type StudentCase struct {
	ID                    string         `json:"id"`
	CaseNumber            string         `json:"caseNumber"`
	Title                 string         `json:"title"`
	StudentID             string         `json:"studentId"`
	StudentName           string         `json:"studentName"`
	StudentClass          string         `json:"studentClass"`
	Category              string         `json:"category"`
	Priority              string         `json:"priority"`
	Status                string         `json:"status"`
	AssignedCounselorID   string         `json:"assignedCounselorId"`
	AssignedCounselorName string         `json:"assignedCounselorName"`
	IncidentDate          string         `json:"incidentDate"`
	ChronologySummary     string         `json:"chronologySummary"`
	ConfidentialDetails   string         `json:"confidentialDetails,omitempty"`
	Interventions         []Intervention `json:"interventions"`
	CreatedAt             time.Time      `json:"createdAt"`
}

type Intervention struct {
	Date   string `json:"date"`
	Action string `json:"action"`
	By     string `json:"by"`
	Result string `json:"result"`
}

type AuditLog struct {
	ID          string    `json:"id"`
	Timestamp   time.Time `json:"timestamp"`
	UserID      string    `json:"userId"`
	UserName    string    `json:"userName"`
	UserRole    string    `json:"userRole"`
	Action      string    `json:"action"`
	Module      string    `json:"module"`
	Description string    `json:"description"`
	IPAddress   string    `json:"ipAddress"`
}
