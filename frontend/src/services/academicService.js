import api from './api'

export const academicService = {
  // Departments
  getDepartments: () => api.get('/departments/'),

  // Academic Years
  getAcademicYears: () => api.get('/academic-years/'),

  // Semesters (optionally filtered by program)
  getSemesters: (params) => api.get('/semesters/', { params }),

  // Classrooms (with optional filtering by department)
  getClassrooms: (params) => api.get('/classrooms/', { params }),

  // Classrooms filtered by department
  getClassroomsByDepartment: (departmentId) =>
    api.get('/classrooms/', { params: { department_id: departmentId } }),

  // Sections (with optional classroom filtering)
  getSections: (params) => api.get('/sections/', { params }),

  // Sections filtered by classroom
  getSectionsByClassroom: (classroomId) =>
    api.get('/sections/', { params: { classroom_id: classroomId } }),
}