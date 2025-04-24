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

//Added this 1

export const GET_MY_CLASSES = gql`
  query MyClasses {
    my_classes {
      id
      name
      created_at
      teacher {
        user_id
        name
        email
      }
    }
  }
`;


//added this 2

export const GET_CLASS_ASSIGNMENTS = gql`
  query GetClassAssignments($classId: Int!) {
    class_assignments(class_id: $classId) {
      id
      name
      prompt
      due_date
      created_at
    }
  }
`;
