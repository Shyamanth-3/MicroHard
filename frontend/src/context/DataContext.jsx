import { createContext, useContext, useState } from "react";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [dataset, setDataset] = useState(null);

  return (
    <DataContext.Provider value={{ dataset, setDataset }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataset() {
  return useContext(DataContext);
}
