// src/api.js
import axios from "axios";

// point this to your backend URL
const API = axios.create({
  baseURL: "http://localhost:4000",
});

export default API;
