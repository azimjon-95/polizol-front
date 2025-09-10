import axios from "axios";

const mainURL = axios.create({
  // baseURL: "http://localhost:5050/api",
  baseURL: "https://polizolserver.medme.uz/api",
});

export default mainURL;
