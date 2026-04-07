import { useState } from "react";
import { loadData, saveData } from "./utils/data";
import HomeScreen from "./components/HomeScreen";
import ClientFlow from "./components/ClientFlow";
import BarberPanel from "./components/BarberPanel";
import { styles, css } from "./styles";

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("home");
  const [barberAuth, setBarberAuth] = useState(false);

  const update = (fn) => setData((prev) => {
    const next = fn(structuredClone(prev));
    saveData(next);
    return next;
  });

  return (
    <div style={styles.root}>
      <style>{css}</style>
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
