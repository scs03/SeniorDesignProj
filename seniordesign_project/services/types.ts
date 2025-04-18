export interface Assignment {
    id: string
    name: string
    prompt?: string
    due_date: string
    created_at: string
  }
  
  export interface Teacher {
    name: string
    email: string
    role: string
    created_at: string
  }
  
  export interface Class {
    id: string
    name: string
    created_at: string
    student_count: number
    teacher: Teacher
    assignments: Assignment[]
  }
  
  export interface GetTeacherClassesData {
    teacher_classes: Class[]
  }
  
  export interface GetTeacherClassesVars {
    teacherId: number
  }
  