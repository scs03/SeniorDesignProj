// lib/apollo-client.ts
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client"; // ✅ clean version for v16

const uploadLink = createUploadLink({
  uri: "http://localhost:8000/graphql",
  credentials: "include",
});

const client = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});

export default client;
