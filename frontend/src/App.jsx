import AppRoutes from "./routes/AppRoutes";
import AdminRoute from "./routes/AdminRoute";


import "./App.css";
import EmployeeRoutes from "./routes/EmployeeRoute";

function App() {
  return (
    <>
      <AppRoutes />

      <EmployeeRoutes/>

      <AdminRoute/>

    </>
  );
}

export default App;
