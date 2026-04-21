import { useState, useEffect } from "react";
import { loadData, saveData, defaultData } from "./utils/data";
import HomeScreen from "./components/HomeScreen/HomeScreen";
import ClientFlow from "./components/ClientFlow/ClientFlow";
import BarberPanel from "./components/BarberPanel/BarberPanel";

export default function App() {
  const [data, setData] = useState(defaultData);
  const [view, setView] = useState("home");
  const [barberAuth, setBarberAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega dados ao montar o componente
  useEffect(() => {
    const init = async () => {
      try {
        const initialData = await loadData();
        setData(initialData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const update = (fn) => setData((prev) => {
    const next = fn(structuredClone(prev));
    saveData(next);
    return next;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontSize: "18px" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div>
      {view === "home" && <HomeScreen setView={setView} />}
      {view === "client" && (
        <ClientFlow data={data} update={update} setView={setView} />
      )}
      {view === "barber" && (
        <BarberPanel
          data={data}
          update={update}
          setView={setView}
          auth={barberAuth}
          setAuth={setBarberAuth}
        />
      )}
    </div>
  );
}
