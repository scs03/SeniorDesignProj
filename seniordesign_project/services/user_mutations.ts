import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      email
      name
      role
      user_id
      created_at
    }
  }
`;


export const SUBMIT_ASSIGNMENT = gql`
  mutation SubmitAssignment($assignment_id: Int!, $submission_file: Upload!) {
    submit_assignment(assignment_id: $assignment_id, submission_file: $submission_file)
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation RegisterUser($name: String!, $email: String!, $password: String!, $role: String!) {
    register_user(name: $name, email: $email, password: $password, role: $role) {
      user_id
      name
      email
      role
      created_at
    }
  }
`

  export const CREATE_ASSIGNMENT = gql`
    mutation CreateAssignment(
      $classId: Int!
      $name: String!
      $dueDate: DateTime
      $prompt: String
    ) {
      create_assignment(
        class_id: $classId
        name: $name
        due_date: $dueDate
        prompt: $prompt
      )
    }
`;

export const ADD_STUDENTS_TO_CLASS = gql`
  mutation AddStudentsToClass($classId: Int!, $studentIds: [Int!]!) {
    add_students_to_class(class_id: $classId, student_ids: $studentIds)
  }
`

export const UPDATE_SUBMISSION = gql`
  mutation UpdateSubmission($submission_id: Int!, $human_grade: Float, $feedback: String) {
    update_submission(submission_id: $submission_id, human_grade: $human_grade, feedback: $feedback)
}

`;

export const CREATE_CLASS = gql`
  mutation CreateClass($name: String!) {
    create_class(name: $name) {
      id
      name
    }
  }
`;

export const UPDATE_PROFILE_PICTURE = gql`
  mutation UpdateProfilePicture($file: Upload!) {
    update_profile_picture(file: $file) {
      user_id
      name
      email
      role
      created_at
      profile_picture_url
    }
  }
`;