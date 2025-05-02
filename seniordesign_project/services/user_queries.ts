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
      submission_file
    }
  }
`;


export const GET_MY_SUBMISSIONS = gql`
  query {
    my_submissions {
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
      submission_file
    }
  }
`;

export const GET_STUDENT_CLASSES = gql`
  query GetStudentClasses($studentId: Int!) {
    student_classes(student_id: $studentId) {
      id
      name
      created_at
      assignments {
        id
        name
        prompt
        due_date
        created_at
        rubric_file 
      }
    }
  }
`;


export const GET_ASSIGNMENT_BY_ID = gql`
  query GetAssignmentById($assignment_id: Int!) {
    assignment_by_id(assignment_id: $assignment_id) {
      id
      name
      prompt
      due_date
      created_at
      rubric_file
    }
  }
`;
