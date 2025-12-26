import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Importando o Firebase para garantir que seja inicializado
import "./lib/firebase/firebase";

createRoot(document.getElementById("root")!).render(<App />);
