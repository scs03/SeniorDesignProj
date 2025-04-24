import { gql } from "@apollo/client";

export const GET_TEACHER_CLASSES = gql`
  query GetTeacherClasses($teacherId: Int!) {
    teacher_classes(teacher_id: $teacherId) {
      id
      name
      created_at
      student_count
      assignments {
        id
        name
        prompt
        due_date
        created_at
      }
      teacher {
        user_id
        name
        email
        role
        created_at
      }
    }
  }
`;


