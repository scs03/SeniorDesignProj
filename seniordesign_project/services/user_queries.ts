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

export const GET_ALL_SUBMISSIONS = gql`
  query {
    all_submissions {
      submission_id
      student_id
      student_name
      class_id
      class_name
      assignment_id
      assignment_name
      submission_date
      ai_grade
      human_grade
      feedback
      graded_by_ai
    }
  }
`;


