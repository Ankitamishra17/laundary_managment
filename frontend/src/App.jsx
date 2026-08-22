import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#05282A",
            color: "#FFFFFF",
            fontSize: "14px",
            borderRadius: "12px",
            border: "1px solid #02809066",
            padding: "12px 16px",
            maxWidth: "420px",
          },
          success: {
            iconTheme: { primary: "#02C39A", secondary: "#05282A" },
            style: { border: "1px solid #02C39A55" },
          },
          error: {
            iconTheme: { primary: "#E0645C", secondary: "#05282A" },
            style: { border: "1px solid #E0645C55" },
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;